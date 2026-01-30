import { useMemo } from 'react'

export function WeekView({ currentDate, bookingsMap, onDateClick, users, daysToShow = 7 }) {
    const days = useMemo(() => {
        // If daysToShow is 7, start from Sunday/Start of week
        // If 3, start from currentDate

        const start = new Date(currentDate)
        if (daysToShow === 7) {
            const day = start.getDay()
            start.setDate(start.getDate() - day)
        }

        const arr = []
        for (let i = 0; i < daysToShow; i++) {
            const d = new Date(start)
            d.setDate(start.getDate() + i)
            arr.push(d)
        }
        return arr
    }, [currentDate, daysToShow])

    const isToday = (d) => {
        const today = new Date()
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
    }

    return (
        <div className="h-full overflow-x-auto">
            <div className={`h-full grid gap-2 md:gap-4 min-w-[800px] md:min-w-0 ${daysToShow === 7 ? 'grid-cols-7' : 'grid-cols-3'}`}>
                {days.map((d, i) => {
                    const dateStr = d.toISOString().split('T')[0]
                    const bookedUserIds = bookingsMap[dateStr] || []

                    return (
                        <div
                            key={i}
                            onClick={() => onDateClick(dateStr)}
                            className={`
                            rounded-xl md:rounded-2xl border flex flex-col group transition-all cursor-pointer
                            ${isToday(d) ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-lg'}
                        `}
                        >
                            {/* Header */}
                            <div className={`p-2 md:p-4 text-center border-b border-gray-50 ${isToday(d) ? 'bg-indigo-100/50 text-indigo-700' : ''} rounded-t-xl md:rounded-t-2xl`}>
                                <div className="text-[10px] md:text-xs uppercase tracking-wider font-bold opacity-60">
                                    {d.toLocaleDateString('default', { weekday: 'short' })}
                                </div>
                                <div className="text-xl md:text-2xl font-black mt-1">
                                    {d.getDate()}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-2 md:p-3 space-y-1 md:space-y-2 overflow-y-auto">
                                {bookedUserIds.length > 0 ? (
                                    bookedUserIds.map(uid => {
                                        const user = users.find(u => u.id === uid)
                                        if (!user) return null
                                        return (
                                            <div
                                                key={uid}
                                                className="flex items-center space-x-1 md:space-x-2 p-1.5 md:p-2 rounded-lg bg-white shadow-sm border border-gray-100"
                                            >
                                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: user.color }} />
                                                <span className="text-[10px] md:text-xs font-semibold text-gray-700 truncate max-w-full">{user.name}</span>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <span className="text-[10px] md:text-xs text-gray-300 font-medium italic group-hover:text-indigo-300 transition-colors">
                                            Join
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
