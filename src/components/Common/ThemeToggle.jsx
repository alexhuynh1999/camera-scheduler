import { useStore } from '../../stores/useStore'

export function ThemeToggle() {
    const theme = useStore(state => state.theme)
    const setTheme = useStore(state => state.setTheme)

    const toggleTheme = () => {
        // If it was auto, we check what currently is applied
        const isDark = document.documentElement.classList.contains('dark')
        setTheme(isDark ? 'light' : 'dark')
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-[#24283b] text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-gray-200 dark:hover:border-[#2f334d] group"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <div className="relative w-5 h-5 flex items-center justify-center">
                {/* Sun Icon */}
                <svg
                    className={`w-5 h-5 absolute transition-all duration-500 transform ${theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                {/* Moon Icon */}
                <svg
                    className={`w-5 h-5 absolute transition-all duration-500 transform ${theme !== 'dark' ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            </div>
        </button>
    )
}
