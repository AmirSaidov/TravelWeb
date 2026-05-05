import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import { TourCard } from "@/components/ui-bits/TourCard";
import { tours } from "@/mocks/data";
import type { Difficulty, TourType } from "@/types";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import searchAnimation from "@/assets/lottie/searching.json";

const durationBuckets = [
  { id: "1-3", label: "1-3 days", match: (d: number) => d <= 3 },
  { id: "4-7", label: "4-7 days", match: (d: number) => d >= 4 && d <= 7 },
  { id: "8-14", label: "8-14 days", match: (d: number) => d >= 8 && d <= 14 },
  { id: "15+", label: "15+ days", match: (d: number) => d >= 15 },
];

const difficulties: { id: Difficulty; label: string; emoji: string }[] = [
  { id: "easy", label: "Easy", emoji: "🌿" },
  { id: "moderate", label: "Moderate", emoji: "🥾" },
  { id: "challenging", label: "Challenging", emoji: "⛰️" },
];

const tourTypes: TourType[] = ["horseback", "trekking", "culinary", "off-road", "winter"];
const perPage = 6;

const Explore = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const initialCat = (params.get("cat") || "") as TourType | "";
  const [price, setPrice] = useState<[number, number]>([50, 1200]);
  const [duration, setDuration] = useState<string[]>(["4-7"]);
  const [diff, setDiff] = useState<Difficulty[]>(["moderate"]);
  const [types, setTypes] = useState<TourType[]>(initialCat ? [initialCat] : ["trekking"]);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "price-asc" | "price-desc" | "rating">("popular");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const base = tours.filter((tr) => {
      if (q && !`${tr.title} ${tr.location} ${tr.region}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (tr.price < price[0] || tr.price > price[1]) return false;
      if (duration.length && !duration.some((d) => durationBuckets.find((b) => b.id === d)?.match(tr.durationDays))) return false;
      if (diff.length && !diff.includes(tr.difficulty)) return false;
      if (types.length && !types.some((tt) => tr.types.includes(tt))) return false;
      return true;
    });

    return [...base].sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return b.reviewCount - a.reviewCount;
    });
  }, [q, price, duration, diff, types, sortBy]);

  const pagesCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const visibleTours = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    setPage(1);
  }, [q, price, duration, diff, types, sortBy]);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const cycleSort = () => {
    setSortBy((prev) => {
      if (prev === "popular") return "price-asc";
      if (prev === "price-asc") return "price-desc";
      if (prev === "price-desc") return "rating";
      return "popular";
    });
  };

  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-7">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">{t("explore.priceRange")}</span>
              <span className="text-xs text-muted-foreground">USD</span>
            </div>
            <Slider min={50} max={1500} step={10} value={price} onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border px-3 py-2"><div className="text-muted-foreground">Min</div><div className="font-semibold">${price[0]}</div></div>
              <div className="rounded-xl border border-border px-3 py-2"><div className="text-muted-foreground">Max</div><div className="font-semibold">${price[1]}{price[1] >= 1500 ? "+" : ""}</div></div>
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold">{t("explore.duration")}</div>
            <div className="space-y-2">
              {durationBuckets.map((b) => (
                <label key={b.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox checked={duration.includes(b.id)} onCheckedChange={() => toggle(duration, b.id, setDuration)} />
                  {b.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold">{t("explore.difficulty")}</div>
            <div className="flex flex-wrap gap-2">
              {difficulties.map((d) => (
                <button key={d.id} onClick={() => toggle(diff, d.id, setDiff)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors", diff.includes(d.id) ? "bg-brand-soft text-accent-foreground ring-brand" : "bg-background text-foreground ring-border hover:bg-muted")}>
                  {t(`explore.${d.id}` as never)} <span className="ml-0.5">{d.emoji}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold">{t("explore.tourType")}</div>
            <div className="flex flex-wrap gap-2">
              {tourTypes.map((tt) => (
                <button key={tt} onClick={() => toggle(types, tt, setTypes)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors capitalize", types.includes(tt) ? "bg-primary text-primary-foreground ring-primary" : "bg-background ring-border hover:bg-muted")}>
                  {tt.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-brand-soft p-4">
            <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground"><Leaf className="h-4 w-4" /></div>
            <div className="font-display text-base font-semibold">{t("explore.sustainable")}</div>
            <p className="mt-1 text-xs text-accent-foreground/80">{t("explore.sustainableText")}</p>
            <Link to="/experiences" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">{t("explore.learnMore")} →</Link>
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
              <Button variant="default" className="bg-primary text-primary-foreground" onClick={cycleSort}>{t("explore.sort")} ({sortBy})</Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {visibleTours.length > 0 ? (
              <motion.div key={`page-${page}-${sortBy}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-8 rounded-3xl border border-border bg-card p-8 text-center shadow-card">
                <div className="mx-auto h-36 w-36"><Lottie animationData={searchAnimation} loop autoplay /></div>
                <h3 className="mt-3 font-display text-xl font-semibold">No tours found</h3>
                <p className="mt-1 text-sm text-muted-foreground">Adjust filters and try again.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Pagination page={page} pagesCount={pagesCount} setPage={setPage} />
        </section>
      </div>
    </div>
  );
};

const Pagination = ({ page, pagesCount, setPage }: { page: number; pagesCount: number; setPage: (value: number) => void }) => (
  <div className="mt-12 flex justify-center gap-1">
    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
    {Array.from({ length: Math.min(pagesCount, 5) }, (_, i) => i + 1).map((n) => (
      <button key={n} onClick={() => setPage(n)} className={cn("grid h-9 w-9 place-items-center rounded-full text-sm font-medium", n === page ? "bg-brand text-brand-foreground" : "text-foreground hover:bg-muted")}>{n}</button>
    ))}
    {pagesCount > 5 && <span className="grid h-9 w-9 place-items-center text-muted-foreground">…</span>}
    {pagesCount > 5 && <button onClick={() => setPage(pagesCount)} className="grid h-9 w-9 place-items-center rounded-full text-sm font-medium hover:bg-muted">{pagesCount}</button>}
    <button onClick={() => setPage(Math.min(pagesCount, page + 1))} disabled={page === pagesCount} className="grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
  </div>
);

export default Explore;
