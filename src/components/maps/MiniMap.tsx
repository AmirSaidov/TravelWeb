import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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
      markerRef.current = new mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat([center.lng, center.lat])
        .addTo(map);
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
