import { Link } from 'react-router-dom'
import { useAppActions, useAppState } from '../../store/context.js'

export function TourCard({ tour }) {
  const { favorites } = useAppState()
  const { toggleFavorite } = useAppActions()
  const isFavorite = favorites.includes(tour.id)

  return (
    <article className="glass-card fade-rise overflow-hidden rounded-2xl">
      <div className="relative h-44 overflow-hidden">
        <img src={tour.heroImage} alt={tour.title} className="h-full w-full object-cover transition duration-500 hover:scale-110" />
        <button
          type="button"
          onClick={() => toggleFavorite(tour.id)}
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
            isFavorite ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-700'
          }`}
        >
          {isFavorite ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{tour.type}</span>
          <span className="text-xs font-semibold text-amber-500">★ {tour.rating}</span>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">{tour.title}</h3>
          <p className="text-sm text-slate-500">
            {tour.durationDays} days · {tour.difficulty}
          </p>
        </div>

        <p className="line-clamp-2 text-sm text-slate-600">{tour.summary}</p>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            From <span className="text-lg font-extrabold text-slate-900">${tour.price}</span> / person
          </p>
          <Link
            to={`/tours/${tour.id}`}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  )
}
