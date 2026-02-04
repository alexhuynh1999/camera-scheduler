import { useState, useRef, useEffect } from 'react'
import { ColorPicker } from '../Common/ColorPicker'
import { useStore } from '../../stores/useStore'

export function UserEntry() {
    const users = useStore(state => state.users)
    const currentUser = useStore(state => state.currentUser)
    const addUser = useStore(state => state.addUser)
    const setCurrentUser = useStore(state => state.setCurrentUser)
    const updateUser = useStore(state => state.updateUser)
    const deleteUser = useStore(state => state.deleteUser)

    // We need eventCode here to pass to actions?
    // Oh right, the store actions `addUser(eventCode, user)` require eventCode.
    // I didn't store eventCode in the global store because it's derived from URL.
    // Options:
    // 1. Store eventCode in store when Scheduler mounts.
    // 2. Pass eventCode down from Sidebar -> UserEntry.
    // 3. Use `useParams` in UserEntry.

    // Option 3 is cleanest if UserEntry is always under a route. It is.

    // START_HACK: Need to import useParams to get eventCode
    // I need to add import.

    /* 
       Wait, I can't import useParams inside this code block string easily if I didn't include it. 
       I will include it.
    */

    // Rewriting component
    return <UserEntryWithParams />
}

import { useParams } from 'react-router-dom'

function UserEntryWithParams() {
    const { eventCode } = useParams()
    const users = useStore(state => state.users)
    const currentUser = useStore(state => state.currentUser)
    const addUser = useStore(state => state.addUser)
    const setCurrentUser = useStore(state => state.setCurrentUser)
    const updateUser = useStore(state => state.updateUser)
    const deleteUser = useStore(state => state.deleteUser)

    const [name, setName] = useState('')
    const [color, setColor] = useState('#6366f1') // Default indigo-500

    const handleAdd = (e) => {
        e.preventDefault()
        if (!name.trim()) return
        addUser(eventCode, { name, color })
        setName('')
    }

    const handleUpdate = (userId, newColor) => {
        updateUser(eventCode, userId, newColor)
    }

    const handleDelete = (userId) => {
        deleteUser(eventCode, userId)
    }

    return (
        <div className="space-y-6">
            {/* Current User Display */}
            <div className="bg-white dark:bg-[#1a1b26] p-4 rounded-xl border border-gray-100 dark:border-[#2f334d] shadow-sm">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">Active User</label>
                <div className="flex items-center space-x-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner"
                        style={{ backgroundColor: users.find(u => u.id === currentUser)?.color }}
                    >
                        {users.find(u => u.id === currentUser)?.name[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800 dark:text-[#c0caf5]">
                            {users.find(u => u.id === currentUser)?.name}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">Ready to book</div>
                    </div>
                </div>
            </div>

            {/* User Switcher / List */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Switch User</label>
                <CustomDropdown
                    users={users}
                    currentUser={currentUser}
                    onSelect={setCurrentUser}
                    onUpdateUser={handleUpdate}
                    onDeleteUser={handleDelete}
                />
            </div>

            {/* Add New User */}
            <form onSubmit={handleAdd} className="pt-4 border-t border-gray-100 dark:border-[#2f334d]">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">Create Profile</label>
                <div className="space-y-3">
                    <div>
                        <input
                            id="user-name-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter name..."
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-[#24283b] border border-gray-200 dark:border-[#2f334d] rounded-lg text-sm text-gray-900 dark:text-[#a9b1d6] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-400 dark:placeholder-gray-600"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <ColorPicker
                            id="user-color-input"
                            color={color}
                            onChange={setColor}
                        />
                        <button
                            id="add-user-submit-button"
                            type="submit"
                            disabled={!name.trim()}
                            className="flex-1 bg-gray-900 dark:bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-black dark:hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add User
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}

function CustomDropdown({ users, currentUser, onSelect, onUpdateUser, onDeleteUser }) {
    const [isOpen, setIsOpen] = useState(false)
    const [contextMenu, setContextMenu] = useState(null) // { x, y, userId }
    const [longPressTimer, setLongPressTimer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('')
    const inputRef = useRef(null)
    const contextMenuRef = useRef(null)

    const selectedUser = users.find(u => u.id === currentUser) || users[0]

    // Filter users based on search
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleContextMenu = (e, userId) => {
        e.preventDefault();
        // Adjust coordinates for mobile if needed, though context menu usually works with clientX/Y
        // For touch events, we might need to look at touches[0]
        const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        const y = e.clientY || (e.touches && e.touches[0].clientY) || 0;

        setContextMenu({ x, y, userId });
    };

    const handleTouchStart = (e, userId) => {
        const touch = e.touches[0];
        const timer = setTimeout(() => {
            handleContextMenu({
                preventDefault: () => { },
                clientX: touch.clientX,
                clientY: touch.clientY
            }, userId);
        }, 800); // 800ms long press
        setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    // Focus input when opening
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    // Close menu when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                setContextMenu(null)
            }
        }
        window.addEventListener('click', handleClick)
        return () => window.removeEventListener('click', handleClick)
    }, [])

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white dark:bg-[#1a1b26] border border-gray-200 dark:border-[#2f334d] text-gray-700 dark:text-[#a9b1d6] py-2 px-3 rounded-lg flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-700" style={{ backgroundColor: selectedUser?.color }} />
                    <span className="text-sm">{selectedUser?.name}</span>
                </div>
                <svg className={`fill-current h-4 w-4 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#1a1b26] border border-gray-100 dark:border-[#2f334d] rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100 dark:border-[#2f334d]">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-[#24283b] border border-gray-200 dark:border-[#2f334d] rounded text-gray-900 dark:text-[#a9b1d6] focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400 dark:placeholder-gray-600"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => {
                                        onSelect(u.id);
                                        setIsOpen(false);
                                        setSearchTerm(''); // Reset search
                                    }}
                                    onContextMenu={(e) => handleContextMenu(e, u.id)}
                                    onTouchStart={(e) => handleTouchStart(e, u.id)}
                                    onTouchEnd={handleTouchEnd}
                                    onTouchMove={handleTouchEnd} // Cancel on scroll/move
                                    className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#24283b] text-left cursor-pointer group relative ${currentUser === u.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-[#a9b1d6]'}`}
                                >
                                    <div className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-700" style={{ backgroundColor: u.color }} />
                                    <span className="flex-1">{u.name}</span>
                                    <span className="text-xs text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hidden md:inline">Right-click edit</span>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-600 text-center italic">No users found</div>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop to close dropdown */}
            {isOpen && (
                <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed z-50 bg-white dark:bg-[#1a1b26] border border-gray-200 dark:border-[#2f334d] shadow-xl rounded-lg py-1 w-48 flex flex-col"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-[#2f334d] text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                        Options
                    </div>
                    <div className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#24283b] text-sm text-gray-700 dark:text-[#a9b1d6] justify-between group">
                        <span>Color</span>
                        <div onClick={(e) => e.stopPropagation()}>
                            <ColorPicker
                                color={users.find(u => u.id === contextMenu.userId)?.color || '#000000'}
                                onChange={(newColor) => {
                                    onUpdateUser(contextMenu.userId, newColor)
                                }}
                            />
                        </div>
                    </div>
                    <button
                        className="text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm w-full transition-colors"
                        onClick={() => {
                            onDeleteUser(contextMenu.userId)
                            setContextMenu(null)
                        }}
                    >
                        Delete User
                    </button>
                </div>
            )}
        </div>
    )
}
