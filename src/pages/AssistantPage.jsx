const suggestedPlans = [
  { title: 'Cholpon-Ata Petroglyphs', subtitle: '4h trip · history + scenery', tag: 'Culture' },
  { title: 'Karakol to Jeti-Oguz', subtitle: 'Full day · canyon + horse riding', tag: 'Nature' },
  { title: 'Sunrise at Song-Kul', subtitle: '2 days · yurt camp', tag: 'Adventure' },
]

export function AssistantPage() {
  return (
    <div className="shell">
      <section className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">AI assistant panel</p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Kyrgyz Travel AI</h1>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Online</span>
        </header>

        <div className="space-y-3">
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm text-slate-700">
            Can you help me plan a 3-day trip to Issyk-Kul focused on hiking and local culture?
          </div>
          <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-emerald-500 px-4 py-3 text-sm text-slate-900">
            Great choice. I suggest a mix of alpine trails and village stays. Want a balanced or more adventurous route?
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <h2 className="text-sm font-bold text-slate-800">Suggested plan ideas</h2>
          <div className="mt-3 space-y-2">
            {suggestedPlans.map((item) => (
              <article key={item.title} className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700">{item.tag}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
              </article>
            ))}
          </div>
        </div>

        <label className="flex rounded-xl border border-slate-200 bg-white px-3 py-2">
          <input
            type="text"
            placeholder="Ask anything about routes, weather or visas..."
            className="w-full bg-transparent text-sm outline-none"
          />
          <button type="button" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Send
          </button>
        </label>
      </section>
    </div>
  )
}
