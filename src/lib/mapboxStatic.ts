type Marker = { lng: number; lat: number; color?: string };

const DEFAULT_STYLE = "mapbox/outdoors-v12";

function safeStylePath(style: string) {
  // Mapbox Static Images expects: /styles/v1/{username}/{style_id}/static/...
  // So we must NOT encode the "/" between username and style id.
  const trimmed = style.replace(/^\/+|\/+$/g, "");
  // encodeURI keeps "/" intact but escapes spaces and other unsafe chars.
  return encodeURI(trimmed);
}

export function buildStaticMapUrl({
  token,
  width,
  height,
  markers = [],
  style = DEFAULT_STYLE,
  retina = true,
  center,
}: {
  token: string;
  width: number;
  height: number;
  markers?: Marker[];
  style?: string;
  retina?: boolean;
  center?: { lng: number; lat: number; zoom?: number; bearing?: number; pitch?: number };
}) {
  const safeW = Math.max(1, Math.min(1280, Math.round(width)));
  const safeH = Math.max(1, Math.min(1280, Math.round(height)));
  const size = `${safeW}x${safeH}${retina ? "@2x" : ""}`;

  const overlays =
    markers.length === 0
      ? ""
      : markers
          .map((m) => {
            const c = (m.color || "22c55e").replace("#", "");
            return `pin-s+${c}(${m.lng},${m.lat})`;
          })
          .join(",");

  const viewport = (() => {
    if (!center) return "auto";
    const z = center.zoom ?? 5.2;
    const b = center.bearing ?? 0;
    const p = center.pitch ?? 0;
    return `${center.lng},${center.lat},${z},${b},${p}`;
  })();

  const path = `https://api.mapbox.com/styles/v1/${safeStylePath(style)}/static/${overlays ? overlays + "/" : ""}${viewport}/${size}`;
  return `${path}?access_token=${encodeURIComponent(token)}&attribution=false&logo=false`;
}
