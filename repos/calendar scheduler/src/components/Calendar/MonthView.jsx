import { useMemo } from 'react'

export function MonthView({ currentDate, bookings, bookingsMap, onDateClick, users }) {
    // Logic to generate days
    const days = useMemo(() => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() // 0-indexed

        // First day of month
        const firstDay = new Date(year, month, 1)
        // Last day of month
        const lastDay = new Date(year, month + 1, 0)

        // Day of week for first day (0 = Sunday)
        const startDayOfWeek = firstDay.getDay()

        const calendarDays = []

        // Previous month filler
        for (let i = 0; i < startDayOfWeek; i++) {
            const d = new Date(year, month, 1 - (startDayOfWeek - i))
            calendarDays.push({ date: d, isCurrentMonth: false })
        }

        // Current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i)
            calendarDays.push({ date: d, isCurrentMonth: true })
        }

        // Next month filler
        const remainingSlots = 42 - calendarDays.length // 6 rows * 7 cols
        for (let i = 1; i <= remainingSlots; i++) {
            const d = new Date(year, month + 1, i)
            calendarDays.push({ date: d, isCurrentMonth: false })
        }

        return calendarDays
    }, [currentDate])

    const isToday = (d) => {
        const today = new Date()
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
    }

    return (
        <div className="h-full flex flex-col">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">
                        {d}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 gap-2 auto-rows-fr">
                {days.map((dayObj, idx) => {
                    const dateStr = dayObj.date.toISOString().split('T')[0]
                    const bookedUserIds = bookingsMap[dateStr] || []

                    return (
                        <div
                            key={idx}
                            onClick={() => onDateClick(dateStr)}
                            className={`
                            relative p-1 rounded-xl border transition-all cursor-pointer flex flex-col items-start justify-start overflow-hidden group
                            ${dayObj.isCurrentMonth ? 'bg-white border-gray-100' : 'bg-gray-50 border-transparent text-gray-300'}
                            ${isToday(dayObj.date) ? 'ring-2 ring-indigo-500 ring-offset-2 z-10' : 'hover:border-indigo-200 hover:shadow-md'}
                        `}
                        >
                            <span className={`text-sm font-semibold ml-1 mt-1 ${isToday(dayObj.date) ? 'text-indigo-600' : 'text-gray-700'}`}>
                                {dayObj.date.getDate()}
                            </span>

                            {/* Users Dots/Avatars */}
                            <div className="flex-1 w-full p-1 flex flex-wrap content-start gap-1 overflow-y-auto mt-1 custom-scrollbar">
                                {bookedUserIds.map(uid => {
                                    const user = users.find(u => u.id === uid)
                                    if (!user) return null
                                    return (
                                        <div
                                            key={uid}
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: user.color }}
                                            title={user.name}
                                        />
                                    )
                                })}
                                {/* If lots of users, maybe show +X? */}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
