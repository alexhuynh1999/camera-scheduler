import { useState, useEffect } from 'react'
import './index.css'

import { UserEntry } from './components/Sidebar/UserEntry'
import { Summary } from './components/Sidebar/Summary'
import { FilterMultiSelect } from './components/Sidebar/FilterMultiSelect'
import { CalendarGrid } from './components/Calendar/CalendarGrid'

import { db } from './firebase'
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore'

function App() {
  // --- State ---
  const [view, setView] = useState('month') // 'month' | 'week' | '3day'
  const [currentDate, setCurrentDate] = useState(new Date())

  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState('')
  const [bookings, setBookings] = useState({})

  const [filterUserIds, setFilterUserIds] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // --- Real-time Subscriptions ---

  // 1. Users
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
      setUsers(userList)

      // Ensure valid current user
      if (userList.length > 0 && (!currentUser || !userList.find(u => u.id === currentUser))) {
        setCurrentUser(userList[0].id)
      }
    })
    return () => unsubscribe()
  }, []) // Empty dependency array: run once on mount

  // 2. Bookings
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const bookingsMap = {}
      snapshot.docs.forEach(doc => {
        bookingsMap[doc.id] = doc.data().userIds || []
      })
      setBookings(bookingsMap)
    })
    return () => unsubscribe()
  }, [])

  // --- Handlers ---

  const handleAddUser = async (user) => {
    const newId = 'u' + Date.now().toString().slice(-6)
    const newUser = { ...user, id: newId }
    try {
      await setDoc(doc(db, 'users', newId), newUser)
      setCurrentUser(newId)
    } catch (e) {
      console.error("Error adding user: ", e)
    }
  }

  const handleUpdateUser = async (id, newColor) => {
    try {
      await updateDoc(doc(db, 'users', id), { color: newColor })
    } catch (e) {
      console.error("Error updating user: ", e)
    }
  }

  const handleDeleteUser = async (id) => {
    if (users.length <= 1) {
      alert("Cannot delete the last user.")
      return
    }

    try {
      // 1. Delete user doc
      await deleteDoc(doc(db, 'users', id))

      // 2. Clean up bookings locally logic transformed to DB updates?
      // Ideally we should do this in a cloud function or batch, but for client-side app:
      // We iterate potentially impacted dates. 
      // NOTE: This could be heavy if many bookings. 
      // Simplification: Just filter the currently loaded `bookings` state and issue updates.

      Object.keys(bookings).forEach(async (date) => {
        if (bookings[date].includes(id)) {
          const newIds = bookings[date].filter(uid => uid !== id)
          if (newIds.length === 0) {
            await deleteDoc(doc(db, 'bookings', date))
          } else {
            await updateDoc(doc(db, 'bookings', date), { userIds: newIds })
          }
        }
      })

      // 3. Switch User if needed (handled by useEffect, but can preempt)
      if (currentUser === id) {
        const nextUser = users.find(u => u.id !== id)
        if (nextUser) setCurrentUser(nextUser.id)
      }

    } catch (e) {
      console.error("Error deleting user: ", e)
    }
  }

  const handleDateClick = async (dateStr) => {
    const current = bookings[dateStr] || []
    const isBooked = current.includes(currentUser)

    let updatedList
    if (isBooked) {
      updatedList = current.filter(id => id !== currentUser)
    } else {
      updatedList = [...current, currentUser]
    }

    try {
      if (updatedList.length === 0) {
        await deleteDoc(doc(db, 'bookings', dateStr))
      } else {
        await setDoc(doc(db, 'bookings', dateStr), { userIds: updatedList })
      }
    } catch (e) {
      console.error("Error updating booking: ", e)
    }
  }

  const navigateDate = (direction) => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      if (view === 'month') {
        d.setMonth(d.getMonth() + direction)
      } else if (view === 'week') {
        d.setDate(d.getDate() + (direction * 7))
      } else if (view === '3day') {
        d.setDate(d.getDate() + (direction * 3))
      }
      return d
    })
  }

  const getHeaderTitle = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.toLocaleString('default', { month: 'long' })

    if (view === 'month') {
      return `${month} ${year}`
    }

    // Calculate range for Week or 3 Day
    const start = new Date(currentDate)
    if (view === 'week') {
      const day = start.getDay()
      start.setDate(start.getDate() - day)
    }

    const end = new Date(start)
    const daysToAdd = view === 'week' ? 6 : 2 // 7 days total or 3 days total
    end.setDate(start.getDate() + daysToAdd)

    const startMonth = start.toLocaleString('default', { month: 'short' })
    const endMonth = end.toLocaleString('default', { month: 'short' })

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}`
    } else {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl flex flex-col p-6 border-r border-gray-100 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Scheduler</h1>
            <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-[10px] font-bold text-indigo-400 border border-indigo-100">v1.1</span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="mb-8">
          <UserEntry
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onSelectUser={setCurrentUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        </div>

        <div className="flex-1">
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

        {/* Admin Reset */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={async () => {
              const password = prompt("Enter admin password to reset all data:")
              if (password === "camelcamel") {
                if (confirm("Are you ABSOLUTELY sure? This will delete ALL users and bookings permanently.")) {
                  try {
                    // Delete all bookings
                    for (const dateStr of Object.keys(bookings)) {
                      await deleteDoc(doc(db, 'bookings', dateStr))
                    }
                    // Delete all users
                    for (const user of users) {
                      await deleteDoc(doc(db, 'users', user.id))
                    }
                    // State updates will happen automatically via onSnapshot
                  } catch (e) {
                    console.error("Error resetting data:", e)
                    alert("Error deleting data. Check console.")
                  }
                }
              } else if (password !== null) {
                alert("Incorrect password")
              }
            }}
            className="w-full py-2 px-4 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100 flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span>Reset Application</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header / Toolbar */}
        <header className="flex items-center justify-between px-4 md:px-8 py-5 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateDate(-1)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                aria-label="Previous"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => navigateDate(1)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <h2 className="text-sm md:text-xl font-semibold min-w-32 md:min-w-48 text-center select-none truncate">
              {getHeaderTitle()}
            </h2>
          </div>

          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            {/* Mobile Dropdown */}
            <div className="md:hidden relative">
              <select
                value={view}
                onChange={(e) => setView(e.target.value)}
                className="appearance-none bg-white text-indigo-600 text-sm font-semibold py-1.5 pl-3 pr-8 rounded-md shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="month">Month</option>
                <option value="week">Week</option>
                <option value="3day">3 Days</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-600">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex space-x-1">
              {[
                { id: 'month', label: 'Month' },
                { id: 'week', label: 'Week' },
                { id: '3day', label: '3 Days' }
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === v.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Calendar Grid Area */}
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full p-6">
            <CalendarGrid
              view={view}
              currentDate={currentDate}
              bookingsMap={bookings}
              onDateClick={handleDateClick}
              users={users}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
