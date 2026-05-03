export function BookingCard({ tour }) {
  return (
    <aside className="glass-card sticky top-24 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Price</p>
      <h3 className="mt-1 text-3xl font-extrabold text-slate-900">${tour.price}</h3>
      <p className="text-sm text-slate-500">per person</p>

      <div className="mt-5 grid gap-3">
        <label className="text-xs font-semibold text-slate-500">
          Check in
          <input type="date" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none" />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Check out
          <input type="date" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none" />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Guests
          <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none">
            <option>1 adult</option>
            <option>2 adults</option>
            <option>3 adults</option>
            <option>4 adults</option>
          </select>
        </label>
      </div>

      <button type="button" className="mt-5 w-full rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-emerald-400">
        Book now
      </button>

      <div className="mt-5 space-y-2 text-sm text-slate-600">
        <div className="flex justify-between">
          <span>${tour.price} × 2 nights</span>
          <span>${tour.price * 2}</span>
        </div>
        <div className="flex justify-between">
          <span>Service fee</span>
          <span>$25</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
          <span>Total</span>
          <span>${tour.price * 2 + 25}</span>
        </div>
      </div>
    </aside>
  )
}
