import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { applyRussianLabels } from "@/lib/mapboxLabels";
import { applyKyrgyzstanOnlyMap } from "@/lib/kyrgyzstanOnlyMap";

export function MiniMap({
  center,
  zoom = 9.5,
  marker = true,
}: {
  center: { lng: number; lat: number } | null;
  zoom?: number;
  marker?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;

    // Avoid noisy telemetry calls (often blocked by adblockers).
    (mapboxgl as any).setTelemetryEnabled?.(false);
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [74.6, 41.2],
      zoom: 5.7,
      attributionControl: false,
      interactive: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.on("style.load", () => {
      void applyKyrgyzstanOnlyMap(map, { borderWidth: 1.5, paddingDegrees: 0.25 });
      applyRussianLabels(map);
    });

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!center) return;

    map.flyTo({ center: [center.lng, center.lat], zoom, speed: 1.2, curve: 1.2, essential: true });

    if (!marker) return;
    if (!markerRef.current) {
      const el = document.createElement("div");
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.transform = "translateY(-4px)";
      el.innerHTML = `
        <div style="position:relative;width:30px;height:30px;">
          <div style="position:absolute;left:50%;top:50%;width:10px;height:10px;border-radius:9999px;background:rgba(239,68,68,0.25);transform:translate(-50%,-10%);filter:blur(0.2px)"></div>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="position:absolute;left:0;top:0;">
            <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="rgb(239 68 68)"/>
            <circle cx="12" cy="10" r="2.6" fill="white"/>
          </svg>
        </div>
      `;
      markerRef.current = new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat([center.lng, center.lat]).addTo(map);
    } else {
      markerRef.current.setLngLat([center.lng, center.lat]);
    }
  }, [center, zoom, marker]);

  if (!token) {
    return (
      <div className="grid h-full w-full place-items-center bg-muted text-sm text-muted-foreground">
        Mapbox token missing.
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
