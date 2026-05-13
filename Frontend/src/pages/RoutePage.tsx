import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery } from "@tanstack/react-query";
import { geocodePlace, geocodeSuggestions } from "@/lib/mapboxGeocoding";
import { applyRussianLabels } from "@/lib/mapboxLabels";
import { applyKyrgyzstanOnlyMap } from "@/lib/kyrgyzstanOnlyMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Coord = { lng: number; lat: number };

const RoutePage = () => {
  const [params] = useSearchParams();
  const toText = (params.get("to") || "").trim();
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  const [from, setFrom] = useState<Coord | null>(null);
  const [fromText, setFromText] = useState("");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ lng: number; lat: number; title: string; subtitle?: string }>>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const suggestTimer = useRef<number | null>(null);
  const { data: kgCenter = null } = useQuery({
    queryKey: ["kg-center-route-page"],
    enabled: Boolean(mapboxToken),
    queryFn: async () => {
      if (!mapboxToken) return null;
      return geocodePlace({ token: mapboxToken, query: "Kyrgyzstan", country: "kg" });
    },
  });

  useEffect(() => {
    if (!toText) return;
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFrom({ lng: pos.coords.longitude, lat: pos.coords.latitude });
        setGeoError(null);
      },
      () => {
        setGeoError("Location permission denied. Enter your start point manually.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, [toText]);

  useEffect(() => {
    if (!mapboxToken) return;
    const q = fromText.trim();
    if (suggestTimer.current) window.clearTimeout(suggestTimer.current);
    if (q.length < 3) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }

    suggestTimer.current = window.setTimeout(async () => {
      try {
        const items = await geocodeSuggestions({ token: mapboxToken, query: q, country: "kg", limit: 6 });
        // If user typed something else while awaiting, keep it simple: still show results for latest input only.
        setSuggestions(items);
        setSuggestOpen(true);
      } catch {
        setSuggestions([]);
        setSuggestOpen(false);
      }
    }, 250);

    return () => {
      if (suggestTimer.current) window.clearTimeout(suggestTimer.current);
    };
  }, [fromText, mapboxToken]);

  const { data: toCoord = null, isLoading: toLoading } = useQuery({
    queryKey: ["geocode", "to", toText],
    enabled: Boolean(mapboxToken && toText),
    queryFn: async () => {
      if (!mapboxToken || !toText) return null;
      return geocodePlace({ token: mapboxToken, query: toText, country: "kg" });
    },
  });

  const { data: route = null, isLoading: routeLoading, isError: routeError } = useQuery({
    queryKey: ["directions", from, toCoord],
    enabled: Boolean(mapboxToken && from && toCoord),
    queryFn: async () => {
      if (!mapboxToken || !from || !toCoord) return null;
      const url =
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${from.lng},${from.lat};${toCoord.lng},${toCoord.lat}` +
        `?geometries=geojson&overview=full&access_token=${encodeURIComponent(mapboxToken)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Directions request failed");
      const data = (await resp.json()) as any;
      const r = data?.routes?.[0];
      if (!r?.geometry?.coordinates) return null;
      return {
        geometry: r.geometry,
        distance: Number(r.distance) || 0,
        duration: Number(r.duration) || 0,
      };
    },
  });

  const distanceKm = useMemo(() => (route ? Math.round((route.distance / 1000) * 10) / 10 : null), [route]);
  const durationMin = useMemo(() => (route ? Math.round(route.duration / 60) : null), [route]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const fromMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const toMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) return;
    (mapboxgl as any).setTelemetryEnabled?.(false);
    mapboxgl.accessToken = mapboxToken;
    const fallbackCenter: Coord = { lng: 74.6, lat: 41.2 };
    const initialCenter = kgCenter ?? fallbackCenter;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 6.2,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-left");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.on("style.load", () => {
      void applyKyrgyzstanOnlyMap(map);
      applyRussianLabels(map);
    });
    mapRef.current = map;

    map.on("load", () => {
      if (map.getSource("route")) return;
      map.addSource("route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: {
          "line-color": "#10b981",
          "line-width": 5,
          "line-opacity": 0.9,
        },
      });
    });

    return () => {
      fromMarkerRef.current?.remove();
      toMarkerRef.current?.remove();
      fromMarkerRef.current = null;
      toMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [kgCenter, mapboxToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !kgCenter) return;
    if (from || toCoord) return;
    map.flyTo({ center: [kgCenter.lng, kgCenter.lat], zoom: 6.2, duration: 700 });
  }, [from, kgCenter, toCoord]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (from) return;
    if (!toCoord) return;
    map.flyTo({ center: [toCoord.lng, toCoord.lat], zoom: 7.4, duration: 700, essential: true });
  }, [from, toCoord]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (from) {
      if (!fromMarkerRef.current) {
        fromMarkerRef.current = new mapboxgl.Marker({ color: "#0f172a" }).setLngLat([from.lng, from.lat]).addTo(map);
      } else {
        fromMarkerRef.current.setLngLat([from.lng, from.lat]);
      }
    }
    if (toCoord) {
      if (!toMarkerRef.current) {
        toMarkerRef.current = new mapboxgl.Marker({ color: "#ef4444" }).setLngLat([toCoord.lng, toCoord.lat]).addTo(map);
      } else {
        toMarkerRef.current.setLngLat([toCoord.lng, toCoord.lat]);
      }
    }
  }, [from, toCoord]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route?.geometry?.coordinates) return;

    const src = map.getSource("route") as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;
    const feature = {
      type: "Feature",
      properties: {},
      geometry: route.geometry,
    };
    src.setData({ type: "FeatureCollection", features: [feature as any] });

    const coords = route.geometry.coordinates as Array<[number, number]>;
    if (coords.length > 1) {
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, { padding: 80, duration: 800 });
    }
  }, [route]);

  const geocodeFromText = async () => {
    if (!mapboxToken) return;
    const q = fromText.trim();
    if (!q) return;
    const geo = await geocodePlace({ token: mapboxToken, query: q, country: "kg" });
    if (!geo) {
      setGeoError("Could not find that place. Try another query.");
      return;
    }
    setFrom(geo);
    setGeoError(null);
  };

  if (!toText) {
    return (
      <div className="container-page py-10">
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Destination missing. Go back to <Link className="text-brand hover:underline" to="/dashboard">Dashboard</Link>.
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-surface-muted">
      <div className="container-page grid gap-6 py-6 lg:grid-cols-[420px_1fr]">
        <aside className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div className="font-display text-xl font-semibold">Route to</div>
            <Button asChild variant="outline" className="h-9 rounded-full px-4 text-xs">
              <Link to="/dashboard">Back</Link>
            </Button>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">{toText}</div>

          <div className="mt-6 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start point</div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={fromText}
                  onChange={(e) => setFromText(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setSuggestOpen(true)}
                  onBlur={() => window.setTimeout(() => setSuggestOpen(false), 150)}
                  placeholder="Your location (optional)"
                  className="h-11 rounded-xl"
                />
                {suggestOpen && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
                    {suggestions.map((s, idx) => (
                      <button
                        key={`${s.lng}:${s.lat}:${idx}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setFrom({ lng: s.lng, lat: s.lat });
                          setFromText(s.title);
                          setGeoError(null);
                          setSuggestOpen(false);
                        }}
                        className="w-full border-b border-border/60 px-3 py-2 text-left text-sm hover:bg-muted/60 last:border-b-0"
                      >
                        <div className="font-medium">{s.title}</div>
                        {s.subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{s.subtitle}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button type="button" className="h-11 rounded-xl" onClick={geocodeFromText} disabled={!mapboxToken}>
                Set
              </Button>
            </div>
            {geoError && <div className="text-xs text-destructive">{geoError}</div>}
          </div>

          <div className="mt-6 rounded-2xl bg-muted/40 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Distance</span>
              <span className="font-medium">{distanceKm == null ? "—" : `${distanceKm} km`}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{durationMin == null ? "—" : `${durationMin} min`}</span>
            </div>
          </div>

          <div className="mt-6 text-xs text-muted-foreground">
            {(!mapboxToken && "Mapbox token missing. Add `VITE_MAPBOX_TOKEN` to `.env.local`.") ||
              (toLoading && "Finding destination…") ||
              (routeLoading && "Building route…") ||
              (routeError && "Could not build route. Try again or set start point manually.")}
          </div>
        </aside>

        <section className="overflow-hidden rounded-3xl bg-[hsl(220_25%_94%)] ring-1 ring-border">
          {!mapboxToken ? (
            <div className="grid h-full min-h-[560px] place-items-center p-10 text-center text-sm text-muted-foreground">
              Mapbox token missing. Add `VITE_MAPBOX_TOKEN` to `.env.local`.
            </div>
          ) : (
            <div ref={mapContainerRef} className="h-full min-h-[560px] w-full" />
          )}
        </section>
      </div>
    </div>
  );
};

export default RoutePage;
