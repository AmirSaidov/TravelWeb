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

export function formatMoney(amount: number, currency?: string | null): string {
  const cur = normalizeCurrency(currency);
  const safe = Number.isFinite(amount) ? amount : 0;
  const rounded = Math.round(safe * 100) / 100;
  const number = rounded.toLocaleString(undefined, {
    maximumFractionDigits: rounded % 1 === 0 ? 0 : 2,
  });

  if (!cur) return number;
  const prefix = SYMBOL_PREFIX[cur];
  if (prefix) return `${prefix}${number}`;
  const suffix = SYMBOL_SUFFIX[cur] ?? ` ${cur}`;
  return `${number}${suffix}`;
}

