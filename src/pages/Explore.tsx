import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Leaf, ChevronLeft, ChevronRight, CircleDollarSign, CalendarDays, Gauge, Tags } from "lucide-react";
import { TourCard } from "@/components/ui-bits/TourCard";
import { tours } from "@/mocks/data";
import type { Difficulty, TourType } from "@/types";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const durationBuckets = [
  { id: "1-3", label: "1 - 3 days", match: (d: number) => d <= 3 },
  { id: "4-7", label: "4 - 7 days", match: (d: number) => d >= 4 && d <= 7 },
  { id: "8-14", label: "8 - 14 days", match: (d: number) => d >= 8 && d <= 14 },
  { id: "15+", label: "15+ days", match: (d: number) => d >= 15 },
];

const difficulties: { id: Difficulty; label: string; iconSrc: string; dotClass: string }[] = [
  { id: "easy", label: "Easy", iconSrc: "/icons/diff-challenging.png", dotClass: "bg-[#26B36C]" },
  { id: "moderate", label: "Moderate", iconSrc: "/icons/diff-easy.png", dotClass: "bg-[#F2B943]" },
  { id: "challenging", label: "Challenging", iconSrc: "/icons/diff-moderate.png", dotClass: "bg-[#EF6A66]" },
];

const tourTypes: { id: TourType; label: string; iconSrc: string }[] = [
  { id: "horseback", label: "Horseback", iconSrc: "/icons/type-horseback.png" },
  { id: "trekking", label: "Trekking", iconSrc: "/icons/type-trekking.png" },
  { id: "culinary", label: "Culinary", iconSrc: "/icons/type-culinary.png" },
  { id: "off-road", label: "Off Road", iconSrc: "/icons/type-offroad.png" },
  { id: "winter", label: "Winter", iconSrc: "/icons/type-winter.png" },
];

const Explore = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const initialCat = (params.get("cat") || "") as TourType | "";
  const [price, setPrice] = useState<[number, number]>([50, 1200]);
  const [duration, setDuration] = useState<string[]>(["4-7"]);
  const [diff, setDiff] = useState<Difficulty[]>(["moderate"]);
  const [types, setTypes] = useState<TourType[]>(initialCat ? [initialCat] : ["trekking"]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return tours.filter((tr) => {
      if (q && !`${tr.title} ${tr.location} ${tr.region}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (tr.price < price[0] || tr.price > price[1]) return false;
      if (duration.length && !duration.some((d) => durationBuckets.find((b) => b.id === d)?.match(tr.durationDays))) return false;
      if (diff.length && !diff.includes(tr.difficulty)) return false;
      if (types.length && !types.some((tt) => tr.types.includes(tt))) return false;
      return true;
    });
  }, [q, price, duration, diff, types]);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6 rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#EAF7F1] text-[#1AAE75]">
                <CircleDollarSign className="h-4 w-4" />
              </div>
              <span className="text-base font-semibold">{t("explore.priceRange")}</span>
              <span className="ml-auto text-xs font-medium text-muted-foreground">USD</span>
            </div>
            <Slider min={50} max={1500} step={10} value={price} onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])} />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <div className="text-muted-foreground">Минимум</div>
                <div className="text-xl font-semibold leading-tight">${price[0]}</div>
              </div>
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <div className="text-muted-foreground">Максимум</div>
                <div className="text-xl font-semibold leading-tight">${price[1]}{price[1] >= 1500 ? "+" : ""}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/70 pt-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#EAF3FF] text-[#4B72C2]">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="text-base font-semibold">{t("explore.duration")}</div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {durationBuckets.map((b) => (
                <label key={b.id} className={cn("flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  duration.includes(b.id) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted")}>
                  <Checkbox checked={duration.includes(b.id)} onCheckedChange={() => toggle(duration, b.id, setDuration)} />
                  {b.label}
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-border/70 pt-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#EEF7FF] text-[#5C7CA8]">
                <Gauge className="h-4 w-4" />
              </div>
              <div className="text-base font-semibold">{t("explore.difficulty")}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {difficulties.map((d) => (
                <Button
                  key={d.id}
                  size="default"
                  variant="outline"
                  onClick={() => toggle(diff, d.id, setDiff)}
                  className={cn("h-auto flex-col rounded-2xl px-2 py-4 text-xs",
                    diff.includes(d.id) ? "border-[#1AAE75] bg-[#F0FBF6] text-foreground" : "border-border bg-background text-foreground hover:bg-muted")}
                >
                  <img src={d.iconSrc} alt="" className="h-14 w-14 object-contain" />
                  <span className="mt-1.5">{t(`explore.${d.id}` as any)}</span>
                  <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", d.dotClass)} />
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t border-border/70 pt-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#EEF7FF] text-[#5C7CA8]">
                <Tags className="h-4 w-4" />
              </div>
              <div className="text-base font-semibold">{t("explore.tourType")}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tourTypes.map((tt) => (
                <Button
                  key={tt.id}
                  size="sm"
                  variant="outline"
                  onClick={() => toggle(types, tt.id, setTypes)}
                  className={cn("rounded-full px-3 py-1.5 text-xs",
                    types.includes(tt.id) ? "bg-primary text-primary-foreground ring-primary" : "bg-background ring-border hover:bg-muted")}
                >
                  <span className="flex items-center gap-1.5">
                    <img src={tt.iconSrc} alt="" className="h-12 w-12 object-contain" />
                    {tt.label}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t border-border/70 pt-5">
            <div className="rounded-2xl bg-[#EAF7F1] p-4">
              <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-[#17B57A] text-white"><Leaf className="h-4 w-4" /></div>
              <div className="font-display text-base font-semibold">{t("explore.sustainable")}</div>
              <p className="mt-1 text-xs text-accent-foreground/80">{t("explore.sustainableText")}</p>
              <div className="mt-3 h-2 rounded-full bg-white/80">
                <div className="h-2 w-[82%] rounded-full bg-[#17B57A]" />
              </div>
              <p className="mt-2 text-xs font-medium text-[#17B57A]">82% eco-friendly</p>
              <Link to="#" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">{t("explore.learnMore")} →</Link>
            </div>
          </div>

          <div className="border-t border-border/70 pt-5">
            <Button variant="outline" className="h-11 w-full rounded-xl">
              Сбросить фильтры
            </Button>
          </div>
        </aside>

        <section>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t("explore.title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("explore.count", { n: filtered.length })}</p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("explore.searchP")} className="pl-9" />
              </div>
              <Button variant="default" className="bg-primary text-primary-foreground">{t("explore.sort")}</Button>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tour) => <TourCard key={tour.id} tour={tour} />)}
          </div>

          <Pagination />
        </section>
      </div>
    </div>
  );
};

const Pagination = () => (
  <div className="mt-12 flex justify-center gap-1">
    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full text-muted-foreground"><ChevronLeft className="h-4 w-4" /></Button>
    {[1, 2, 3].map((n) => (
      <Button key={n} variant={n === 1 ? "default" : "ghost"} size="icon" className={cn("h-9 w-9 rounded-full text-sm font-medium", n === 1 ? "bg-brand text-brand-foreground hover:bg-brand/90" : "text-foreground")}>{n}</Button>
    ))}
    <span className="grid h-9 w-9 place-items-center text-muted-foreground">...</span>
    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-sm font-medium">12</Button>
    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full"><ChevronRight className="h-4 w-4" /></Button>
  </div>
);

export default Explore;
