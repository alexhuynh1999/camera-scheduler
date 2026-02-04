import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './components/LandingPage'
import { Scheduler } from './components/Scheduler'
import { useStore } from './stores/useStore'
import './index.css'

function App() {
  const theme = useStore(state => state.theme)

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const checkTheme = () => {
      if (theme === 'dark') {
        root.classList.add('dark')
      } else if (theme === 'light') {
        root.classList.remove('dark')
      } else {
        const isSystemDark = mediaQuery.matches
        const hour = new Date().getHours()
        const isNightTime = hour >= 20 || hour < 7

        if (isSystemDark || isNightTime) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    }

    checkTheme()
    mediaQuery.addEventListener('change', checkTheme)
    const interval = setInterval(checkTheme, 60000)

    return () => {
      mediaQuery.removeEventListener('change', checkTheme)
      clearInterval(interval)
    }
  }, [theme])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/:eventCode" element={<Scheduler />} />
    </Routes>
  )
}

export default App
