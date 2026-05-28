const SYMBOL_PREFIX: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const SYMBOL_SUFFIX: Record<string, string> = {
  RUB: " ₽",
  KGS: " KGS",
};

export function normalizeCurrency(raw?: string | null): string {
  const c = String(raw || "").trim();
  if (!c) return "";
  const up = c.toUpperCase();
  if (up === "KGZ" || up === "KGS") return "KGS";
  if (c === "сом" || c === "СОМ" || c === "Som" || c === "som") return "KGS";
  return up;
}

export function getNumberLocale(): string {
  if (typeof document === "undefined") return "en-US";
  try {
    const parts = document.cookie.split(";").map((p) => p.trim());
    const raw = parts.find((p) => p.startsWith("lang="))?.slice("lang=".length) ?? "";
    const lang = decodeURIComponent(raw || "").toLowerCase();
    if (lang.startsWith("ru")) return "ru-RU";
    if (lang.startsWith("ky") || lang.startsWith("kg")) return "ky-KG";
    return "en-US";
  } catch {
    return "en-US";
  }
}

export function formatMoney(amount: number, currency?: string | null): string {
  const cur = normalizeCurrency(currency);
  const safe = Number.isFinite(amount) ? amount : 0;
  const rounded = Math.round(safe * 100) / 100;
  const number = rounded.toLocaleString(getNumberLocale(), {
    maximumFractionDigits: rounded % 1 === 0 ? 0 : 2,
  });

  if (!cur) return number;
  const prefix = SYMBOL_PREFIX[cur];
  if (prefix) return `${prefix}${number}`;
  const suffix = SYMBOL_SUFFIX[cur] ?? ` ${cur}`;
  return `${number}${suffix}`;
}
