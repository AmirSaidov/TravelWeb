"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import { useQuery } from "@tanstack/react-query";
import { toursApi } from "@/lib/api";
import { geocodePlace } from "@/lib/mapboxGeocoding";
import { applyRussianLabels } from "@/lib/mapboxLabels";
import { applyKyrgyzstanOnlyMap } from "@/lib/kyrgyzstanOnlyMap";
import { formatMoney } from "@/lib/currency";

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

export function MapClient() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  const [is3d, setIs3d] = useState(() => {
    try {
      return localStorage.getItem("map:3d") === "1";
    } catch {
      return false;
    }
  });

  const { data: tours = [], isLoading: toursLoading } = useQuery({
    queryKey: ["tours"],
    queryFn: () => toursApi.getTours("USD"),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

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
      void applyKyrgyzstanOnlyMap(map);
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
    try {
      localStorage.setItem("map:3d", is3d ? "1" : "0");
    } catch {}
  }, [is3d]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const desiredStyle = is3d ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/outdoors-v12";
    setMapStyle(map, desiredStyle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is3d]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!kgCenter) return;
    if (toursWithCoords.length > 0) return;
    map.flyTo({ center: [kgCenter.lng, kgCenter.lat], zoom: 6.2, duration: 700 });
  }, [kgCenter, toursWithCoords.length]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = markersRef.current;

    const nextIds = new Set(toursWithCoords.map((x) => x.tour.id));
    markers.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    });

    for (const { tour, coord } of toursWithCoords) {
      const existing = markers.get(tour.id);
      if (existing) {
        existing.setLngLat([coord.lng, coord.lat]);
        continue;
      }

      const el = document.createElement("button");
      el.type = "button";
      el.className =
        "h-10 w-10 rounded-full bg-[hsl(var(--primary))] text-white shadow-elevated ring-4 ring-white/80 transition-transform hover:scale-105";
      el.innerHTML = `<span style=\"font-weight:700;font-size:14px;\">$</span>`;
      el.addEventListener("click", () => setSelectedId(tour.id));

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([coord.lng, coord.lat])
        .addTo(map);
      markers.set(tour.id, marker);
    }
  }, [toursWithCoords]);

  if (!mapboxToken) {
    return (
      <div className="container-page py-10">
        <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          MAPBOX token не задан. Укажи `NEXT_PUBLIC_MAPBOX_TOKEN`.
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[hsl(var(--surface-muted))]">
      <div className="container-page grid gap-6 py-6 lg:grid-cols-[420px_1fr]">
        <aside className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div className="font-display text-xl font-semibold">Карта туров</div>
            <button
              type="button"
              onClick={() => setIs3d((v) => !v)}
              className="h-9 rounded-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 text-xs font-semibold hover:bg-[hsl(var(--accent))]"
            >
              {is3d ? "2D" : "3D"}
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {toursLoading ? (
              <div className="text-sm text-[hsl(var(--muted-foreground))]">Загрузка туров…</div>
            ) : tours.length === 0 ? (
              <div className="text-sm text-[hsl(var(--muted-foreground))]">Пока нет туров.</div>
            ) : (
              tours.slice(0, 8).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-left hover:bg-[hsl(var(--accent))]"
                >
                  <div className="font-semibold">{t.title}</div>
                  <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{t.location}</div>
                </button>
              ))
            )}
          </div>

          {selectedTour && (
            <div className="mt-6 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
              <div className="font-display text-lg font-semibold">{selectedTour.title}</div>
              <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{selectedTour.location}</div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm font-semibold">{formatMoney(selectedTour.price, selectedTour.currency)}</div>
                <Link href={`/tour/${selectedTour.slug}`} className="text-sm text-[hsl(var(--primary))] hover:underline">
                  Открыть →
                </Link>
              </div>
            </div>
          )}
        </aside>

        <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card">
          <div ref={mapContainerRef} className="h-[70vh] min-h-[520px] w-full" />
        </div>
      </div>
    </div>
  );
}

