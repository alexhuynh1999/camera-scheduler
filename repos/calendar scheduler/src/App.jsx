import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './components/LandingPage'
import { Scheduler } from './components/Scheduler'
import './index.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/:eventCode" element={<Scheduler />} />
    </Routes>
  )
}

export default App
