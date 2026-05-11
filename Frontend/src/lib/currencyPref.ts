import { normalizeCurrency } from "@/lib/currency";
import { useAppStore } from "@/store/app";

export const CURRENCIES = ["KGS", "USD", "EUR", "RUB"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export function currencyForLang(lang?: string | null): CurrencyCode {
  const l = String(lang || "").toLowerCase();
  if (l === "en") return "USD";
  return "KGS";
}

export function getPreferredCurrency(): string {
  const st = useAppStore.getState();
  const cur = normalizeCurrency(st.currency);
  return cur || "KGS";
}

