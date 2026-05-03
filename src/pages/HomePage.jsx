import { Link } from 'react-router-dom'
import { useAppState } from '../store/context.js'
import { TourCard } from '../components/tours/TourCard.jsx'

const categories = ['Hiking', 'Horse tour', 'Culture', 'Eco', 'Yurts', 'Lakes']

export function HomePage() {
  const { tours } = useAppState()
  const highlighted = tours.slice(0, 4)

  return (
    <div className="shell space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900">
        <img
          src="https://images.unsplash.com/photo-1591300914847-b7ca02f37210?auto=format&fit=crop&w=1800&q=80"
          alt="Kyrgyzstan mountain valley"
          className="h-[360px] w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-white">
          <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold">
            Discover Nomad Life
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight">
            Kyrgyzstan, where mountains touch the sky
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-100/90">
            Build your route with smart filters, map-driven exploration, and local host stories.
          </p>

          <div className="glass-card mt-6 grid gap-3 rounded-2xl border-white/20 bg-white/95 p-3 text-slate-700 md:grid-cols-5">
            <input placeholder="Where" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
            <input type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
            <input type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
            <input placeholder="Guests" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
            <Link
              to="/tours"
              className="flex items-center justify-center rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-amber-300"
            >
              Search tours
            </Link>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-3xl p-5">
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <button
              key={category}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                index === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Explore now</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900">What travelers search now</h2>
          </div>
          <Link to="/tours" className="text-sm font-bold text-slate-700 underline decoration-emerald-400 underline-offset-4">
            View all tours
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {highlighted.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </section>
    </div>
  )
}
