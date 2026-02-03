import { useMemo, useState, useEffect } from 'react'
import { useStore } from '../../stores/useStore'

export function Summary({ filterUserIds }) { // Accepts filters as props (or could use store if filters moved there)
    const bookings = useStore(state => state.bookings)
    const users = useStore(state => state.users)

    const [currentIndex, setCurrentIndex] = useState(0)

    // Basic stats logic
    const stats = useMemo(() => {
        const counts = {}; // date -> Set(userIds)

        // Count users per date
        Object.entries(bookings).forEach(([date, userIds]) => {
            counts[date] = new Set(userIds);
        });

        // Filter by required users if set
        let eligibleDates = Object.keys(counts);

        if (filterUserIds && filterUserIds.length > 0) {
            eligibleDates = eligibleDates.filter(d => {
                const dateUsers = counts[d];
                // Check if ALL filter IDs are present in this date
                return filterUserIds.every(requiredId => dateUsers.has(requiredId));
            });
        }

        if (eligibleDates.length === 0) return null;

        // Find max count
        let maxCount = 0;

        eligibleDates.forEach(date => {
            const count = counts[date].size;
            if (count > maxCount) {
                maxCount = count;
            }
        });

        if (maxCount === 0) return null;

        // Find ALL dates with maxCount
        const bestDateStrings = eligibleDates.filter(date => counts[date].size === maxCount).sort();

        // Create array of best date objects
        const results = bestDateStrings.map(dateStr => {
            // Parse date as local time
            const [y, m, d] = dateStr.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);

            const presentUserIds = counts[dateStr];
            const missingUsers = users.filter(u => !presentUserIds.has(u.id));

            return {
                dateObj: dateObj,
                dateStr: dateStr,
                count: maxCount,
                missing: missingUsers,
                total: presentUserIds.size
            }
        });

        return results;
    }, [bookings, users, filterUserIds]);

    // Reset index when stats change
    useEffect(() => {
        setCurrentIndex(0)
    }, [stats])

    if (!stats || stats.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 text-sm">
                No data available for current selection.
            </div>
        )
    }

    const currentStat = stats[currentIndex];
    const displayDate = currentStat.dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

    const handlePrev = () => {
        setCurrentIndex(prev => (prev - 1 + stats.length) % stats.length)
    }

    const handleNext = () => {
        setCurrentIndex(prev => (prev + 1) % stats.length)
    }

    return (
        <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 relative">
                <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Best Date</div>
                    {stats.length > 1 && (
                        <div className="text-[10px] font-bold text-indigo-300 bg-white px-2 py-0.5 rounded-full">
                            {currentIndex + 1} / {stats.length}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    {stats.length > 1 && (
                        <button onClick={handlePrev} className="p-1 hover:bg-white/50 rounded-full text-indigo-400 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    )}

                    <div className="text-center flex-1">
                        <div className="text-xl font-bold text-indigo-900">{displayDate}</div>
                        <div className="text-sm text-indigo-600 font-medium mt-1">
                            {currentStat.count} {currentStat.count === 1 ? 'person' : 'people'} available
                        </div>
                    </div>

                    {stats.length > 1 && (
                        <button onClick={handleNext} className="p-1 hover:bg-white/50 rounded-full text-indigo-400 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    )}
                </div>
            </div>

            {currentStat.missing.length > 0 ? (
                <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Who's Missing</div>
                    <div className="flex flex-wrap gap-2">
                        {currentStat.missing.map(u => (
                            <div key={u.id} className="flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium border border-red-100">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: u.color }} />
                                <span>{u.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex items-center space-x-2 text-green-600 text-sm font-medium bg-green-50 p-3 rounded-lg border border-green-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>Everyone is available!</span>
                </div>
            )}
        </div>
    )
}
