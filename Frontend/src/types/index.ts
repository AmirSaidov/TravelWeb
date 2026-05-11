export type Difficulty = "easy" | "moderate" | "challenging";
export type TourType = "horseback" | "trekking" | "culinary" | "off-road" | "winter" | "cultural" | "eco" | "yurts";

export interface Tour {
  id: string;
  slug: string;
  title: string;
  region: string;
  location: string; // POI text
  coordinates?: { lat: number; lng: number } | null;
  description: string;
  longDescription: string;
  price: number; // per person
  currency: string;
  duration: string; // "3 days"
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

export interface Region {
  id: string;
  name: string;
  altitude: number;
  weatherC: number;
  toursCount: number;
  hero: string;
  coordinates: { lat: number; lng: number };
  description: string;
  topTourIds: string[];
}

export interface Review {
  id: string;
  tourId: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
}

export interface Booking {
  id: string;
  tourId: string;
  startDate: string;
  endDate: string;
  guests: number;
  total: number;
  status: "upcoming" | "completed" | "cancelled";
  createdAt: string;
}
