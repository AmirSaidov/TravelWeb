export function MapPage() {
  return (
    <div className="shell">
      <section className="glass-card relative overflow-hidden rounded-3xl border border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,#38bdf822,transparent_55%),radial-gradient(circle_at_80%_20%,#10b98122,transparent_50%)]" />

        <div className="relative grid min-h-[620px] gap-6 p-6 lg:grid-cols-[1fr_320px]">
          <div className="relative rounded-2xl border border-slate-200/80 bg-slate-100/70">
            <div className="absolute left-[20%] top-[55%] size-4 rounded-full bg-amber-400 shadow-[0_0_0_10px_rgba(251,191,36,0.2)]" />
            <div className="absolute left-[58%] top-[42%] size-5 rounded-full bg-emerald-500 shadow-[0_0_0_10px_rgba(16,185,129,0.2)]" />
            <div className="absolute left-[63%] top-[63%] size-3 rounded-full bg-emerald-500 shadow-[0_0_0_8px_rgba(16,185,129,0.2)]" />

            <svg viewBox="0 0 1000 500" className="absolute inset-0 h-full w-full opacity-40">
              <path d="M30 160 C 220 20, 340 280, 540 180 S 850 80, 980 220" fill="none" stroke="#6ee7b7" strokeDasharray="8 12" />
              <path d="M30 360 C 220 200, 360 450, 580 320 S 840 260, 980 380" fill="none" stroke="#93c5fd" strokeDasharray="8 12" />
            </svg>

            <div className="absolute bottom-4 left-4 flex gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs">
              <button type="button" className="rounded-full bg-emerald-500 px-3 py-1 font-semibold text-white">
                Hiking
              </button>
              <button type="button" className="rounded-full px-3 py-1 text-slate-600">
                Yurts
              </button>
              <button type="button" className="rounded-full px-3 py-1 text-slate-600">
                Lakes
              </button>
            </div>
          </div>

          <aside className="glass-card h-fit rounded-2xl p-4">
            <img
              src="https://images.unsplash.com/photo-1551524164-6cf2ac7fdb09?auto=format&fit=crop&w=900&q=80"
              alt="Issyk-Kul region"
              className="h-28 w-full rounded-xl object-cover"
            />
            <h2 className="mt-3 text-xl font-extrabold text-slate-900">Issyk-Kul Region</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-slate-100 p-2">
                <p className="font-bold text-slate-900">1,608m</p>
                <p className="text-slate-500">Altitude</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <p className="font-bold text-slate-900">22°C</p>
                <p className="text-slate-500">Weather</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <p className="font-bold text-slate-900">12+</p>
                <p className="text-slate-500">Top tours</p>
              </div>
            </div>
            <button type="button" className="mt-4 w-full rounded-xl bg-emerald-500 py-2 text-sm font-bold text-slate-900">
              Explore this region
            </button>
          </aside>
        </div>
      </section>
    </div>
  )
}
