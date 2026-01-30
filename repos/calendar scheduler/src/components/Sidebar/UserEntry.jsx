import { useState, useEffect, useRef } from 'react'

export function UserEntry({ users, currentUser, onAddUser, onSelectUser, onUpdateUser, onDeleteUser }) {
    const [name, setName] = useState('')
    const [color, setColor] = useState('#6366f1') // Default indigo-500

    const handleAdd = (e) => {
        e.preventDefault()
        if (!name.trim()) return
        onAddUser({ name, color })
        setName('')
    }

    return (
        <div className="space-y-6">
            {/* Current User Display */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Active User</label>
                <div className="flex items-center space-x-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner"
                        style={{ backgroundColor: users.find(u => u.id === currentUser)?.color }}
                    >
                        {users.find(u => u.id === currentUser)?.name[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800">
                            {users.find(u => u.id === currentUser)?.name}
                        </div>
                        <div className="text-xs text-gray-400">Ready to book</div>
                    </div>
                </div>
            </div>

            {/* User Switcher / List */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Switch User</label>
                <CustomDropdown
                    users={users}
                    currentUser={currentUser}
                    onSelect={onSelectUser}
                    onUpdateUser={onUpdateUser}
                    onDeleteUser={onDeleteUser}
                />
            </div>

            {/* Add New User */}
            <form onSubmit={handleAdd} className="pt-4 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Create Profile</label>
                <div className="space-y-3">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter name..."
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-400"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="h-9 w-12 p-0 border-0 rounded bg-transparent cursor-pointer"
                        />
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="flex-1 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        const handleClick = () => setContextMenu(null)
        window.addEventListener('click', handleClick)
        return () => window.removeEventListener('click', handleClick)
    }, [])

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-lg flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: selectedUser?.color }} />
                    <span className="text-sm">{selectedUser?.name}</span>
                </div>
                <svg className={`fill-current h-4 w-4 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                                    className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 text-left cursor-pointer group relative ${currentUser === u.id ? 'bg-indigo-50 text-indigo-900 font-medium' : 'text-gray-700'}`}
                                >
                                    <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: u.color }} />
                                    <span className="flex-1">{u.name}</span>
                                    <span className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 hidden md:inline">Right-click edit</span>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center italic">No users found</div>
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
                    className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-lg py-1 w-32 flex flex-col"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 border-b border-gray-100 text-xs text-gray-400 font-bold uppercase tracking-wider">
                        Options
                    </div>
                    <label className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                        <span className="flex-1">Color</span>
                        <input
                            type="color"
                            className="w-4 h-4 p-0 border-0 rounded overflow-hidden"
                            onChange={(e) => {
                                onUpdateUser(contextMenu.userId, e.target.value)
                                // Don't close immediately so they can see change? Or close?
                                // Let's close for cleaner feel
                                setContextMenu(null)
                            }}
                        />
                    </label>
                    <button
                        className="text-left px-3 py-2 hover:bg-red-50 text-red-600 text-sm w-full"
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
