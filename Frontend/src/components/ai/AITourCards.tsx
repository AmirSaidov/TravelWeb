import Link from "next/link";
import { ArrowUpRight, ImageOff, Mountain } from "lucide-react";
import { useMemo, useState } from "react";
import type { AICard, TourCard } from "@/components/ai/types";

const isTourCard = (card: AICard): card is TourCard => card.type === "tour" && Boolean(card.url);

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

const formatPrice = (card: TourCard) => {
  if (card.price == null || card.price === "") return null;
  const numeric = typeof card.price === "number" ? card.price : Number(card.price);
  const price = Number.isFinite(numeric)
    ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(numeric)
    : String(card.price);
  return `${price}${card.currency ? ` ${card.currency}` : ""}`;
};

export function AITourCards({ cards }: { cards?: AICard[] }) {
  const tourCards = (cards ?? []).filter(isTourCard);
  if (!tourCards.length) return null;

  return (
    <div className="space-y-3">
      {tourCards.map((card) => {
        const price = formatPrice(card);
        const details = [
          price,
          card.duration_days ? `${card.duration_days} дня` : null,
          card.difficulty,
        ].filter(Boolean);

        return (
          <Link
            key={`${card.type}-${card.id}`}
            href={card.url}
            className="group block overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
          >
            <div className="flex min-w-0 gap-3 p-3">
              <TourCardImage card={card} />

              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-sm font-semibold leading-tight">{card.title}</div>
                {details.length > 0 && (
                  <div className="mt-1 text-xs font-medium text-muted-foreground">{details.join(" · ")}</div>
                )}
                {card.destination && (
                  <div className="mt-1 truncate text-xs text-muted-foreground">{card.destination}</div>
                )}
                {card.description && (
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{card.description}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  Открыть тур
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

function TourCardImage({ card }: { card: TourCard }) {
  const imageUrl = useMemo(() => normalizeImageUrl(card.image), [card.image]);
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50 sm:h-24 sm:w-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.20),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(14,165,233,0.18),transparent_36%)]" />
        <div className="relative flex h-full flex-col items-center justify-center gap-1 px-2 text-center text-brand">
          {failed ? <ImageOff className="h-5 w-5" /> : <Mountain className="h-5 w-5" />}
          <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-foreground/75">
            {card.destination || "Kyrgyzstan tour"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-32">
      <img
        src={imageUrl}
        alt={card.title || card.destination || "Tour"}
        className="h-full w-full object-cover transition group-hover:scale-105"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
