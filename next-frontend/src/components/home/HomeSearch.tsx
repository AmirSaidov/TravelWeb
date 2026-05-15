"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function formatISODate(value: string) {
  return value.trim();
}

export function HomeSearch() {
  const router = useRouter();
  const [where, setWhere] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [guests, setGuests] = useState(0);

  const canSearch = useMemo(() => {
    if (!where.trim() && !from && !to && !guests) return false;
    return true;
  }, [from, guests, to, where]);

  const onSearch = () => {
    const qp = new URLSearchParams();
    if (where.trim()) qp.set("where", where.trim());
    if (from) qp.set("from", formatISODate(from));
    if (to) qp.set("to", formatISODate(to));
    if (guests > 0) qp.set("guests", String(guests));
    router.push(`/explore${qp.toString() ? `?${qp.toString()}` : ""}`);
  };

  return (
    <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-elevated backdrop-blur-md">
      <div className="grid gap-2 md:grid-cols-[1.2fr_0.9fr_0.9fr_0.6fr_auto] md:gap-3">
        <label className="flex flex-col gap-1 rounded-2xl bg-white/95 px-4 py-3 text-left">
          <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Куда</span>
          <input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="Город, место, регион"
            className="w-full bg-transparent text-sm font-medium text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
          />
        </label>

        <label className="flex flex-col gap-1 rounded-2xl bg-white/95 px-4 py-3 text-left">
          <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Заезд</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-[hsl(var(--foreground))] outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 rounded-2xl bg-white/95 px-4 py-3 text-left">
          <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Выезд</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-[hsl(var(--foreground))] outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 rounded-2xl bg-white/95 px-4 py-3 text-left">
          <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Гости</span>
          <input
            type="number"
            min={0}
            value={guests}
            onChange={(e) => setGuests(Math.max(0, Number(e.target.value || 0)))}
            className="w-full bg-transparent text-sm font-medium text-[hsl(var(--foreground))] outline-none"
          />
        </label>

        <button
          type="button"
          onClick={onSearch}
          disabled={!canSearch}
          className="inline-flex h-14 items-center justify-center rounded-2xl bg-[hsl(var(--brand))] px-6 text-sm font-semibold text-[hsl(var(--brand-foreground))] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Поиск
        </button>
      </div>
    </div>
  );
}

