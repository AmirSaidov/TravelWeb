import Link from "next/link";
import { ArrowUpRight, BedDouble, Home, ImageOff, MapPin, Star, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { AICard, StayCard } from "@/components/ai/types";

const isStayCard = (card: AICard): card is StayCard =>
  card.type === "stay" && Boolean(card.url || card.slug);

const apiOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return "http://localhost:8000";
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  }
})();

const normalizeImageUrl = (image?: string | null) => {
  const value = image?.trim();
  if (!value) return null;
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (value.startsWith("/media/")) return `${apiOrigin}${value}`;
  if (value.startsWith("media/")) return `${apiOrigin}/${value}`;
  return value;
};

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatNumber = (value: number | string | null | undefined, maximumFractionDigits = 0) => {
  const numeric = toNumber(value);
  if (numeric === null) return String(value ?? "");
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(numeric);
};

const formatPrice = (card: StayCard) => {
  if (card.price_per_night === null || card.price_per_night === undefined || card.price_per_night === "") return null;
  const price = formatNumber(card.price_per_night);
  return `${price}${card.currency ? ` ${card.currency}` : ""} / night`;
};

const stayTypeLabel = (value?: string) => {
  const type = value?.trim().toLowerCase();
  if (!type) return null;
  const labels: Record<string, string> = {
    hotel: "Hotel",
    yurt: "Yurt",
    guesthouse: "Guesthouse",
    camp: "Camp",
  };
  return labels[type] ?? value;
};

const stayHref = (card: StayCard) => card.url || `/stays/${card.slug}`;

export function AIStayCards({ cards }: { cards?: AICard[] }) {
  const stayCards = (cards ?? []).filter(isStayCard);
  if (!stayCards.length) return null;

  return (
    <div className="space-y-3">
      {stayCards.map((card) => {
        const price = formatPrice(card);
        const location = [card.location, card.region].filter(Boolean).join(", ");
        const stayType = stayTypeLabel(card.stay_type);
        const guests = card.max_guests ? `up to ${formatNumber(card.max_guests)} guests` : null;
        const amenities = Array.isArray(card.amenities) ? card.amenities.filter(Boolean).slice(0, 4) : [];
        const rating = card.rating ? formatNumber(card.rating, 1) : null;
        const reviews = card.review_count ? formatNumber(card.review_count) : null;

        return (
          <Link
            key={`${card.type}-${card.id}`}
            href={stayHref(card)}
            className="group block overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
          >
            <div className="flex min-w-0 gap-3 p-3">
              <StayCardImage card={card} />

              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-sm font-semibold leading-tight">{card.title}</div>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground">
                  {price && <span>{price}</span>}
                  {stayType && (
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      {stayType}
                    </span>
                  )}
                  {guests && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {guests}
                    </span>
                  )}
                </div>

                {location && (
                  <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
                )}

                {(rating || reviews) && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    {rating ?? "New"}
                    {reviews && <span className="font-medium text-amber-700/75">({reviews})</span>}
                  </div>
                )}

                {amenities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="max-w-full truncate rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}

                <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  Open stay
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function StayCardImage({ card }: { card: StayCard }) {
  const imageUrl = useMemo(() => normalizeImageUrl(card.hero || card.image), [card.hero, card.image]);
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50 sm:h-24 sm:w-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(14,165,233,0.20),transparent_34%),radial-gradient(circle_at_78%_72%,rgba(16,185,129,0.20),transparent_36%)]" />
        <div className="relative flex h-full flex-col items-center justify-center gap-1 px-2 text-center text-brand">
          {failed ? <ImageOff className="h-5 w-5" /> : <Home className="h-5 w-5" />}
          <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-foreground/75">
            {card.location || card.region || "Kyrgyzstan stay"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-32">
      <img
        src={imageUrl}
        alt={card.title || card.location || "Stay"}
        className="h-full w-full object-cover transition group-hover:scale-105"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
