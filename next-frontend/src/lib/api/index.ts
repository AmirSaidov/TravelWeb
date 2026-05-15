import type { Tour } from "@/types";
import { api } from "./client";
import { normalizeCurrency } from "@/lib/currency";

type ApiTour = {
  id: number;
  title: string;
  description: string;
  price: string;
  currency?: string | null;
  location: string;
  lat?: number | string | null;
  lng?: number | string | null;
  duration: number;
  difficulty: string;
  types?: string[] | null;
  max_people: number;
  image: string;
  rating_avg?: number | null;
  review_count?: number | null;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "");

const mapApiTour = (t: ApiTour): Tour => {
  const price = Number(t.price);
  const rating = Number(t.rating_avg ?? 0);
  const reviewCount = Number(t.review_count ?? 0);
  const lat = t.lat == null ? null : Number(t.lat);
  const lng = t.lng == null ? null : Number(t.lng);
  const parsedTypes = Array.isArray(t.types)
    ? t.types.filter((x): x is Tour["types"][number] =>
        ["horseback", "trekking", "culinary", "off-road", "winter", "cultural", "eco", "yurts"].includes(String(x))
      )
    : [];
  const image = t.image || "";
  return {
    id: String(t.id),
    slug: slugify(t.title) || String(t.id),
    title: t.title,
    region: t.location,
    location: t.location,
    coordinates: Number.isFinite(lat) && Number.isFinite(lng) ? { lat: lat as number, lng: lng as number } : null,
    description: t.description,
    longDescription: t.description,
    price: Number.isFinite(price) ? price : 0,
    currency: normalizeCurrency(t.currency),
    duration: `${t.duration} days`,
    durationDays: t.duration,
    rating: Number.isFinite(rating) ? rating : 0,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
    difficulty: (["easy", "moderate", "challenging"].includes(t.difficulty) ? (t.difficulty as any) : "moderate"),
    types: parsedTypes,
    badge: undefined,
    hero: image,
    gallery: image ? [image] : [],
    highlights: [],
    included: [],
    host: { name: "", team: "", avatar: image },
    maxGuests: t.max_people,
    nights: Math.max(0, t.duration - 1),
  };
};

export const toursApi = {
  async getTours(currency?: string) {
    const cur = normalizeCurrency(currency) || "USD";
    const { data } = await api.get<ApiTour[]>("/tours/", { params: { currency: cur } });
    return data.map(mapApiTour);
  },
  async getTourBySlug(slug: string, currency?: string) {
    const all = await this.getTours(currency);
    return all.find((t) => t.slug === slug) ?? null;
  },
};

