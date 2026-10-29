import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout'
import Dashboard from '@/pages/Dashboard'
import Subjects from '@/pages/Subjects'
import Planner from '@/pages/Planner'
import WeeklyCalendar from '@/pages/WeeklyCalendar'
import MonthlyCalendar from '@/pages/MonthlyCalendar'
import Reviews from '@/pages/Reviews'
import AIChat from '@/pages/AIChat'
import Settings from '@/pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/weekly" element={<WeeklyCalendar />} />
          <Route path="/monthly" element={<MonthlyCalendar />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/chat" element={<AIChat />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
