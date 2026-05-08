import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, Layers, Navigation, ArrowRight } from "lucide-react";
import { regions, tours } from "@/mocks/data";
import { RatingStars } from "@/components/ui-bits/RatingStars";
import { Button } from "@/components/ui/button";

const MapPage = () => {
  const [selectedId, setSelectedId] = useState(regions[0].id);
  const [activity, setActivity] = useState<"hiking" | "yurts" | "lakes">("hiking");
  const region = regions.find((r) => r.id === selectedId)!;
  const topTours = region.topTourIds.map((id) => tours.find((tr) => tr.id === id)!).filter(Boolean);

  // Convert lat/lng → percentage on a 69-77E, 39-43N bounding box
  const project = (lat: number, lng: number) => ({
    left: `${((lng - 69) / (77 - 69)) * 100}%`,
    top: `${(1 - (lat - 39) / (43 - 39)) * 100}%`,
  });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-surface-muted">
      <div className="container-page grid min-h-[calc(100vh-4rem)] gap-6 py-6 lg:grid-cols-[1fr_400px]">
        {/* MAP CANVAS */}
        <div className="relative overflow-hidden rounded-3xl bg-[hsl(220_25%_94%)] ring-1 ring-border">
          {/* Stylised mountain silhouettes */}
          <svg viewBox="0 0 800 600" className="absolute inset-0 h-full w-full">
            <defs>
              <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.7" fill="hsl(220 15% 80%)" />
              </pattern>
            </defs>
            <rect width="800" height="600" fill="url(#dots)" opacity="0.5" />
            <path d="M 0 420 L 120 320 L 220 380 L 320 280 L 440 360 L 560 260 L 680 340 L 800 300 L 800 600 L 0 600 Z" fill="hsl(220 20% 88%)" opacity="0.7" />
            <path d="M 0 480 L 100 400 L 240 460 L 380 380 L 520 440 L 660 380 L 800 420 L 800 600 L 0 600 Z" fill="hsl(220 18% 84%)" opacity="0.6" />
            {/* Dotted routes */}
            <path d="M 80 380 Q 250 220 480 280 T 760 200" stroke="hsl(var(--brand))" strokeWidth="2" fill="none" strokeDasharray="2 8" opacity="0.55" />
            <path d="M 100 480 Q 280 420 460 460 T 740 420" stroke="hsl(var(--brand))" strokeWidth="2" fill="none" strokeDasharray="2 8" opacity="0.45" />
          </svg>

          {/* POI markers */}
          {regions.map((r) => {
            const pos = project(r.coordinates.lat, r.coordinates.lng);
            const active = r.id === selectedId;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                style={pos}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                aria-label={r.name}
              >
                <span className={`grid h-10 w-10 place-items-center rounded-full shadow-elevated ring-4 transition-all ${active ? "bg-brand text-brand-foreground ring-brand/25 scale-110" : "bg-card text-foreground ring-white"}`}>
                  <Navigation className="h-4 w-4" />
                </span>
                <span className={`absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-white/90 text-foreground"}`}>
                  {r.name.split(" ")[0]}
                </span>
              </button>
            );
          })}

          {/* Zoom controls */}
          <div className="absolute left-5 top-5 flex flex-col overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-elevated">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none text-primary-foreground hover:bg-white/10"><Plus className="h-4 w-4" /></Button>
            <div className="h-px bg-white/15" />
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none text-primary-foreground hover:bg-white/10"><Minus className="h-4 w-4" /></Button>
          </div>
          <Button variant="default" size="icon" className="absolute left-5 top-28 h-10 w-10 rounded-2xl bg-brand text-brand-foreground shadow-elevated hover:bg-brand/90">
            <Layers className="h-4 w-4" />
          </Button>

          {/* Bottom bar */}
          <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-card px-4 py-2.5 text-xs shadow-card ring-1 ring-border">
            <div>
              <div className="font-semibold uppercase tracking-wider text-muted-foreground">Coordinates</div>
              <div className="font-mono">{region.coordinates.lat.toFixed(2)}° N, {region.coordinates.lng.toFixed(2)}° E</div>
            </div>
            <div className="ml-2 flex gap-1.5">
              {(["hiking", "yurts", "lakes"] as const).map((a) => (
                <Button key={a} size="sm" variant={activity === a ? "secondary" : "ghost"} onClick={() => setActivity(a)} className={`rounded-full px-3 py-1 text-xs font-medium ${activity === a ? "bg-brand-soft text-accent-foreground hover:bg-brand-soft" : "text-muted-foreground hover:text-foreground"}`}>{a}</Button>
              ))}
            </div>
          </div>
        </div>

        {/* INFO PANEL */}
        <aside className="overflow-hidden rounded-3xl bg-card shadow-elevated ring-1 ring-border">
          <div className="relative h-44">
            <img src={region.hero} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute left-4 top-4 rounded-md bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-foreground">TOP RATED REGION</span>
            <h2 className="absolute bottom-4 left-4 font-display text-2xl font-semibold text-white">{region.name}</h2>
          </div>

          <div className="grid grid-cols-3 border-b border-border px-5 py-4 text-center">
            <Stat label="TOURS" value={region.toursCount.toString()} />
            <Stat label="ALTITUDE" value={`${region.altitude.toLocaleString()}m`} />
            <Stat label="WEATHER" value={`${region.weatherC}°C`} />
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">Top Tours in this Region</h3>
              <Link to="/explore" className="text-xs font-medium text-brand hover:underline">See all</Link>
            </div>
            <div className="space-y-3">
              {topTours.map((tr) => (
                <Link key={tr.id} to={`/tour/${tr.slug}`} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted/60">
                  <img src={tr.hero} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold">{tr.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <RatingStars value={tr.rating} size={12} /> ({tr.reviewCount} reviews)
                    </div>
                    <div className="mt-0.5 text-xs"><span className="font-semibold">${tr.price}</span> / person</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-border p-5">
            <Button asChild className="h-12 w-full rounded-xl bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to="/explore">Explore This Region</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="mt-1 font-display text-base font-semibold">{value}</div>
  </div>
);

export default MapPage;
