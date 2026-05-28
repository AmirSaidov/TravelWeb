import { CloudSun, Droplets, MapPin, Thermometer, Wind, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AICard, WeatherCard } from "@/components/ai/types";

const isWeatherCard = (card: AICard): card is WeatherCard => card.type === "weather";

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatNumber = (value: number | string | null | undefined, unit = "") => {
  const numeric = toNumber(value);
  if (numeric === null) return "-";
  const formatted = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(numeric);
  return `${formatted}${unit}`;
};

const formatTemperature = (value: number | string | null | undefined) => formatNumber(value, "°C");

const weatherTone = (temperature: number | string | null | undefined) => {
  const numeric = toNumber(temperature);
  if (numeric === null) return "from-sky-50 via-background to-brand-soft";
  if (numeric <= 5) return "from-sky-100 via-background to-blue-50";
  if (numeric >= 26) return "from-amber-50 via-background to-orange-50";
  return "from-emerald-50 via-background to-sky-50";
};

export function AIWeatherCards({ cards }: { cards?: AICard[] }) {
  const weatherCards = (cards ?? []).filter(isWeatherCard);
  if (!weatherCards.length) return null;

  return (
    <div className="space-y-3">
      {weatherCards.map((card, index) => {
        const range =
          toNumber(card.temp_min) !== null || toNumber(card.temp_max) !== null
            ? `${formatTemperature(card.temp_min)} / ${formatTemperature(card.temp_max)}`
            : "-";

        return (
          <div
            key={`${card.type}-${card.location}-${index}`}
            className={cn(
              "overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br p-4 shadow-card",
              weatherTone(card.temperature),
            )}
          >
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{card.location || "Локация"}</span>
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <div className="font-display text-5xl font-semibold leading-none text-foreground">
                    {formatTemperature(card.temperature)}
                  </div>
                  {card.description && (
                    <div className="pb-1 text-sm font-medium text-muted-foreground">{card.description}</div>
                  )}
                </div>
              </div>

              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-background/80 text-brand shadow-card ring-1 ring-border/70">
                <CloudSun className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <WeatherMetric icon={Wind} label="Ветер" value={formatNumber(card.wind_speed, " км/ч")} />
              <WeatherMetric icon={Droplets} label="Осадки" value={formatNumber(card.precipitation, " мм")} />
              <WeatherMetric icon={Thermometer} label="Мин / макс" value={range} />
            </div>

            {card.recommendation && (
              <div className="mt-4 rounded-xl border border-border/70 bg-background/75 px-3 py-2.5 text-sm leading-6 text-foreground">
                {card.recommendation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeatherMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border/60 bg-background/65 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
