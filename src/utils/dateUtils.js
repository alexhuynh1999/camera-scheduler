/**
 * Utility to format a Date object into a YYYY-MM-DD string
 * based on the local time (to avoid timezone shifts in toISOString())
 */
export const formatDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
