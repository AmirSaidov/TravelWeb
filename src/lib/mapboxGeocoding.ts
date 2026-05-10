export async function geocodePlace({
  token,
  query,
  country = "kg",
}: {
  token: string;
  query: string;
  country?: string;
}): Promise<{ lng: number; lat: number } | null> {
  const q = (query || "").trim();
  if (!q) return null;

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?access_token=${encodeURIComponent(token)}` +
    `&limit=1&country=${encodeURIComponent(country)}&language=ru`;

  const resp = await fetch(url);
  if (!resp.ok) return null;
  const data = (await resp.json()) as any;
  const c = data?.features?.[0]?.center;
  if (!Array.isArray(c) || c.length < 2) return null;
  const [lng, lat] = c;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat };
}

