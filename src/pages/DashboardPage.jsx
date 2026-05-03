import { useMemo } from 'react'
import { useAppState } from '../store/context.js'

export function DashboardPage() {
  const { favorites, tours, user } = useAppState()

  const favTours = useMemo(() => tours.filter((tour) => favorites.includes(tour.id)), [tours, favorites])

  return (
    <div className="shell">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Dashboard</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Welcome back, {user?.name}</h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="glass-card rounded-2xl p-5">
          <p className="text-sm text-slate-500">Saved tours</p>
          <h2 className="mt-2 text-4xl font-extrabold text-slate-900">{favorites.length}</h2>
        </article>
        <article className="glass-card rounded-2xl p-5">
          <p className="text-sm text-slate-500">Available routes</p>
          <h2 className="mt-2 text-4xl font-extrabold text-slate-900">{tours.length}</h2>
        </article>
        <article className="glass-card rounded-2xl p-5">
          <p className="text-sm text-slate-500">Top destination</p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Issyk-Kul</h2>
        </article>
      </section>

      <section className="glass-card mt-6 rounded-2xl p-5">
        <h3 className="text-xl font-bold text-slate-900">Favorite experiences</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {favTours.length === 0 && <p className="text-sm text-slate-500">No favorites yet. Add tours from listing.</p>}
          {favTours.map((tour) => (
            <article key={tour.id} className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{tour.type}</p>
              <h4 className="mt-1 font-bold text-slate-900">{tour.title}</h4>
              <p className="mt-1 text-sm text-slate-500">
                ${tour.price} · {tour.durationDays} days
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
