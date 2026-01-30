import { MonthView } from './MonthView'
import { WeekView } from './WeekView'

export function CalendarGrid({ view, currentDate, bookings, bookingsMap, onDateClick, users }) {
    if (view === 'month') {
        return (
            <MonthView
                currentDate={currentDate}
                bookingsMap={bookingsMap}
                onDateClick={onDateClick}
                users={users}
            />
        )
    }

    if (view === 'week') {
        return (
            <WeekView
                currentDate={currentDate}
                bookingsMap={bookingsMap}
                onDateClick={onDateClick}
                users={users}
                daysToShow={7}
            />
        )
    }

    if (view === '3day') {
        return (
            <WeekView
                currentDate={currentDate}
                bookingsMap={bookingsMap}
                onDateClick={onDateClick}
                users={users}
                daysToShow={3}
            />
        )
    }

    return null
}
