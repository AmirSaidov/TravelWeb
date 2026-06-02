import { cookies } from "next/headers";
import { resources as i18nResources } from "./resources";

export function getLangFromCookies(): "en" | "ru" | "kg" {
  const lang = cookies().get("lang")?.value || "ru";
  if (lang === "kg" || lang.startsWith("ky")) return "kg";
  if (lang.startsWith("en")) return "en";
  return "ru";
}

/**
 * Server-side translation utility.
 * Safe to use in Next.js Server Components.
 */
export function getServerTranslation(lang?: "en" | "ru" | "kg") {
  const activeLang = lang || getLangFromCookies();
  const dict = (i18nResources as any)[activeLang]?.translation || (i18nResources as any)["ru"].translation;

  function t(key: string, variables?: Record<string, string | number>): string {
    const keys = key.split(".");
    let result: any = dict;

    for (const k of keys) {
      if (result === undefined) break;
      result = result[k];
    }

    if (typeof result !== "string") {
      // Fallback to English or Russian if key not found
      if (activeLang !== "ru") {
        const ruDict = (i18nResources as any)["ru"].translation;
        let ruFallback = ruDict;
        for (const k of keys) {
          if (ruFallback === undefined) break;
          ruFallback = ruFallback[k];
        }
        if (typeof ruFallback === "string") return replaceVars(ruFallback, variables);
      }
      return key;
    }

    return replaceVars(result, variables);
  }

  return { t, lang: activeLang };
}

function replaceVars(str: string, variables?: Record<string, string | number>) {
  if (!variables) return str;
  return str.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
    return key in variables ? String(variables[key]) : match;
  });
}
