import Link from "next/link";
import { ArrowUpRight, Globe2 } from "lucide-react";
import type { AICard, TourCard } from "@/components/ai/types";

const isTourCard = (card: AICard): card is TourCard => card.type === "tour" && Boolean(card.url);

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
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-32">
                {card.image ? (
                  <img
                    src={card.image}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground">
                    <Globe2 className="h-5 w-5" />
                  </div>
                )}
              </div>

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
