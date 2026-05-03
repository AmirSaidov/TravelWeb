import { Outlet } from 'react-router-dom'
import { Header } from '../components/common/Header.jsx'
import { Footer } from '../components/common/Footer.jsx'

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
