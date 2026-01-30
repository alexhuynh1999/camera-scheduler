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

  const changeMonth = (offset) => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + offset)
      return d
    })
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-white shadow-xl flex flex-col p-6 z-20 overflow-y-auto border-r border-gray-100">
        <h1 className="text-2xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Scheduler</h1>

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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header / Toolbar */}
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                aria-label="Previous Month"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                aria-label="Next Month"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <h2 className="text-xl font-semibold w-48 text-center select-none">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
          </div>

          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            {['month', 'week', '3day'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === v
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
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
