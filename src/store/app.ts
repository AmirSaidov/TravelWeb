import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Booking } from "@/types";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
}

interface AppState {
  user: User | null;
  saved: string[]; // tour IDs
  bookings: Booking[];
  signIn: (u: User) => void;
  signOut: () => void;
  toggleSave: (tourId: string) => void;
  addBooking: (b: Booking) => void;
  cancelBooking: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: {
        id: "demo",
        name: "Aizada Demo",
        email: "demo@kyrgyz.travel",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
      },
      saved: [],
      bookings: [],
      signIn: (u) => set({ user: u }),
      signOut: () => set({ user: null }),
      toggleSave: (id) =>
        set((s) => ({ saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
      addBooking: (b) => set((s) => ({ bookings: [b, ...s.bookings] })),
      cancelBooking: (id) =>
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b)) })),
    }),
    { name: "kg-travel-store" }
  )
);
