import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Booking } from "@/types";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  createdAt?: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  authModal: { open: boolean; mode: "login" | "register" };
  saved: string[]; // tour IDs
  bookings: Booking[];
  signIn: (u: User, token?: string) => void;
  signOut: () => void;
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  toggleSave: (tourId: string) => void;
  addBooking: (b: Booking) => void;
  cancelBooking: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      authModal: { open: false, mode: "login" },
      saved: [],
      bookings: [],
      signIn: (u, token) => set({ user: u, token: token ?? null }),
      signOut: () => set({ user: null, token: null }),
      openAuthModal: (mode = "login") => set({ authModal: { open: true, mode } }),
      closeAuthModal: () => set((s) => ({ authModal: { ...s.authModal, open: false } })),
      toggleSave: (id) =>
        set((s) => ({ saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
      addBooking: (b) => set((s) => ({ bookings: [b, ...s.bookings] })),
      cancelBooking: (id) =>
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b)) })),
    }),
    { name: "kg-travel-store" }
  )
);
