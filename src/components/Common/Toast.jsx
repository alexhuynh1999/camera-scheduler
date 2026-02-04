import { useEffect } from 'react'

export function Toast({ message, type = 'info', onClose, duration = 3000 }) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration)
        return () => clearTimeout(timer)
    }, [onClose, duration])

    const typeStyles = {
        info: 'bg-gray-900 border-white/10 text-white',
        error: 'bg-red-600 border-red-500/50 text-white',
        success: 'bg-green-600 border-green-500/50 text-white'
    }

    const icons = {
        info: (
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        error: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        success: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        )
    }

    return (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`${typeStyles[type]} px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border`}>
                {icons[type]}
                <span className="text-sm font-bold tracking-tight">{message}</span>
            </div>
        </div>
    )
}
