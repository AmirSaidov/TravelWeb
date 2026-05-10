import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { RatingStars } from "@/components/ui-bits/RatingStars";
import { Button } from "@/components/ui/button";
import { toursApi } from "@/lib/api";
import { geocodePlace } from "@/lib/mapboxGeocoding";

type TourCoord = { id: string; lng: number; lat: number };

const CACHE_KEY = "geoCache:v1";
const readCache = (): Record<string, { lng: number; lat: number }> => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
};
const writeCache = (cache: Record<string, { lng: number; lat: number }>) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
};

const MapPage = () => {
  const { data: tours = [] } = useQuery({
    queryKey: ["tours"],
    queryFn: () => toursApi.getTours(),
  });

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const { data: kgCenter = null } = useQuery({
    queryKey: ["kg-center-map-page"],
    enabled: Boolean(mapboxToken),
    queryFn: async () => {
      if (!mapboxToken) return null;
      return geocodePlace({ token: mapboxToken, query: "Kyrgyzstan", country: "kg" });
    },
  });
  const { data: tourCoords = [] } = useQuery({
    queryKey: ["tour-geocodes", tours.map((t) => `${t.id}:${t.location}`)],
    enabled: Boolean(mapboxToken && tours.length > 0),
    queryFn: async () => {
      if (!mapboxToken || tours.length === 0) return [];

      const cache = readCache();
      const out: TourCoord[] = [];

      for (const tour of tours) {
        const q = (tour.location || tour.region || "").trim();
        if (!q) continue;

        const cached = cache[q];
        if (cached && Number.isFinite(cached.lng) && Number.isFinite(cached.lat)) {
          out.push({ id: tour.id, lng: cached.lng, lat: cached.lat });
          continue;
        }

        const geo = await geocodePlace({ token: mapboxToken, query: q, country: "kg" });
        if (!geo) continue;
        cache[q] = geo;
        out.push({ id: tour.id, lng: geo.lng, lat: geo.lat });
      }

      writeCache(cache);
      return out;
    },
  });

  const coordsById = useMemo(() => {
    const m = new Map<string, { lng: number; lat: number }>();
    tourCoords.forEach((c) => m.set(c.id, { lng: c.lng, lat: c.lat }));
    return m;
  }, [tourCoords]);

  const toursWithCoords = useMemo(() => {
    return tours
      .map((t) => {
        const c = coordsById.get(t.id);
        return c ? { tour: t, coord: c } : null;
      })
      .filter(Boolean) as Array<{ tour: (typeof tours)[number]; coord: { lng: number; lat: number } }>;
  }, [coordsById, tours]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTour = useMemo(() => tours.find((t) => t.id === selectedId) ?? null, [selectedId, tours]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) return;

    (mapboxgl as any).setTelemetryEnabled?.(false);
    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      zoom: 6.2,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-left");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !kgCenter) return;
    if (selectedId) return;
    map.flyTo({ center: [kgCenter.lng, kgCenter.lat], zoom: 6.2, duration: 700 });
  }, [kgCenter, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    toursWithCoords.forEach(({ tour, coord }) => {
      if (markersRef.current.has(tour.id)) return;

      const el = document.createElement("button");
      el.type = "button";
      el.className =
        "grid h-10 w-10 place-items-center rounded-full bg-white text-foreground shadow-elevated ring-4 ring-white/70 transition-transform hover:scale-105";
      el.innerHTML = `<span style="display:block;width:10px;height:10px;border-radius:9999px;background:rgb(34 197 94)"></span>`;
      el.addEventListener("click", () => setSelectedId(tour.id));

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([coord.lng, coord.lat]).addTo(map);
      markersRef.current.set(tour.id, marker);
    });

    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement() as HTMLButtonElement;
      if (id === selectedId) {
        el.style.transform = "scale(1.12)";
        el.style.boxShadow = "0 18px 40px rgba(15,23,41,0.35)";
      } else {
        el.style.transform = "scale(1)";
        el.style.boxShadow = "";
      }
    });
  }, [selectedId, toursWithCoords]);

  useEffect(() => {
    if (selectedId) return;
    const first = toursWithCoords[0]?.tour?.id ?? null;
    if (first) setSelectedId(first);
  }, [selectedId, toursWithCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const c = coordsById.get(selectedId);
    if (!c) return;
    map.flyTo({ center: [c.lng, c.lat], zoom: 7.4, speed: 1.25, curve: 1.2, essential: true });
  }, [coordsById, selectedId]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-surface-muted">
      <div className="container-page grid min-h-[calc(100vh-4rem)] gap-6 py-6 lg:grid-cols-[1fr_400px]">
        <div className="relative overflow-hidden rounded-3xl bg-[hsl(220_25%_94%)] ring-1 ring-border">
          {!mapboxToken ? (
            <div className="grid h-full place-items-center p-10 text-center text-sm text-muted-foreground">
              Mapbox token missing. Add `VITE_MAPBOX_TOKEN` to `.env.local`.
            </div>
          ) : (
            <div ref={mapContainerRef} className="h-full min-h-[560px] w-full" />
          )}
        </div>

        <aside className="overflow-hidden rounded-3xl bg-card shadow-elevated ring-1 ring-border">
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">Tours on the map</h3>
              <Link to="/explore" className="text-xs font-medium text-brand hover:underline">
                Open Explore
              </Link>
            </div>

            {toursWithCoords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No tours found (or locations could not be geocoded).
              </div>
            ) : (
              <div className="space-y-3">
                {toursWithCoords.slice(0, 8).map(({ tour }) => (
                  <button
                    key={tour.id}
                    type="button"
                    onClick={() => setSelectedId(tour.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-muted/60 ${
                      tour.id === selectedId ? "bg-muted/60" : ""
                    }`}
                  >
                    <img src={tour.hero} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{tour.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <RatingStars value={tour.rating} size={12} /> ({tour.reviewCount} reviews)
                      </div>
                      <div className="mt-0.5 text-xs">
                        <span className="font-semibold">${tour.price}</span> / person
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border p-5">
            <Button asChild className="h-12 w-full rounded-xl bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to={selectedTour ? `/tour/${selectedTour.slug}` : "/explore"}>
                {selectedTour ? "Open selected tour" : "Explore tours"}
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MapPage;
