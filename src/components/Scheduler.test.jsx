import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Scheduler } from './Scheduler'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useStore } from '../stores/useStore'

// Mock Firebase
vi.mock('../firebase', () => ({
    db: {}
}))
vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => true, data: () => ({ name: 'Test Event' }) })),
    updateDoc: vi.fn(),
    collection: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()),
}))

// Mock Sub-components to isolate Scheduler logic if needed, 
// but integration testing the whole tree is better for smoke test.
// However, Sidebar might cause issues if not mocked.
// Let's try to render the whole thing.

describe('Scheduler Component', () => {
    it('renders loading or event content', async () => {
        // Need to wrap in Router because Scheduler uses useParams/useNavigate
        // And we need an eventCode parameter.

        // Mock store state
        useStore.setState({
            users: [],
            currentUser: '',
            isSidebarOpen: true
        })

        render(
            <MemoryRouter initialEntries={['/event/123']}>
                <Routes>
                    <Route path="/event/:eventCode" element={<Scheduler />} />
                </Routes>
            </MemoryRouter>
        )

        // It might first show "Event Not Found" if the async check fails or hasn't completed?
        // The checkEvent effect is async.
        // It should eventually render.

        // Wait for something to appear.
        // The Sidebar has the event name "Test Event" (from mock getDoc).

        const title = await screen.findByText(/Test Event/i)
        expect(title).toBeInTheDocument()
    })
})
