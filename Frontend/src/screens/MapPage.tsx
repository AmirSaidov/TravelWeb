"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { RatingStars } from "@/components/ui-bits/RatingStars";
import { Button } from "@/components/ui/button";
import { toursApi } from "@/lib/api";
import { geocodePlace } from "@/lib/mapboxGeocoding";
import { applyRussianLabels } from "@/lib/mapboxLabels";
import { formatMoney } from "@/lib/currency";
import { useAppStore } from "@/store/app";
import { useTranslation } from "react-i18next";
import Image from "next/image";

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
  const { i18n } = useTranslation();
  const currency = useAppStore((s) => s.currency);
  const currentLang = i18n.language;
  // Keep initial render deterministic for SSR/CSR hydration.
  const [is3d, setIs3d] = useState(false);
  const { data: tours = [] } = useQuery({
    queryKey: ["tours", currency, currentLang],
    queryFn: () => toursApi.getTours(currency),
    // Ensure map sidebar reflects backend edits without needing a hard reload.
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string | undefined;
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
        if (tour.coordinates) {
          out.push({ id: tour.id, lng: tour.coordinates.lng, lat: tour.coordinates.lat });
          continue;
        }

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

  const getFirstSymbolLayerId = (map: mapboxgl.Map) => {
    const layers = map.getStyle()?.layers || [];
    const firstSymbol = layers.find((l) => l.type === "symbol");
    return firstSymbol?.id;
  };

  const apply3d = (map: mapboxgl.Map, enabled: boolean) => {
    if (!map.isStyleLoaded()) return;

    // Clean up first (safe even if not present).
    if (map.getLayer("kg-3d-buildings")) map.removeLayer("kg-3d-buildings");
    if (map.getLayer("kg-terrain-hillshade")) map.removeLayer("kg-terrain-hillshade");
    if (map.getLayer("kg-sky")) map.removeLayer("kg-sky");
    if (map.getTerrain()) map.setTerrain(null);
    map.setFog(undefined as any);

    if (!enabled) {
      map.easeTo({ pitch: 0, bearing: 0, duration: 450 });
      return;
    }

    if (!map.getSource("kg-dem")) {
      map.addSource("kg-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
    }

    map.setTerrain({ source: "kg-dem", exaggeration: 1.65 });
    map.easeTo({ pitch: 60, bearing: -18, duration: 650 });

    if (!map.getLayer("kg-terrain-hillshade")) {
      const before = getFirstSymbolLayerId(map);
      map.addLayer({ id: "kg-terrain-hillshade", type: "hillshade", source: "kg-dem" }, before);
    }

    if (!map.getLayer("kg-3d-buildings") && map.getSource("composite")) {
      const before = getFirstSymbolLayerId(map);
      map.addLayer(
        {
          id: "kg-3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 14.6,
          paint: {
            "fill-extrusion-color": "hsl(140 30% 32% / 0.55)",
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
            "fill-extrusion-opacity": 0.92,
          },
        },
        before
      );
    }

    if (!map.getLayer("kg-sky")) {
      map.addLayer({
        id: "kg-sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 0.0],
          "sky-atmosphere-sun-intensity": 12,
        },
      });
    }

    map.setFog({
      color: "rgb(232, 243, 255)",
      "high-color": "rgb(205, 232, 255)",
      "horizon-blend": 0.08,
      "space-color": "rgb(215, 230, 255)",
      "star-intensity": 0.15,
    } as any);
  };

  const setMapStyle = (map: mapboxgl.Map, styleUrl: string) => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const pitch = map.getPitch();
    const bearing = map.getBearing();
    map.setStyle(styleUrl);
    map.once("style.load", () => {
      map.jumpTo({ center, zoom, pitch, bearing });
    });
  };

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) return;

    (mapboxgl as any).setTelemetryEnabled?.(false);
    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [74.6, 41.2],
      zoom: 6.2,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-left");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.on("style.load", () => {
      applyRussianLabels(map);
      apply3d(map, is3d);
    });

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
    // Read persisted preference after hydration.
    try {
      setIs3d(localStorage.getItem("map:3d") === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("map:3d", is3d ? "1" : "0");
    } catch {
      // ignore
    }
  }, [is3d]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Satellite + terrain reads more like "real relief" vs outdoors vector style.
    const desiredStyle = is3d ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/outdoors-v12";
    // Always setStyle on toggle to ensure consistent look.
    setMapStyle(map, desiredStyle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is3d]);

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
        "relative grid h-12 w-12 place-items-center rounded-full bg-white text-black shadow-elevated ring-4 ring-white/70 transition-transform hover:scale-105";
      el.innerHTML = `
        <span style="position:absolute;inset:0;border-radius:9999px;box-shadow:0 0 0 0 rgba(34,197,94,0.40);animation:tw-pulse 2.4s ease-out infinite;"></span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="rgb(34 197 94)"/>
          <circle cx="12" cy="10" r="2.6" fill="white"/>
        </svg>
        <style>
          @keyframes tw-pulse { 0% { box-shadow:0 0 0 0 rgba(34,197,94,0.35);} 70% { box-shadow:0 0 0 16px rgba(34,197,94,0);} 100% { box-shadow:0 0 0 0 rgba(34,197,94,0);} }
        </style>
      `;
      el.addEventListener("click", () => setSelectedId(tour.id));

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([coord.lng, coord.lat])
        .addTo(map);
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
      <div className="container-page flex min-h-[calc(100vh-4rem)] flex-col gap-6 py-6">
        <div className="relative overflow-hidden rounded-3xl bg-[hsl(220_25%_94%)] ring-1 ring-border">
          {!mapboxToken ? (
            <div className="grid h-[70vh] min-h-[520px] place-items-center p-10 text-center text-sm text-muted-foreground">
              Mapbox token missing. Add `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.local`.
            </div>
          ) : (
            <div className="relative">
              <div ref={mapContainerRef} className="h-[70vh] min-h-[520px] w-full lg:h-[calc(100vh-4rem-340px)]" />
              <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2">
                <Button
                  type="button"
                  variant={is3d ? "default" : "secondary"}
                  onClick={() => setIs3d((v) => !v)}
                  className="pointer-events-auto h-9 rounded-xl"
                >
                  {is3d ? "3D on" : "3D off"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="overflow-hidden rounded-3xl bg-card shadow-elevated ring-1 ring-border">
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">Tours on the map</h3>
              <Link href="/explore" className="text-xs font-medium text-brand hover:underline">
                Open Explore
              </Link>
            </div>

            {toursWithCoords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No tours found (or locations could not be geocoded).
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {toursWithCoords.slice(0, 8).map(({ tour }) => (
                  <button
                    key={tour.id}
                    type="button"
                    onClick={() => setSelectedId(tour.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-muted/60 ${
                      tour.id === selectedId ? "bg-muted/60" : ""
                    }`}
                  >
                    <Image src={tour.hero} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{tour.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <RatingStars value={tour.rating} size={12} /> ({tour.reviewCount} reviews)
                      </div>
                      <div className="mt-0.5 text-xs">
                        <span className="font-semibold">{formatMoney(tour.price, tour.currency)}</span> / person
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
              <Link href={selectedTour ? `/tour/${selectedTour.slug}` : "/explore"}>
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
