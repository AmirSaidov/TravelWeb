export type Difficulty = "easy" | "moderate" | "challenging";
export type TourType = "horseback" | "trekking" | "culinary" | "off-road" | "winter" | "cultural" | "eco" | "yurts";

export interface Tour {
  id: string;
  slug: string;
  title: string;
  region: string;
  location: string;
  coordinates?: { lat: number; lng: number } | null;
  description: string;
  longDescription: string;
  price: number;
  currency: string;
  duration: string;
  durationDays: number;
  rating: number;
  reviewCount: number;
  difficulty: Difficulty;
  types: TourType[];
  badge?: "MOST POPULAR" | "BEST VALUE" | "ALL INCLUSIVE";
  hero: string;
  gallery: string[];
  highlights: { icon: string; title: string; text: string }[];
  included: string[];
  host: { name: string; team: string; avatar: string };
  maxGuests: number;
  nights: number;
}

