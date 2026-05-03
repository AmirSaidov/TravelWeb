export function Footer() {
  return (
    <footer className="mt-10 bg-[#071432] text-slate-300">
      <div className="shell py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h4 className="text-lg font-bold text-white">Kyrgyzstan Travel</h4>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              We empower travelers to experience raw beauty while supporting local nomadic communities.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-white">Destinations</h5>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>Issyk-Kul Lake</li>
              <li>Ala Archa Gorge</li>
              <li>Song Kul Lake</li>
              <li>Pamir Mountains</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-white">Information</h5>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>Travel Visa</li>
              <li>Best Time to Visit</li>
              <li>Cultural Etiquette</li>
              <li>Safety Tips</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-white">Newsletter</h5>
            <p className="mt-4 text-sm text-slate-400">Get travel inspiration and secret deals.</p>
            <div className="mt-4 flex rounded-xl border border-slate-700 bg-slate-800 p-1">
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-500"
              />
              <button type="button" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500">
          <p>© 2026 Kyrgyzstan Travel. Licensed as tour operator #KG-4019.</p>
        </div>
      </div>
    </footer>
  )
}
