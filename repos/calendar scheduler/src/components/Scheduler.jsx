import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar/Sidebar'
import { CalendarGrid } from './Calendar/CalendarGrid'
import { Tutorial } from './Tutorial'
import { db } from '../firebase'
import { Toast } from './Common/Toast'
import { useStore } from '../stores/useStore'
import { collection, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore'

export function Scheduler() {
    const { eventCode } = useParams()
    const navigate = useNavigate()

    // Store Selectors
    const view = useStore(state => state.view)
    const setView = useStore(state => state.setView)
    const currentDate = useStore(state => state.currentDate)
    const navigateDate = useStore(state => state.navigateDate)

    const setUsers = useStore(state => state.setUsers)
    const setBookings = useStore(state => state.setBookings)
    const setCurrentUser = useStore(state => state.setCurrentUser)
    const currentUser = useStore(state => state.currentUser) // needed for subscription check

    const isSidebarOpen = useStore(state => state.isSidebarOpen)
    const setSidebarOpen = useStore(state => state.setSidebarOpen)
    const isTutorialOpen = useStore(state => state.isTutorialOpen)
    const setTutorialOpen = useStore(state => state.setTutorialOpen)
    const toast = useStore(state => state.toast)
    const setToast = useStore(state => state.setToast)

    // Local state for event validation/data
    const [isValidEvent, setIsValidEvent] = useState(true)
    const [eventData, setEventData] = useState(null)

    // Verify event existence
    useEffect(() => {
        const checkEvent = async () => {
            if (!eventCode) return
            const eventRef = doc(db, 'events', eventCode)
            try {
                const eventSnap = await getDoc(eventRef)
                if (eventSnap.exists()) {
                    setEventData(eventSnap.data())
                    await updateDoc(eventRef, { lastAccessedAt: new Date().toISOString() })
                } else {
                    setIsValidEvent(false)
                }
            } catch (e) {
                console.error("Error checking event:", e)
                setIsValidEvent(false)
            }
        }
        checkEvent()
    }, [eventCode])

    // Close mobile sidebar on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setSidebarOpen(false)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [setSidebarOpen])

    // --- Real-time Subscriptions ---
    useEffect(() => {
        if (!eventCode) return
        const unsubscribe = onSnapshot(collection(db, 'events', eventCode, 'users'), (snapshot) => {
            const userList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
            setUsers(userList)

            // Auto-select first user if none selected
            // Use local check against the freshly fetched lists or store state
            // note: currentUser from store might be stale in closure if not in dependency, 
            // but we want to avoid re-triggering sub logic. 
            // Best to check if store's currentUser is valid. 
            // We can do a quick check:
            const current = useStore.getState().currentUser
            if (userList.length > 0 && (!current || !userList.find(u => u.id === current))) {
                setCurrentUser(userList[0].id)
            }
        })
        return () => unsubscribe()
    }, [eventCode, setUsers, setCurrentUser])

    useEffect(() => {
        if (!eventCode) return
        const unsubscribe = onSnapshot(collection(db, 'events', eventCode, 'bookings'), (snapshot) => {
            const bookingsMap = {}
            snapshot.docs.forEach(doc => {
                bookingsMap[doc.id] = doc.data().userIds || []
            })
            setBookings(bookingsMap)
        })
        return () => unsubscribe()
    }, [eventCode, setBookings])

    // Tutorial Helper
    const handleTutorialStepChange = (step, isAddUserTour) => {
        const isMobile = window.innerWidth < 768
        if (!isMobile) return

        if (!isAddUserTour && step === 2) {
            setSidebarOpen(false)
        } else {
            setSidebarOpen(true)
            // If it's the Real-time Summary step (index 3), scroll to the summary section
            if (!isAddUserTour && step === 3) {
                // Small timeout to allow sidebar transition/render
                setTimeout(() => {
                    const summaryEl = document.getElementById('summary-section')
                    if (summaryEl) {
                        summaryEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                }, 300)
            }
        }
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        setToast({ message: "Link copied!", type: 'success' })
    }

    const getHeaderTitle = () => {
        if (view === 'month') return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
        const start = new Date(currentDate)
        if (view === 'week') start.setDate(start.getDate() - start.getDay())
        const end = new Date(start)
        const daysToAdd = view === 'week' ? 6 : 2
        end.setDate(start.getDate() + daysToAdd)
        return `${start.toLocaleString('default', { month: 'short' })} ${start.getDate()} - ${end.toLocaleString('default', { month: 'short' })} ${end.getDate()}`
    }

    if (!isValidEvent) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                    <h1 className="text-3xl font-black text-gray-800">Event Not Found</h1>
                    <p className="text-gray-500">The event code you entered doesn't exist.</p>
                    <button onClick={() => navigate('/')} className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Go to Landing Page</button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-white text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
            <main className="flex-1 flex overflow-hidden relative">
                {isSidebarOpen && (
                    <div className="fixed inset-0 bg-black/5 md:hidden z-[45] backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setSidebarOpen(false)} />
                )}

                <Sidebar
                    eventData={eventData}
                    eventCode={eventCode}
                    handleCopyLink={handleCopyLink}
                />

                <main className="flex-1 flex flex-col overflow-hidden">
                    <header id="calendar-header" className="flex items-center justify-between px-4 md:px-8 py-5 bg-white border-b border-gray-200">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => navigateDate(-1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                                <button onClick={() => navigateDate(1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                            </div>
                            <h2 className="text-sm md:text-xl font-semibold min-w-32 md:min-w-48 text-center select-none truncate">{getHeaderTitle()}</h2>
                        </div>
                        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                            <div className="md:hidden relative">
                                <select value={view} onChange={(e) => setView(e.target.value)} className="appearance-none bg-white text-indigo-600 text-sm font-semibold py-1.5 pl-3 pr-8 rounded-md shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="month">Month</option>
                                    <option value="week">Week</option>
                                    <option value="3day">3 Days</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-600">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                            <div className="hidden md:flex space-x-1">
                                {[{ id: 'month', label: 'Month' }, { id: 'week', label: 'Week' }, { id: '3day', label: '3 Days' }].map((v) => (
                                    <button key={v.id} onClick={() => setView(v.id)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === v.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{v.label}</button>
                                ))}
                            </div>
                        </div>
                    </header>
                    <div id="calendar-view" className="flex-1 min-h-0 overflow-hidden p-2 md:p-8 relative">
                        <div id="calendar-grid-container" className="bg-white rounded-xl shadow-sm border border-gray-200 h-full p-3 md:p-6 overflow-auto">
                            <CalendarGrid />
                        </div>
                    </div>
                    <footer className="py-2 text-center bg-gray-50 border-t border-gray-100">
                        <span className="text-[9px] font-bold text-gray-300 tracking-widest uppercase">Version 1.4.0</span>
                    </footer>
                </main>
            </main>

            <Tutorial
                isOpen={isTutorialOpen}
                setOpen={setTutorialOpen}
                onClose={(tour) => setTutorialOpen(tour || false)}
                // Tutorial might still need props if it hasn't been refactored
                // Let's pass what we can or refactor it later.
                // Assuming Tutorial uses store or I'll pass store values for now
                // to avoid breaking it if I don't refactor it immediately.
                // But wait, the plan implies refactoring.
                // Tutorial needs: currentUser, users, onStepChange.
                // I will update Tutorial to use store later, but for now I should pass props if I want it to work
                // OR Update Tutorial Component NOW.
                // I'll update the component now to be safe.
                currentUser={currentUser}
                users={useStore(state => state.users)}
                onStepChange={handleTutorialStepChange}
            />

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </div>
    )
}
