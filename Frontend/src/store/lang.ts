import { create } from "zustand";
import type { SiteLang } from "@/i18n/siteLang";
import { normalizeSiteLang, SITE_LANG_KEY, toI18nLang } from "@/i18n/siteLang";
import i18n from "@/i18n";

interface LangState {
  currentLang: SiteLang;
  setLang: (lang: SiteLang) => void;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const needle = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part.startsWith(needle)) continue;
    const raw = part.slice(needle.length);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

function readInitialLang(): SiteLang {
  // Critical for Next.js hydration: the first client render must match SSR.
  // SSR uses the `lang` cookie (see `src/app/layout.tsx`), so we seed the store from cookie too.
  // During SSR we can't read `document.cookie`, so we must fall back to a stable default.
  // The real initial language is injected from the server via `<Providers initialLang=... />`
  // which calls `initI18n(initialLang)` on the server and then syncs on the client.
  if (typeof window === "undefined") return "ru";
  const cookieLang = readCookie("lang");
  return normalizeSiteLang(cookieLang);
}

export const useLangStore = create<LangState>((set) => ({
  currentLang: readInitialLang(),
  setLang: (lang) => {
    const normalized = normalizeSiteLang(lang);
    set({ currentLang: normalized });

    if (typeof window === "undefined") return;

    localStorage.setItem(SITE_LANG_KEY, normalized);
    // Keep legacy key in sync, because some parts of the app and SSR cookie still use it.
    localStorage.setItem("lang", toI18nLang(normalized));
    document.cookie = `lang=${encodeURIComponent(normalized)}; path=/; max-age=31536000; samesite=lax`;

    i18n.changeLanguage(toI18nLang(normalized));
  },
}));
