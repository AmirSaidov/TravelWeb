import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppActions } from '../store/context.js'

export function LoginPage() {
  const { login } = useAppActions()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '' })

  const targetRoute = location.state?.from || '/'

  const onSubmit = (event) => {
    event.preventDefault()
    if (!form.name || !form.email) return
    login(form)
    navigate(targetRoute, { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#0f766e33,transparent_40%),radial-gradient(circle_at_bottom_left,#3b82f633,transparent_45%)]" />
      <form
        onSubmit={onSubmit}
        className="glass-card relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-white/90 p-8 shadow-2xl"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Auth flow</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Welcome to Kyrgyzstan Travel</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to access tours, maps and planning tools.</p>

        <div className="mt-7 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Name
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nurbek"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="nurbek@mail.com"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
            />
          </label>
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-extrabold text-white transition hover:bg-slate-700"
        >
          Continue
        </button>
      </form>
    </div>
  )
}
