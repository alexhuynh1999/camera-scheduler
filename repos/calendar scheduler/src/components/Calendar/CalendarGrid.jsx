import { useStore } from '../../stores/useStore'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'

export function CalendarGrid() {
    // Connect to store
    const view = useStore(state => state.view)
    const currentDate = useStore(state => state.currentDate)
    const bookings = useStore(state => state.bookings)
    const users = useStore(state => state.users)
    const toggleBooking = useStore(state => state.toggleBooking)

    // We need eventCode for toggleBooking. 
    // We can get it from useParams again or pass it. 
    // Since CalendarGrid could be reusable, but here it's specific.
    // Let's use useParams.

    return <CalendarGridWithParams
        view={view}
        currentDate={currentDate}
        bookings={bookings}
        users={users}
        toggleBooking={toggleBooking}
    />
}

import { useParams } from 'react-router-dom'

function CalendarGridWithParams({ view, currentDate, bookings, users, toggleBooking }) {
    const { eventCode } = useParams()

    const handleDateClick = (dateStr) => {
        toggleBooking(eventCode, dateStr)
    }

    if (view === 'month') {
        return (
            <MonthView
                currentDate={currentDate}
                bookingsMap={bookings}
                onDateClick={handleDateClick}
                users={users}
            />
        )
    }

    if (view === 'week') {
        return (
            <WeekView
                currentDate={currentDate}
                bookingsMap={bookings}
                onDateClick={handleDateClick}
                users={users}
                daysToShow={7}
            />
        )
    }

    if (view === '3day') {
        return (
            <WeekView
                currentDate={currentDate}
                bookingsMap={bookings}
                onDateClick={handleDateClick}
                users={users}
                daysToShow={3}
            />
        )
    }

    return null
}
