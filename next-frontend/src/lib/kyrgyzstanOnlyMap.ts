import type mapboxgl from "mapbox-gl";

type Position = [number, number];
type LinearRing = Position[];

let cachedBoundary: any | null = null;
let cachedBoundaryPromise: Promise<any> | null = null;

async function loadKyrgyzstanBoundary(): Promise<any> {
  if (cachedBoundary) return cachedBoundary;
  if (cachedBoundaryPromise) return cachedBoundaryPromise;

  cachedBoundaryPromise = fetch("/geo/kgz.geojson", { cache: "force-cache" })
    .then(async (r) => {
      if (!r.ok) throw new Error("Failed to load /geo/kgz.geojson");
      return (await r.json()) as any;
    })
    .then((gj) => {
      cachedBoundary = gj;
      return gj;
    })
    .finally(() => {
      cachedBoundaryPromise = null;
    });

  return cachedBoundaryPromise;
}

function ringBounds(ring: LinearRing) {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const [lng, lat] of ring) {
    west = Math.min(west, lng);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    north = Math.max(north, lat);
  }
  return { west, south, east, north };
}

function normalizeRing(ring: LinearRing): LinearRing {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

function extractOuterRings(geometry: any): LinearRing[] {
  if (!geometry) return [];
  if (geometry.type === "Polygon") {
    const outer = geometry.coordinates?.[0] as LinearRing | undefined;
    return outer ? [outer] : [];
  }
  if (geometry.type === "MultiPolygon") {
    const polys = geometry.coordinates as LinearRing[][] | undefined;
    if (!polys) return [];
    return polys.map((p) => p?.[0]).filter(Boolean) as LinearRing[];
  }
  return [];
}

function buildWorldMaskFeature(outerRings: LinearRing[]) {
  const world: LinearRing = [
    [-180, -90],
    [180, -90],
    [180, 90],
    [-180, 90],
    [-180, -90],
  ];

  const holes = outerRings.map((r) => normalizeRing(r));
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [world, ...holes] },
  };
}

export async function applyKyrgyzstanOnlyMap(
  map: mapboxgl.Map,
  opts?: { maskColor?: string; borderColor?: string; borderWidth?: number; paddingDegrees?: number }
) {
  const maskColor = opts?.maskColor ?? "hsl(220 25% 94%)";
  const borderColor = opts?.borderColor ?? "hsl(220 10% 30% / 0.65)";
  const borderWidth = opts?.borderWidth ?? 2;
  const paddingDegrees = opts?.paddingDegrees ?? 0.35;

  const gj = await loadKyrgyzstanBoundary();
  const feature = gj?.features?.[0];
  const geometry = feature?.geometry;
  const outerRings = extractOuterRings(geometry);
  if (outerRings.length === 0) return;

  const all = outerRings.map((r) => ringBounds(r));
  const west = Math.min(...all.map((b) => b.west)) - paddingDegrees;
  const south = Math.min(...all.map((b) => b.south)) - paddingDegrees;
  const east = Math.max(...all.map((b) => b.east)) + paddingDegrees;
  const north = Math.max(...all.map((b) => b.north)) + paddingDegrees;

  map.setRenderWorldCopies(false);
  map.setMaxBounds([
    [west, south],
    [east, north],
  ]);

  const layers = ["kg-mask-fill", "kg-border-line"];
  for (const id of layers) if (map.getLayer(id)) map.removeLayer(id);
  const sources = ["kg-mask", "kg-border"];
  for (const id of sources) if (map.getSource(id)) map.removeSource(id);

  map.addSource("kg-border", { type: "geojson", data: gj });
  map.addLayer({
    id: "kg-border-line",
    type: "line",
    source: "kg-border",
    paint: { "line-color": borderColor, "line-width": borderWidth },
  });

  const mask = { type: "FeatureCollection", features: [buildWorldMaskFeature(outerRings)] };
  map.addSource("kg-mask", { type: "geojson", data: mask as any });
  map.addLayer({
    id: "kg-mask-fill",
    type: "fill",
    source: "kg-mask",
    paint: { "fill-color": maskColor, "fill-opacity": 1 },
  });
}

