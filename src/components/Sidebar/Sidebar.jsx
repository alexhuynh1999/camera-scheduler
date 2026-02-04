import { useState } from 'react'
import { useStore } from '../../stores/useStore'
import { UserEntry } from './UserEntry'
import { Summary } from './Summary'
import { FilterMultiSelect } from './FilterMultiSelect'
import { ThemeToggle } from '../Common/ThemeToggle'

export function Sidebar({ eventData, eventCode, handleCopyLink }) {
    const users = useStore(state => state.users)
    const currentUser = useStore(state => state.currentUser)
    const bookings = useStore(state => state.bookings)
    const isOpen = useStore(state => state.isSidebarOpen)
    const setOpen = useStore(state => state.setSidebarOpen)
    const setTutorialOpen = useStore(state => state.setTutorialOpen)

    // Actions from store
    const addUser = useStore(state => state.addUser)
    const updateUser = useStore(state => state.updateUser)
    const deleteUser = useStore(state => state.deleteUser)
    const setCurrentUser = useStore(state => state.setCurrentUser)

    const [filterUserIds, setFilterUserIds] = useState([])

    return (
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-[#1a1b26] shadow-xl flex flex-col p-6 border-r border-gray-100 dark:border-[#2f334d] transition-transform duration-300 ease-in-out
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
                        <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#24283b] px-2 py-0.5 rounded border border-gray-100 dark:border-[#2f334d] uppercase tracking-tighter">{eventCode}</span>
                        <button
                            id="copy-link-button"
                            onClick={handleCopyLink}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors px-2 py-1 rounded-md bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/50"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            <span>Copy Link</span>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <button
                        onClick={() => setOpen(false)}
                        className="md:hidden p-1 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar -mx-6 px-6 min-h-0">
                <div className="mb-6">
                    <button
                        id="tutorial-button"
                        onClick={() => setTutorialOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 dark:bg-[#24283b] text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-[#2f334d] transition-all border border-indigo-100 dark:border-[#2f334d] group shadow-sm mb-2"
                    >
                        <svg className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-sm">How do I use this?</span>
                    </button>
                </div>

                <div id="user-section" className="mb-8">
                    <UserEntry />
                </div>

                <div id="summary-section" className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold">Summary</h2>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#24283b] px-1.5 py-0.5 rounded">Filter</span>
                    </div>

                    <div className="mb-4">
                        <FilterMultiSelect
                            users={users}
                            selectedUserIds={filterUserIds}
                            onChange={setFilterUserIds}
                        />
                    </div>

                    <Summary filterUserIds={filterUserIds} />
                </div>
            </div>
        </aside>
    )
}
