import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tokenStorage } from "@/lib/api/client";

export interface User {
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
  currency: string;
  currencyMode: "auto" | "manual";
  signIn: (u: User, token?: string) => void;
  signOut: () => void;
  setCurrency: (currency: string, mode?: "auto" | "manual") => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      currency: "KGS",
      currencyMode: "auto",
      signIn: (u, token) =>
        set(() => ({
          user: u,
          token: token ?? null,
        })),
      signOut: () => {
        tokenStorage.clear();
        set({ user: null, token: null });
      },
      setCurrency: (currency, mode = "manual") =>
        set({ currency: String(currency || "").toUpperCase(), currencyMode: mode }),
    }),
    { name: "kg-travel-store" }
  )
);

