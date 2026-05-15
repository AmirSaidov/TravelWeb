"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toursApi } from "@/lib/api";
import { TourCard, TourCardSkeleton } from "@/components/TourCard";

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const { data: tours = [], isLoading, isError } = useQuery({
    queryKey: ["tours"],
    queryFn: () => toursApi.getTours("USD"),
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return tours;
    return tours.filter((t) => `${t.title} ${t.location} ${t.region}`.toLowerCase().includes(term));
  }, [q, tours]);

  return (
    <section className="container-page py-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Туры по Кыргызстану</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{filtered.length} туров</p>
        </div>
        <div className="w-full sm:w-80">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3.5">
            <Search className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск туров…"
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <TourCardSkeleton key={`tour-skeleton-${i}`} />)
          : isError
            ? (
                <div className="col-span-full rounded-3xl border border-dashed border-[hsl(var(--border))] py-16 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  Не удалось загрузить туры. Проверь backend/API URL.
                </div>
              )
            : filtered.map((tour) => <TourCard key={tour.id} tour={tour} />)}
      </div>
    </section>
  );
}

