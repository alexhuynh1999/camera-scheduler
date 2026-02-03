import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserEntry } from './Sidebar/UserEntry'
import { Summary } from './Sidebar/Summary'
import { FilterMultiSelect } from './Sidebar/FilterMultiSelect'
import { CalendarGrid } from './Calendar/CalendarGrid'
import { Tutorial } from './Tutorial'
import { db } from '../firebase'
import { Toast } from './Common/Toast'
import {
    collection,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    updateDoc,
    getDoc
} from 'firebase/firestore'

export function Scheduler() {
    const { eventCode } = useParams()
    const navigate = useNavigate()

    // --- State ---
    const [view, setView] = useState('month') // 'month' | 'week' | '3day'
    const [currentDate, setCurrentDate] = useState(new Date())

    const [users, setUsers] = useState([])
    const [currentUser, setCurrentUser] = useState('')
    const [bookings, setBookings] = useState({})

    const [filterUserIds, setFilterUserIds] = useState([])
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isValidEvent, setIsValidEvent] = useState(true)
    const [eventData, setEventData] = useState(null)
    const [toast, setToast] = useState(null)
    const [isTutorialOpen, setIsTutorialOpen] = useState(false)

    // Verify event existence and update lastAccessedAt
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
            if (window.innerWidth >= 768) setIsSidebarOpen(false)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // --- Real-time Subscriptions ---
    useEffect(() => {
        if (!eventCode) return
        const unsubscribe = onSnapshot(collection(db, 'events', eventCode, 'users'), (snapshot) => {
            const userList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
            setUsers(userList)
            if (userList.length > 0 && (!currentUser || !userList.find(u => u.id === currentUser))) {
                setCurrentUser(userList[0].id)
            }
        })
        return () => unsubscribe()
    }, [eventCode, currentUser])

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
    }, [eventCode])

    // --- Handlers ---
    const handleAddUser = async (user) => {
        const newId = 'u' + Date.now().toString().slice(-6)
        const newUser = { ...user, id: newId }
        try {
            await setDoc(doc(db, 'events', eventCode, 'users', newId), newUser)
            setCurrentUser(newId)
        } catch (e) {
            console.error("Error adding user: ", e)
            setToast({ message: "Error adding user.", type: 'error' })
        }
    }

    const handleUpdateUser = async (id, newColor) => {
        try {
            await updateDoc(doc(db, 'events', eventCode, 'users', id), { color: newColor })
        } catch (e) {
            console.error("Error updating user: ", e)
        }
    }

    const handleDeleteUser = async (id) => {
        if (users.length <= 1) {
            setToast({ message: "Cannot delete the last user.", type: 'error' })
            return
        }
        try {
            await deleteDoc(doc(db, 'events', eventCode, 'users', id))
            if (currentUser === id) {
                const nextUser = users.find(u => u.id !== id)
                if (nextUser) setCurrentUser(nextUser.id)
            }
        } catch (e) {
            console.error("Error deleting user: ", e)
            setToast({ message: "Error deleting user.", type: 'error' })
        }
    }

    const handleDateClick = async (dateStr) => {
        if (!currentUser) {
            setToast({ message: "Please add a user first to start scheduling.", type: 'info' })
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
    }

    const navigateDate = (direction) => {
        setCurrentDate(prev => {
            const d = new Date(prev)
            if (view === 'month') d.setMonth(d.getMonth() + direction, 1)
            else if (view === 'week') d.setDate(d.getDate() + (direction * 7))
            else if (view === '3day') d.setDate(d.getDate() + (direction * 3))
            return d
        })
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

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        setToast({ message: "Link copied!", type: 'success' })
    }

    const handleTutorialStepChange = (step, isAddUserTour) => {
        const isMobile = window.innerWidth < 768
        if (!isMobile) return
        if (!isAddUserTour && step === 2) setIsSidebarOpen(false)
        else if (!isAddUserTour && step >= 3) setIsSidebarOpen(true)
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
                    <div className="fixed inset-0 bg-black/5 md:hidden z-[45] backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)} />
                )}

                <Sidebar
                    currentUser={currentUser}
                    users={users}
                    onUserSelect={setCurrentUser}
                    onUserAdd={handleAddUser}
                    onUserDelete={handleDeleteUser}
                    onUserUpdate={handleUpdateUser}
                    bookings={bookings}
                    isOpen={isSidebarOpen}
                    setOpen={setIsSidebarOpen}
                    isTutorialOpen={isTutorialOpen}
                    setIsTutorialOpen={setIsTutorialOpen}
                    eventData={eventData}
                    eventCode={eventCode}
                    handleCopyLink={handleCopyLink}
                    filterUserIds={filterUserIds}
                    setFilterUserIds={setFilterUserIds}
                />

                <main className="flex-1 flex flex-col overflow-hidden">
                    <header id="calendar-header" className="flex items-center justify-between px-4 md:px-8 py-5 bg-white border-b border-gray-200">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md">
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
                            <CalendarGrid view={view} currentDate={currentDate} bookingsMap={bookings} onDateClick={handleDateClick} users={users} />
                        </div>
                    </div>
                    <footer className="py-2 text-center bg-gray-50 border-t border-gray-100">
                        <span className="text-[9px] font-bold text-gray-300 tracking-widest uppercase">Version 1.3.0</span>
                    </footer>
                </main>
            </main>

            <Tutorial
                isOpen={isTutorialOpen}
                setOpen={setIsTutorialOpen}
                onClose={(tour) => setIsTutorialOpen(tour || false)}
                currentUser={currentUser}
                users={users}
                onStepChange={handleTutorialStepChange}
            />

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </div>
    )
}

function Sidebar({
    currentUser, users, onUserSelect, onUserAdd, onUserDelete, onUserUpdate,
    bookings, isOpen, setOpen, isTutorialOpen, setIsTutorialOpen,
    eventData, eventCode, handleCopyLink, filterUserIds, setFilterUserIds
}) {
    return (
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl flex flex-col p-6 border-r border-gray-100 transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div id="sidebar-header" className="flex items-center justify-between mb-8">
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 truncate">
                            {eventData?.name || 'Scheduler'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-tighter">{eventCode}</span>
                        <button
                            id="copy-link-button"
                            onClick={handleCopyLink}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-md bg-indigo-50/50 border border-indigo-100/50"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            <span>Copy Link</span>
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setOpen(false)}
                    className="md:hidden p-1 text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="mb-6">
                <button
                    id="tutorial-button"
                    onClick={() => setIsTutorialOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100 group shadow-sm mb-2"
                >
                    <svg className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm">How do I use this?</span>
                </button>
            </div>

            <div id="user-section" className="mb-8">
                <UserEntry
                    users={users}
                    currentUser={currentUser}
                    onAddUser={onUserAdd}
                    onSelectUser={onUserSelect}
                    onUpdateUser={onUserUpdate}
                    onDeleteUser={onUserDelete}
                />
            </div>

            <div id="summary-section" className="flex-1 overflow-y-auto min-h-0">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs uppercase tracking-wider text-gray-400 font-bold">Summary</h2>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Filter</span>
                </div>

                <div className="mb-4">
                    <FilterMultiSelect
                        users={users}
                        selectedUserIds={filterUserIds}
                        onChange={setFilterUserIds}
                    />
                </div>

                <Summary bookings={bookings} users={users} filterUserIds={filterUserIds} />
            </div>
        </aside>
    )
}
