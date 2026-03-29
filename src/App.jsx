import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './landing/LandingPage'
import Impressum from './pages/Impressum'
import Datenschutz from './pages/Datenschutz'

const Dashboard = lazy(() => import('./Dashboard'))

function AppLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/app"
        element={
          <Suspense fallback={<AppLoading />}>
            <Dashboard />
          </Suspense>
        }
      />
      <Route path="/impressum" element={<Impressum />} />
      <Route path="/datenschutz" element={<Datenschutz />} />
    </Routes>
  )
}
