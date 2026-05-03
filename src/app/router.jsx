import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAppState } from '../store/context.js'
import { LoginPage } from '../pages/LoginPage.jsx'
import { HomePage } from '../pages/HomePage.jsx'
import { ToursPage } from '../pages/ToursPage.jsx'
import { TourDetailsPage } from '../pages/TourDetailsPage.jsx'
import { MapPage } from '../pages/MapPage.jsx'
import { AssistantPage } from '../pages/AssistantPage.jsx'
import { DashboardPage } from '../pages/DashboardPage.jsx'
import { MainLayout } from '../layouts/MainLayout.jsx'

function ProtectedRoute() {
  const location = useLocation()
  const { isAuthenticated, isBootstrapped } = useAppState()

  if (!isBootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading experience...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

function PublicOnlyRoute() {
  const { isAuthenticated, isBootstrapped } = useAppState()
  if (!isBootstrapped) return null
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/:tourId" element={<TourDetailsPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
