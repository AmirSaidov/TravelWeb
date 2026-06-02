import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resources } from "./resources";

// Bundle translations for supported UI languages.
// This avoids relying on runtime auto-translate for core navigation/UI copy.
export const i18nResources = resources;
const onlineResources = resources;

let didInit = false;
// NOTE:
// Translation is strictly driven by the static i18next resources in this file.
// No runtime auto-translation, no caching to localStorage.

function normalizeLang(raw?: string | null) {
  const v = String(raw || "").trim().toLowerCase();
  if (!v) return "ru";
  if (v.startsWith("ru")) return "ru";
  if (v === "kg" || v.startsWith("ky") || v.startsWith("kg")) return "kg";
  if (v.startsWith("en")) return "en";
  return "ru";
}

export function initI18n(initialLang?: string | null) {
  const lng = normalizeLang(initialLang);

  if (!didInit) {
    // IMPORTANT:
    // Don't read localStorage here. This module can be evaluated during server rendering.
    // We pass the initial language from a server cookie via `src/app/layout.tsx`.
    i18n.use(initReactI18next).init({
      resources: onlineResources as any,
      lng,
      fallbackLng: "en",
      interpolation: { escapeValue: false },
      saveMissing: false,
    });
    didInit = true;
    return i18n;
  }

  if (i18n.language !== lng) {
    // With inlined resources this is synchronous and avoids SSR/CSR mismatches.
    i18n.changeLanguage(lng);
  }

  return i18n;
}

export default i18n;
