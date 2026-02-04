import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStore } from './useStore'

// Mock crypto for createEvent
Object.defineProperty(global, 'crypto', {
    value: {
        getRandomValues: (arr) => arr.fill(1) // will generate 'BBBBBB'
    }
});

// Mock Firebase
vi.mock('../firebase', () => ({
    db: {}
}))

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    collection: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()), // Return unsubscribe fn
    getDoc: vi.fn(),
}))

describe('useStore', () => {
    beforeEach(() => {
        useStore.setState({
            users: [],
            currentUser: '',
            bookings: {},
            view: 'month',
            currentDate: new Date('2024-01-01T00:00:00'), // Explicit time to avoid timezone issues affecting day
            isSidebarOpen: true
        })
    })

    it('should initialize with default values', () => {
        const state = useStore.getState()
        expect(state.view).toBe('month')
        expect(state.users).toEqual([])
    })

    it('should set view', () => {
        useStore.getState().setView('week')
        expect(useStore.getState().view).toBe('week')
    })

    it('should navigate date', () => {
        useStore.getState().setView('month') // Ensure month view
        // Initial date is 2024-01-01
        useStore.getState().navigateDate(1) // +1 month
        const date = useStore.getState().currentDate

        // Check local time matching 2024-02-01
        expect(date.getMonth()).toBe(1) // Feb
        expect(date.getFullYear()).toBe(2024)
    })

    it('should set users', () => {
        const users = [{ id: '1', name: 'Alice' }]
        useStore.getState().setUsers(users)
        expect(useStore.getState().users).toEqual(users)
    })

    it('should add user (mocked)', async () => {
        const addUser = useStore.getState().addUser
        await addUser('testEvent', { name: 'Bob', color: '#000' })

        const state = useStore.getState()
        expect(state.currentUser).toMatch(/^u\d+/)
    })

    it('should delete user (mocked)', async () => {
        // Setup initial users
        const users = [
            { id: 'u1', name: 'A' },
            { id: 'u2', name: 'B' }
        ]
        useStore.setState({ users, currentUser: 'u1' })

        const deleteUser = useStore.getState().deleteUser
        await deleteUser('testEvent', 'u1')

        // Mock doesn't update 'users' state automatically because it depends on onSnapshot.
        // But we can check if deleteDoc was called.
        // And check if currentUser logic tried to run (but without snapshot update, users list is same).
        // Wait, store DELETE logic relies on `users` array?
        // `if (currentUser === id) { const nextUser = users.find... if (nextUser) set({ currentUser: nextUser.id }) }`
        // Since `users` in store didn't change (because onSnapshot is mocked), `nextUser` will be found (u2).

        const state = useStore.getState()
        // It should have switched to u2 (next available user in current list)
        expect(state.currentUser).toBe('u2')
    })

    it('should create event (mocked)', async () => {
        const createEvent = useStore.getState().createEvent
        const code = await createEvent('My New Event')

        expect(code).toBe('BBBBBB') // Based on mocked crypto
    })
})
