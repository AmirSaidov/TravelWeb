import { TOUR_TYPES } from '../../data/tours.js'
import { useAppActions, useAppState } from '../../store/context.js'

const durationOptions = [1, 3, 5, 7]

export function FiltersPanel() {
  const { filters } = useAppState()
  const { updateFilters, resetFilters } = useAppActions()

  const toggleDuration = (days) => {
    const exists = filters.durations.includes(days)
    const durations = exists ? filters.durations.filter((d) => d !== days) : [...filters.durations, days]
    updateFilters({ durations })
  }

  return (
    <aside className="glass-card h-fit rounded-2xl p-5">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-extrabold text-slate-900">Price range</h2>
        <button type="button" onClick={resetFilters} className="text-xs font-semibold text-emerald-700">
          Reset
        </button>
      </div>

      <div className="mb-8 space-y-2">
        <input
          type="range"
          min={50}
          max={1200}
          value={filters.maxPrice}
          onChange={(event) => updateFilters({ maxPrice: Number(event.target.value) })}
          className="w-full accent-emerald-500"
        />
        <p className="text-sm text-slate-600">Up to ${filters.maxPrice}</p>
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-bold text-slate-800">Duration</h3>
        <div className="space-y-2">
          {durationOptions.map((days) => (
            <label key={days} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={filters.durations.includes(days)}
                onChange={() => toggleDuration(days)}
                className="accent-emerald-500"
              />
              {days}+ days
            </label>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-bold text-slate-800">Difficulty</h3>
        <div className="flex flex-wrap gap-2">
          {['all', 'Easy', 'Moderate', 'Challenging'].map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              onClick={() => updateFilters({ difficulty })}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                filters.difficulty === difficulty ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {difficulty}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-800">Tour type</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateFilters({ type: 'all' })}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filters.type === 'all' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            All
          </button>
          {TOUR_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => updateFilters({ type })}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                filters.type === type ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
