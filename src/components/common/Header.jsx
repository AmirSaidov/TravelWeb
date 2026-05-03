import { NavLink } from 'react-router-dom'
import { useAppActions, useAppState } from '../../store/context.js'

const navItems = [
  { label: 'Explore', to: '/' },
  { label: 'Tours', to: '/tours' },
  { label: 'Map', to: '/map' },
  { label: 'AI Assistant', to: '/assistant' },
  { label: 'Dashboard', to: '/dashboard' },
]

export function Header() {
  const { user } = useAppState()
  const { logout } = useAppActions()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="shell flex flex-wrap items-center justify-between gap-4 py-3">
        <NavLink to="/" className="text-lg font-extrabold text-slate-900">
          Kyrgyzstan Travel
        </NavLink>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {user?.avatar ?? 'G'}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-800 hover:text-slate-900"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
