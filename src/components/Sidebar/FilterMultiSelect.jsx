import { useState, useEffect, useRef } from 'react'

export function FilterMultiSelect({ users, selectedUserIds, onChange }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleUser = (userId) => {
        const newSelection = selectedUserIds.includes(userId)
            ? selectedUserIds.filter(id => id !== userId)
            : [...selectedUserIds, userId]
        onChange(newSelection)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white dark:bg-[#1a1b26] border border-gray-200 dark:border-[#2f334d] text-gray-700 dark:text-[#a9b1d6] py-2 px-3 rounded-lg flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
            >
                <div className="flex items-center gap-1 truncate">
                    {selectedUserIds.length === 0 ? (
                        <span className="text-gray-400">No filter (Everyone)</span>
                    ) : (
                        <div className="flex -space-x-1">
                            {selectedUserIds.map(id => {
                                const u = users.find(user => user.id === id)
                                if (!u) return null
                                return (
                                    <div
                                        key={id}
                                        className="w-4 h-4 rounded-full border border-white dark:border-[#1a1b26]"
                                        style={{ backgroundColor: u.color }}
                                        title={u.name}
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>
                <svg className={`fill-current h-3 w-3 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1a1b26] border border-gray-100 dark:border-[#2f334d] rounded-lg shadow-xl max-h-60 overflow-auto">
                    <div className="px-3 py-2 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider bg-gray-50 dark:bg-[#24283b] border-b border-gray-50 dark:border-[#2f334d]">
                        Require Attendance
                    </div>
                    {users.map(u => {
                        const isSelected = selectedUserIds.includes(u.id)
                        return (
                            <div
                                key={u.id}
                                onClick={() => toggleUser(u.id)}
                                className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                            >
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: u.color }} />
                                    <span className={`text-sm ${isSelected ? 'font-semibold text-indigo-900 dark:text-indigo-400' : 'text-gray-600 dark:text-[#a9b1d6]'}`}>
                                        {u.name}
                                    </span>
                                </div>
                                {isSelected && (
                                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                )}
                            </div>
                        )
                    })}
                    {selectedUserIds.length > 0 && (
                        <div
                            onClick={() => {
                                onChange([])
                                setIsOpen(false)
                            }}
                            className="text-center text-xs text-red-500 py-2 border-t border-gray-100 dark:border-[#2f334d] font-medium cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10"
                        >
                            Clear Filter
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
