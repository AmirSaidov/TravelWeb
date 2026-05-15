import type mapboxgl from "mapbox-gl";

export function applyRussianLabels(map: mapboxgl.Map) {
  const style = map.getStyle?.();
  const layers = style?.layers ?? [];
  for (const layer of layers) {
    if (!layer || layer.type !== "symbol") continue;
    const layerId = layer.id;
    if (!layerId) continue;

    const textField = (layer.layout as any)?.["text-field"];
    if (!textField) continue;

    try {
      map.setLayoutProperty(layerId, "text-field", ["coalesce", ["get", "name:ru"], ["get", "name_ru"], ["get", "name"]] as any);
    } catch {
      // ignore
    }
  }
}

