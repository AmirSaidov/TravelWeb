import { Link } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import type { Tour } from "@/types";
import { useAppStore } from "@/store/app";
import { RatingStars } from "./RatingStars";
import { cn } from "@/lib/utils";

export const TourCard = ({ tour, layout = "vertical" }: { tour: Tour; layout?: "vertical" | "compact" }) => {
  const saved = useAppStore((s) => s.saved.includes(tour.id));
  const toggleSave = useAppStore((s) => s.toggleSave);

  return (
    <Link
      to={`/tour/${tour.slug}`}
      className="group block overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-border/60 transition-all hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={tour.hero} alt={tour.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {tour.badge && (
          <span className="absolute left-3 top-3 rounded-md bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-foreground shadow-sm">
            {tour.badge}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); toggleSave(tour.id); }}
          className="group/save absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95"
          aria-label="Save tour"
        >
          {saved && <span className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />}
          <Heart className={cn("relative z-10 h-4 w-4 transition-all duration-300 group-hover/save:scale-110", saved && "fill-destructive text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.55)]")} />
        </button>
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          <MapPin className="h-3 w-3" /> {tour.location}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-semibold leading-snug">{tour.title}</h3>
          <RatingStars value={tour.rating} />
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{tour.duration}</span>
          <span className="capitalize">{tour.difficulty}</span>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <span className="text-lg font-semibold">${tour.price}</span>
            <span className="text-xs text-muted-foreground"> / person</span>
          </div>
          {layout === "vertical" && tour.badge === "ALL INCLUSIVE" && (
            <span className="rounded-full bg-brand-soft px-2 py-1 text-[10px] font-medium text-accent-foreground">All Inclusive</span>
          )}
        </div>
      </div>
    </Link>
  );
};
