import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Booking } from "@/types";
import { tokenStorage } from "@/lib/api/client";

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
  currency: string; // display currency
  currencyMode: "auto" | "manual";
  signIn: (u: User, token?: string) => void;
  setAvatar: (avatar: string) => void;
  signOut: () => void;
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  toggleSave: (tourId: string) => void;
  addBooking: (b: Booking) => void;
  cancelBooking: (id: string) => void;
  setCurrency: (currency: string, mode?: "auto" | "manual") => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      authModal: { open: false, mode: "login" },
      saved: [],
      bookings: [],
      currency: "KGS",
      currencyMode: "auto",
      signIn: (u, token) =>
        set((s) => {
          const prevUserId = s.user?.id ?? null;
          const nextUserId = u?.id ?? null;
          const userChanged = Boolean(prevUserId && nextUserId && prevUserId !== nextUserId);
          return {
            user: u,
            token: token ?? null,
            saved: userChanged ? [] : s.saved,
            bookings: userChanged ? [] : s.bookings,
          };
        }),
      setAvatar: (avatar) =>
        set((s) => {
          if (!s.user) return s as any;
          return { user: { ...s.user, avatar: String(avatar || "") } };
        }),
      signOut: () => {
        tokenStorage.clear();
        set({ user: null, token: null, saved: [], bookings: [] });
      },
      openAuthModal: (mode = "login") => set({ authModal: { open: true, mode } }),
      closeAuthModal: () => set((s) => ({ authModal: { ...s.authModal, open: false } })),
      toggleSave: (id) =>
        set((s) => ({ saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
      addBooking: (b) => set((s) => ({ bookings: [b, ...s.bookings] })),
      cancelBooking: (id) =>
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b)) })),
      setCurrency: (currency, mode = "manual") =>
        set({ currency: String(currency || "").toUpperCase(), currencyMode: mode }),
    }),
    {
      name: "kg-travel-store",
      // Next.js SSR hydration safety:
      // don't pull localStorage into the very first client render, otherwise
      // server HTML (guest state) may not match client HTML (rehydrated user/currency).
      skipHydration: true,
    }
  )
);
