import type { Tour } from "@/types";
import { api, tokenStorage } from "./client";
import { normalizeCurrency } from "@/lib/currency";
import { getPreferredCurrency } from "@/lib/currencyPref";

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

type ApiUser = { id: number; name: string; email: string; created_at?: string | null };

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
    coordinates:
      Number.isFinite(lat) && Number.isFinite(lng) ? { lat: lat as number, lng: lng as number } : null,
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

export const authApi = {
  async login(input: { email: string; password: string }) {
    const { data } = await api.post<{ token: string; user: ApiUser }>("/auth/login/", input);
    tokenStorage.set(data.token);
    return data;
  },
  async register(input: { name: string; email: string; password: string }) {
    const { data } = await api.post<{ token: string; user: ApiUser }>("/auth/register/", input);
    tokenStorage.set(data.token);
    return data;
  },
  async profile() {
    const { data } = await api.get<ApiUser>("/profile/");
    return data;
  },
  async updateProfile(input: { name?: string; password?: string }) {
    const { data } = await api.patch<ApiUser>("/profile/", input);
    return data;
  },
  logout() {
    tokenStorage.clear();
  },
};

export const toursApi = {
  async getTours(currency?: string) {
    const cur = normalizeCurrency(currency) || getPreferredCurrency();
    const { data } = await api.get<ApiTour[]>("/tours/", { params: { currency: cur } });
    return data.map(mapApiTour);
  },
  async getTourBySlug(slug: string, currency?: string) {
    const all = await this.getTours(currency);
    return all.find((t) => t.slug === slug) ?? null;
  },
};

export const bookingApi = {
  async createBooking(input: { tourId: string; peopleCount: number; date?: string; currency?: string }) {
    const cur = normalizeCurrency(input.currency) || getPreferredCurrency();
    const { data } = await api.post<{
      booking_id: number;
      status: string;
      total_price: string;
      currency?: string;
      available_places: number;
      payment_due_at?: string | null;
    }>("/bookings/", { tour_id: input.tourId, people_count: input.peopleCount, date: input.date ?? null }, { params: { currency: cur } });
    return data;
  },
  async myBookings(currency?: string) {
    const cur = normalizeCurrency(currency) || getPreferredCurrency();
    const { data } = await api.get<any[]>("/bookings/my/", { params: { currency: cur } });
    return data;
  },
  async cancel(input: { bookingId: number }) {
    const { data } = await api.post<{ booking_id: number; status: string }>(`/bookings/${input.bookingId}/cancel/`);
    return data;
  },
  async pay(input: { bookingId: number; currency?: string }) {
    const cur = normalizeCurrency(input.currency) || getPreferredCurrency();
    const { data } = await api.post<{
      payment_id: number;
      booking_id: number;
      payment_status: string;
      booking_status: string;
      amount: string;
      currency?: string;
    }>("/payments/", { booking_id: input.bookingId }, { params: { currency: cur } });
    return data;
  },
};

export const reviewsApi = {
  async getByTourId(tourId: string) {
    const { data } = await api.get<
      Array<{
        id: number;
        tour_id: number;
        rating: number;
        comment: string;
        created_at: string | null;
        user: { id: number; name: string };
      }>
    >(`/reviews/${tourId}/`);
    return data;
  },
  async create(input: { tourId: string; rating: number; comment: string }) {
    const { data } = await api.post<{ id: number; tour_id: number; rating: number; comment: string; created_at: string | null }>(
      "/reviews/",
      { tour: Number(input.tourId), rating: input.rating, comment: input.comment }
    );
    return data;
  },
};
