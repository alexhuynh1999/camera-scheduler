import { create } from 'zustand'
import { db } from '../firebase'
import {
    collection,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    updateDoc
} from 'firebase/firestore'

export const useStore = create((set, get) => ({
    // Session State
    users: [],
    currentUser: '',
    bookings: {}, // { "YYYY-MM-DD": [userId1, userId2] }

    // UI State
    view: 'month', // 'month' | 'week' | '3day'
    currentDate: new Date(),
    isSidebarOpen: true,
    isTutorialOpen: false,
    toast: null,

    // Actions
    setToast: (toast) => set({ toast }),
    setView: (view) => set({ view }),
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    setTutorialOpen: (isOpen) => set({ isTutorialOpen: isOpen }),
    setCurrentUser: (userId) => set({ currentUser: userId }),
    setCurrentDate: (dateOrFn) => set(state => ({
        currentDate: typeof dateOrFn === 'function' ? dateOrFn(state.currentDate) : dateOrFn
    })),

    navigateDate: (direction) => {
        const { currentDate, view } = get()
        const d = new Date(currentDate)
        if (view === 'month') d.setMonth(d.getMonth() + direction, 1)
        else if (view === 'week') d.setDate(d.getDate() + (direction * 7))
        else if (view === '3day') d.setDate(d.getDate() + (direction * 3))
        set({ currentDate: d })
    },

    // Firebase -- Subscriptions handled in a separate effect or init function, 
    // but we store the data here.
    setUsers: (users) => set({ users }),
    setBookings: (bookings) => set({ bookings }),

    // Async Actions (Logic moved from Scheduler.jsx)
    addUser: async (eventCode, user) => {
        const newId = 'u' + Date.now().toString().slice(-6)
        const newUser = { ...user, id: newId }
        try {
            await setDoc(doc(db, 'events', eventCode, 'users', newId), newUser)
            set({ currentUser: newId })
        } catch (e) {
            console.error("Error adding user: ", e)
            get().setToast({ message: "Error adding user.", type: 'error' })
        }
    },

    updateUser: async (eventCode, userId, newColor) => {
        try {
            await updateDoc(doc(db, 'events', eventCode, 'users', userId), { color: newColor })
        } catch (e) {
            console.error("Error updating user: ", e)
        }
    },

    deleteUser: async (eventCode, userId) => {
        const { users, currentUser } = get()
        if (users.length <= 1) {
            get().setToast({ message: "Cannot delete the last user.", type: 'error' })
            return
        }
        try {
            await deleteDoc(doc(db, 'events', eventCode, 'users', userId))
            if (currentUser === userId) {
                const nextUser = users.find(u => u.id !== userId)
                if (nextUser) set({ currentUser: nextUser.id })
            }
        } catch (e) {
            console.error("Error deleting user: ", e)
            get().setToast({ message: "Error deleting user.", type: 'error' })
        }
    },

    toggleBooking: async (eventCode, dateStr) => {
        const { currentUser, bookings } = get()
        if (!currentUser) {
            get().setToast({ message: "Please add a user first to start scheduling.", type: 'info' })
            return
        }

        const current = bookings[dateStr] || []
        const isBooked = current.includes(currentUser)
        let updatedList = isBooked ? current.filter(id => id !== currentUser) : [...current, currentUser]

        try {
            if (updatedList.length === 0) {
                await deleteDoc(doc(db, 'events', eventCode, 'bookings', dateStr))
            } else {
                await setDoc(doc(db, 'events', eventCode, 'bookings', dateStr), { userIds: updatedList })
            }
        } catch (e) {
            console.error("Error updating booking: ", e)
        }
    },

    createEvent: async (eventName) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        const array = new Uint32Array(6)
        window.crypto.getRandomValues(array)
        let result = ''
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(array[i] % chars.length)
        }
        const code = result

        try {
            await setDoc(doc(db, 'events', code), {
                name: eventName.trim(),
                createdAt: new Date().toISOString(),
                lastAccessedAt: new Date().toISOString(),
                version: '1.4.0'
            })
            return code
        } catch (e) {
            console.error("Error creating event:", e)
            get().setToast({ message: "Failed to create event.", type: 'error' })
            throw e
        }
    }
}))
