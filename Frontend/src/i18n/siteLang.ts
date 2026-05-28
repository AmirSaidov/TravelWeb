export type SiteLang = "ru" | "en" | "ky";

export const SITE_LANG_KEY = "site_lang";

export function normalizeSiteLang(raw?: string | null): SiteLang {
  const v = String(raw || "")
    .trim()
    .toLowerCase();

  if (v.startsWith("ru")) return "ru";
  if (v === "kg" || v.startsWith("kg") || v.startsWith("ky")) return "ky";
  if (v.startsWith("en")) return "en";
  return "ru";
}

// i18next resources in this repo use "kg" for Kyrgyz, while the app-level language code is "ky".
export function toI18nLang(lang: SiteLang): "ru" | "en" | "kg" {
  return lang === "ky" ? "kg" : lang;
}

export function fromI18nLang(i18nLang?: string | null): SiteLang {
  return normalizeSiteLang(i18nLang);
}

