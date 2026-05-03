import { useMemo } from 'react'
import { FiltersPanel } from '../components/tours/FiltersPanel.jsx'
import { TourCard } from '../components/tours/TourCard.jsx'
import { useAppActions, useAppState } from '../store/context.js'

function filterTours(tours, filters) {
  return tours.filter((tour) => {
    const searchMatch = `${tour.title} ${tour.region}`.toLowerCase().includes(filters.search.toLowerCase())
    const priceMatch = tour.price <= filters.maxPrice
    const typeMatch = filters.type === 'all' || tour.type === filters.type
    const difficultyMatch = filters.difficulty === 'all' || tour.difficulty === filters.difficulty
    const durationMatch =
      filters.durations.length === 0 || filters.durations.some((day) => tour.durationDays >= day)

    return searchMatch && priceMatch && typeMatch && difficultyMatch && durationMatch
  })
}

export function ToursPage() {
  const { tours, filters } = useAppState()
  const { updateFilters } = useAppActions()

  const filteredTours = useMemo(() => filterTours(tours, filters), [tours, filters])

  return (
    <div className="shell">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Tour listing</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Tours in Kyrgyzstan</h1>
          <p className="mt-2 text-sm text-slate-500">Discover {filteredTours.length} curated experiences.</p>
        </div>
        <input
          value={filters.search}
          onChange={(event) => updateFilters({ search: event.target.value })}
          placeholder="Search tours or locations..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none md:w-80"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <FiltersPanel />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
          {filteredTours.length === 0 && (
            <div className="glass-card col-span-full rounded-2xl p-8 text-center text-slate-500">
              No tours match your filters yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
