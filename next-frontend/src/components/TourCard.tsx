import Link from "next/link";
import { Heart, MapPin, Star } from "lucide-react";
import type { Tour } from "@/types";
import { formatMoney } from "@/lib/currency";
import { Skeleton } from "@/components/ui/Skeleton";

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <Link
      href={`/tour/${tour.slug}`}
      className="group block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]"
    >
      <div className="overflow-hidden rounded-3xl bg-[hsl(var(--card))] shadow-card ring-1 ring-[hsl(var(--border))] transition-[transform,box-shadow] duration-300 will-change-transform [transform:translateZ(0)] hover:-translate-y-0.5 hover:shadow-elevated">
        <div className="relative aspect-[4/3] overflow-hidden bg-[hsl(var(--muted))]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tour.hero}
            alt={tour.title}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="h-full w-full object-cover transition-transform duration-500 [transform:translateZ(0)] group-hover:scale-105"
          />
          <button
            type="button"
            className="group/save absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[hsl(var(--foreground))] shadow-sm backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95"
            aria-label="Save tour"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="relative z-10 h-4 w-4 transition-all duration-300 group-hover/save:scale-110" />
          </button>
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            <MapPin className="h-3 w-3" /> {tour.location}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-base font-semibold leading-snug">{tour.title}</h3>
            <div className="flex items-center gap-1 text-xs text-[hsl(var(--foreground))]">
              <Star className="h-4 w-4 fill-[hsl(var(--foreground))]" />
              <span className="font-medium">{tour.rating.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
            <span>{tour.duration}</span>
            <span className="capitalize">{tour.difficulty}</span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <span className="text-lg font-semibold">{formatMoney(tour.price, tour.currency)}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]"> / person</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TourCardSkeleton() {
  return (
    <div className="rounded-3xl bg-[hsl(var(--card))] shadow-card ring-1 ring-[hsl(var(--border))]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[hsl(var(--muted))]">
        <Skeleton className="h-full w-full rounded-none" />
        <Skeleton className="absolute right-3 top-3 h-9 w-9 rounded-full" />
        <Skeleton className="absolute bottom-3 left-3 h-6 w-28 rounded-full" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-4 w-10 rounded-full" />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="mt-3">
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
}

