"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toursApi } from "@/lib/api";
import { TourCardSkeleton, TourCard } from "@/components/TourCard";

export function HomeTours() {
  const { data: tours = [], isLoading } = useQuery({
    queryKey: ["tours"],
    queryFn: () => toursApi.getTours("USD"),
  });

  const curated = useMemo(() => tours.slice(0, 6), [tours]);

  return (
    <section className="container-page py-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Популярные туры</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Лучшие направления Кыргызстана</p>
        </div>
        <Link
          href="/explore"
          className="hidden items-center gap-1 border-b border-[hsl(var(--foreground))]/70 pb-1 text-xs font-semibold text-[hsl(var(--foreground))] transition-colors hover:border-[hsl(var(--foreground))] md:flex"
        >
          Смотреть все
        </Link>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <TourCardSkeleton key={`home-skel-${i}`} />)
          : curated.map((t) => <TourCard key={t.id} tour={t} />)}
      </div>
    </section>
  );
}

