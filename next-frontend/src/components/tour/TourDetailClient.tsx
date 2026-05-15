"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star } from "lucide-react";
import { toursApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

export function TourDetailClient({ slug }: { slug: string }) {
  const { data: tour, isLoading, isError } = useQuery({
    queryKey: ["tour", slug],
    queryFn: () => toursApi.getTourBySlug(slug, "USD"),
  });

  if (isLoading) {
    return (
      <div className="container-page py-10">
        <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] p-8">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/3" />
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Skeleton className="aspect-[4/3] w-full rounded-3xl md:col-span-2 md:row-span-2" />
            <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
            <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !tour) {
    return (
      <div className="container-page py-10">
        <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] py-16 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Тур не найден или не удалось загрузить.
          <div className="mt-4">
            <Link href="/explore" className="text-[hsl(var(--primary))] hover:underline">
              Вернуться к турам
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const gallery = (tour.gallery && tour.gallery.length > 0 ? tour.gallery : [tour.hero]).filter(Boolean);
  const safePhoto = (i: number) => gallery[i] ?? gallery[0];

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{tour.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
            <span className="inline-flex items-center gap-1 text-[hsl(var(--foreground))]">
              <Star className="h-4 w-4 fill-[hsl(var(--foreground))]" /> {tour.rating.toFixed(2)}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {tour.location}
            </span>
          </div>
        </div>
        <div className="flex gap-3 text-sm">
          <Link
            href="/explore"
            className="inline-flex h-10 items-center justify-center rounded-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 font-medium hover:bg-[hsl(var(--accent))]"
          >
            Все туры
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 overflow-hidden rounded-3xl md:grid-cols-3">
        <div className="relative aspect-[4/3] overflow-hidden md:col-span-2 md:row-span-2 md:aspect-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={safePhoto(0)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="aspect-[4/3] overflow-hidden bg-[hsl(var(--muted))]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={safePhoto(1)} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="aspect-[4/3] overflow-hidden bg-[hsl(var(--muted))]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={safePhoto(2)} alt="" className="h-full w-full object-cover" />
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="font-display text-2xl font-semibold">Описание</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[hsl(var(--muted-foreground))]">
            {tour.longDescription || tour.description}
          </p>
        </div>

        <aside className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-card">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Цена</div>
          <div className="mt-1 font-display text-3xl font-semibold">
            {tour.price.toLocaleString()} {tour.currency}
          </div>
          <div className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Длительность: <span className="text-[hsl(var(--foreground))] font-medium">{tour.duration}</span>
          </div>
          <div className="mt-6 rounded-2xl bg-[hsl(var(--muted))]/40 p-4 text-xs text-[hsl(var(--muted-foreground))]">
            Бронирование/оплата и отзывы перенесём на следующем этапе (после миграции авторизации и стора).
          </div>
        </aside>
      </div>
    </div>
  );
}

