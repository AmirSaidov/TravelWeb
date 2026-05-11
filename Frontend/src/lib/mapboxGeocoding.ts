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

  // Kyrgyzstan bbox (west,south,east,north). Used to avoid wrong matches (e.g. Romania)
  // when the query is localized or ambiguous.
  const KG_BBOX = "69.23,39.17,80.28,43.27";
  // Bias results towards Kyrgyzstan center.
  const KG_PROXIMITY = "74.6,41.2";

  const baseUrlForQuery = (queryText: string) =>
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryText)}.json` +
    `?access_token=${encodeURIComponent(token)}` +
    `&limit=1` +
    `&autocomplete=true` +
    `&fuzzyMatch=true` +
    `&language=ru,en` +
    `&bbox=${KG_BBOX}` +
    `&proximity=${KG_PROXIMITY}`;

  const fetchCenter = async (queryText: string, countryParam?: string): Promise<{ lng: number; lat: number } | null> => {
    const baseUrl = baseUrlForQuery(queryText);
    const url = baseUrl + (countryParam ? `&country=${encodeURIComponent(countryParam)}` : "");
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = (await resp.json()) as any;
    const c = data?.features?.[0]?.center;
    if (!Array.isArray(c) || c.length < 2) return null;
    const [lng, lat] = c;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    return { lng, lat };
  };

  const hasKgHint = /(\bkg\b|kyrgyz|кыргыз|киргиз)/i.test(q);
  const qWithHintRu = hasKgHint ? q : `${q}, Кыргызстан`;
  const qWithHintEn = hasKgHint ? q : `${q}, Kyrgyzstan`;

  // 1) strict Kyrgyzstan search
  const primary = await fetchCenter(qWithHintRu, country || undefined);
  if (primary) return primary;

  // 2) same but with english hint (sometimes gives better matches)
  const secondary = await fetchCenter(qWithHintEn, country || undefined);
  if (secondary) return secondary;

  // 3) last resort: drop `country` but keep bbox+proximity (still constrained to KG region)
  if (country) {
    const fallback1 = await fetchCenter(qWithHintRu, undefined);
    if (fallback1) return fallback1;
    return await fetchCenter(qWithHintEn, undefined);
  }

  return await fetchCenter(q, undefined);
}

export async function geocodeSuggestions({
  token,
  query,
  country = "kg",
  limit = 5,
}: {
  token: string;
  query: string;
  country?: string;
  limit?: number;
}): Promise<Array<{ lng: number; lat: number; title: string; subtitle?: string }>> {
  const q = (query || "").trim();
  if (!q) return [];

  const KG_BBOX = "69.23,39.17,80.28,43.27";
  const KG_PROXIMITY = "74.6,41.2";

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?access_token=${encodeURIComponent(token)}` +
    `&limit=${encodeURIComponent(String(Math.max(1, Math.min(10, limit))))}` +
    `&autocomplete=true` +
    `&fuzzyMatch=true` +
    `&language=ru,en` +
    `&bbox=${KG_BBOX}` +
    `&proximity=${KG_PROXIMITY}` +
    (country ? `&country=${encodeURIComponent(country)}` : "");

  const resp = await fetch(url);
  if (!resp.ok) return [];
  const data = (await resp.json()) as any;
  const features = Array.isArray(data?.features) ? data.features : [];
  return features
    .map((f: any) => {
      const c = f?.center;
      if (!Array.isArray(c) || c.length < 2) return null;
      const [lng, lat] = c;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
      const title = String(f?.text || f?.place_name || "").trim();
      if (!title) return null;
      const subtitle = String(f?.place_name || "").trim();
      return { lng, lat, title, subtitle: subtitle && subtitle !== title ? subtitle : undefined };
    })
    .filter(Boolean) as Array<{ lng: number; lat: number; title: string; subtitle?: string }>;
}
