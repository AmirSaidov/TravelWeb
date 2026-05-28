"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { TourCard, TourCardSkeleton } from "@/components/ui-bits/TourCard";
import { useQuery } from "@tanstack/react-query";
import { toursApi } from "@/lib/api";
import type { Difficulty, TourType } from "@/types";
import { Button, Checkbox, Drawer, Empty, Input, Pagination as AntPagination, Slider } from "antd";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";

const DEFAULT_PRICE_MIN = 0;
const DEFAULT_PRICE_MAX = 1500;
const DEFAULT_PRICE_STEP = 10;

const durationBuckets = [
  { id: "1-3", label: "1–3 days", match: (d: number) => d <= 3 },
  { id: "4-7", label: "4–7 days", match: (d: number) => d >= 4 && d <= 7 },
  { id: "8-14", label: "8–14 days", match: (d: number) => d >= 8 && d <= 14 },
  { id: "15+", label: "15+ days", match: (d: number) => d >= 15 },
];

const difficulties: { id: Difficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "moderate", label: "Moderate" },
  { id: "challenging", label: "Challenging" },
];

const PAGE_SIZE = 20;

const typeMeta: Record<TourType, { iconSrc: string; labelKey: string }> = {
  trekking: { iconSrc: "/icons/hiking.png", labelKey: "categories.hiking" },
  horseback: { iconSrc: "/icons/horse.png", labelKey: "categories.horse" },
  cultural: { iconSrc: "/icons/cultural.png", labelKey: "categories.cultural" },
  eco: { iconSrc: "/icons/eco.png", labelKey: "categories.eco" },
  yurts: { iconSrc: "/icons/yurts.png", labelKey: "categories.yurts" },
  culinary: { iconSrc: "/icons/cultural.png", labelKey: "categories.cultural" },
  "off-road": { iconSrc: "/icons/hiking.png", labelKey: "categories.hiking" },
  winter: { iconSrc: "/icons/hiking.png", labelKey: "categories.hiking" },
};

const Explore = () => {
  const { t, i18n } = useTranslation();
  const currency = useAppStore((s) => s.currency);
  const currentLang = i18n.language;
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const setParams = (next: URLSearchParams, opts?: { replace?: boolean }) => {
    const qs = next.toString();
    const url = qs ? `/explore?${qs}` : "/explore";
    if (opts?.replace) router.replace(url);
    else router.push(url);
  };
  const initialCat = (params.get("cat") || "") as TourType | "";
  const initialWhere = (params.get("where") || "").trim();
  const initialGuests = Number(params.get("guests") || 0) || 0;
  const from = params.get("from");
  const to = params.get("to");
  const tripDays =
    from && to ? Math.max(1, differenceInCalendarDays(parseISO(to), parseISO(from)) + 1) : null;
  // Defaults should show all tours until the user narrows filters.
  const [price, setPrice] = useState<[number, number]>([DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX]);
  const [minText, setMinText] = useState(() => String(DEFAULT_PRICE_MIN));
  const [maxText, setMaxText] = useState(() => String(DEFAULT_PRICE_MAX));
  const [priceDirty, setPriceDirty] = useState(false);
  const [duration, setDuration] = useState<string[]>([]);
  const [diff, setDiff] = useState<Difficulty[]>([]);
  const [types, setTypes] = useState<TourType[]>(initialCat ? [initialCat] : []);
  const [q, setQ] = useState(initialWhere);
  const [sort, setSort] = useState<"popular" | "price_asc" | "price_desc">("popular");
  const pageFromUrl = Math.max(1, Number(params.get("page") || 1) || 1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const currencyLabel = String(currency || "").toUpperCase();

  const { data: tours = [], isLoading, isError } = useQuery({
    queryKey: ["tours", currency, currentLang],
    queryFn: () => toursApi.getTours(currency),
  });

  const priceBounds = useMemo(() => {
    const prices = tours
      .map((x) => Number(x.price))
      .filter((n) => Number.isFinite(n) && n >= 0);

    const min = prices.length ? Math.min(...prices) : DEFAULT_PRICE_MIN;
    const rawMax = prices.length ? Math.max(...prices) : DEFAULT_PRICE_MAX;

    const max = Math.max(DEFAULT_PRICE_MAX, rawMax);
    const step = max >= 20_000 ? 250 : max >= 5_000 ? 100 : max >= 2_000 ? 50 : DEFAULT_PRICE_STEP;
    const niceMax = Math.ceil(max / step) * step;

    return {
      min: Math.floor(min / step) * step,
      max: niceMax,
      step,
    };
  }, [tours]);

  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
  const snap = (n: number, step: number) => Math.round(n / step) * step;
  const setPriceSafe = (nextMin: number, nextMax: number, opts?: { markDirty?: boolean }) => {
    const { min, max, step } = priceBounds;
    const a = snap(clamp(Number(nextMin), min, max), step);
    const b = snap(clamp(Number(nextMax), min, max), step);
    const minV = Math.min(a, b);
    const maxV = Math.max(a, b);
    setPrice([minV, maxV]);
    if (opts?.markDirty) setPriceDirty(true);
  };

  useEffect(() => {
    // When currency/tours change, widen defaults to include all prices (unless user already adjusted).
    if (priceDirty) return;
    setPriceSafe(priceBounds.min, priceBounds.max);
    setMinText(String(priceBounds.min));
    setMaxText(String(priceBounds.max));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceBounds.min, priceBounds.max, priceDirty]);

  useEffect(() => {
    // Keep inputs in sync when slider/filters update state.
    setMinText(String(price[0]));
    setMaxText(String(price[1]));
  }, [price[0], price[1]]);

  const filtered = useMemo(() => {
    return tours.filter((tr) => {
      if (q && !`${tr.title} ${tr.location} ${tr.region}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (tr.price < price[0] || tr.price > price[1]) return false;
      if (initialGuests > 0 && tr.maxGuests < initialGuests) return false;
      // If user selected a date range, show tours that fit within it (not only exact matches).
      if (tripDays && tr.durationDays > tripDays) return false;
      if (duration.length && !duration.some((d) => durationBuckets.find((b) => b.id === d)?.match(tr.durationDays))) return false;
      if (diff.length && !diff.includes(tr.difficulty)) return false;
      if (types.length && !types.some((tt) => tr.types.includes(tt))) return false;
      return true;
    });
  }, [q, price, duration, diff, types, tours, initialGuests, tripDays]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === "price_asc") return list.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") return list.sort((a, b) => b.price - a.price);
    return list.sort((a, b) => (b.rating - a.rating) || (b.reviewCount - a.reviewCount));
  }, [filtered, sort]);

  const sortLabel = t("explore.sort");

  const homeCategories = useMemo(() => {
    const available = new Set<TourType>();
    tours.forEach((tour) => {
      tour.types.forEach((tt) => available.add(tt));
    });
    return Array.from(available).map((type) => ({
      type,
      iconSrc: typeMeta[type].iconSrc,
      labelKey: typeMeta[type].labelKey,
    }));
  }, [tours]);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(pageFromUrl, totalPages);
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [page, sorted]);

  useEffect(() => {
    if (pageFromUrl !== page) {
      const next = new URLSearchParams(params);
      next.set("page", String(page));
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageFromUrl]);

  const setPage = (nextPage: number) => {
    const safe = Math.min(Math.max(1, nextPage), totalPages);
    const next = new URLSearchParams(params);
    next.set("page", String(safe));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const next = new URLSearchParams(params);
    next.set("page", "1");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, price, duration, diff, types, sort]);

  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* SIDEBAR */}
        <aside className="hidden space-y-7 lg:block">
          <div>
            <div className="mb-3 text-sm font-semibold">{t("nav.explore")}</div>
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {homeCategories.map((c) => (
                <button
                  key={c.type}
                  type="button"
                  onClick={() => toggle(types, c.type, setTypes)}
                  className={cn(
                    "flex h-[78px] w-[78px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border bg-background px-2 py-2 text-[12px] font-semibold transition-colors",
                    "hover:bg-muted/40",
                    types.includes(c.type) ? "border-foreground ring-0" : "border-border"
                  )}
                >
                  <img src={c.iconSrc} alt="" className="h-8 w-8 object-contain opacity-90" />
                  <span className="leading-tight text-center">{t(c.labelKey as any)}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">{t("explore.priceRange")}</span>
              <span className="text-xs text-muted-foreground">{currencyLabel}</span>
            </div>
            <Slider
              min={priceBounds.min}
              max={priceBounds.max}
              step={priceBounds.step}
              value={price}
              range
              onChange={(v) => Array.isArray(v) && setPriceSafe(Number(v[0]), Number(v[1]), { markDirty: true })}
            />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border px-3 py-2">
                <div className="text-muted-foreground">Min</div>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    type="number"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    step={priceBounds.step}
                    value={minText}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMinText(v);
                      const n = Number(v);
                      if (Number.isFinite(n)) setPriceSafe(n, price[1], { markDirty: true });
                    }}
                    onBlur={() => setPriceSafe(Number(minText), price[1], { markDirty: true })}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="shrink-0 text-[11px] text-muted-foreground">{currencyLabel}</span>
                </div>
              </div>
              <div className="rounded-xl border border-border px-3 py-2">
                <div className="text-muted-foreground">Max</div>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    type="number"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    step={priceBounds.step}
                    value={maxText}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMaxText(v);
                      const n = Number(v);
                      if (Number.isFinite(n)) setPriceSafe(price[0], n, { markDirty: true });
                    }}
                    onBlur={() => setPriceSafe(price[0], Number(maxText), { markDirty: true })}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="shrink-0 text-[11px] text-muted-foreground">{currencyLabel}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold">{t("explore.duration")}</div>
            <div className="space-y-2">
              {durationBuckets.map((b) => (
                <label key={b.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox checked={duration.includes(b.id)} onChange={() => toggle(duration, b.id, setDuration)} />
                  {b.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold">{t("explore.difficulty")}</div>
            <div className="flex flex-wrap gap-2">
              {difficulties.map((d) => (
                <Button
                  key={d.id}
                  onClick={() => toggle(diff, d.id, setDiff)}
                  type={diff.includes(d.id) ? "primary" : "default"}
                  shape="round"
                  size="small"
                >
                  {t(`explore.${d.id}` as any)}
                </Button>
              ))}
            </div>
          </div>

        </aside>

        {/* RESULTS */}
        <section>
          <div className="mb-4 flex flex-col gap-3 lg:hidden">
            <div className="w-full overflow-x-auto pb-1 no-scrollbar">
              <div className="flex w-max gap-2">
                {homeCategories.map((c) => (
                  <button
                    key={c.type}
                    type="button"
                    onClick={() => toggle(types, c.type, setTypes)}
                    className={cn(
                      "flex h-[64px] w-[64px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border bg-background px-2 py-2 text-[11px] font-semibold transition-colors",
                      "hover:bg-muted/40",
                      types.includes(c.type) ? "border-foreground ring-0" : "border-border"
                    )}
                  >
                    <img src={c.iconSrc} alt="" className="h-6 w-6 object-contain opacity-90" />
                    <span className="leading-none text-center">{t(c.labelKey as any)}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button className="self-end" onClick={() => setFiltersOpen(true)}>{t("explore.filters")}</Button>
            <Drawer
              placement="bottom"
              height="85vh"
              open={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              title={t("explore.filters")}
              styles={{ body: { paddingBottom: 96 } }}
            >
              <div className="space-y-7">
                  <div>
                    <div className="mb-3 text-sm font-semibold">{t("nav.explore")}</div>
                    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                      {homeCategories.map((c) => (
                        <button
                          key={c.type}
                          type="button"
                          onClick={() => toggle(types, c.type, setTypes)}
                          className={cn(
                            "flex h-[78px] w-[78px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border bg-background px-2 py-2 text-[12px] font-semibold transition-colors",
                            "hover:bg-muted/40",
                            types.includes(c.type) ? "border-foreground ring-0" : "border-border"
                          )}
                        >
                          <img src={c.iconSrc} alt="" className="h-8 w-8 object-contain opacity-90" />
                          <span className="leading-tight text-center">{t(c.labelKey as any)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold">{t("explore.priceRange")}</span>
                      <span className="text-xs text-muted-foreground">{currencyLabel}</span>
                    </div>
                    <Slider
                      range
                      min={priceBounds.min}
                      max={priceBounds.max}
                      step={priceBounds.step}
                      value={price}
                      onChange={(v) => Array.isArray(v) && setPriceSafe(Number(v[0]), Number(v[1]), { markDirty: true })}
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-border px-3 py-2">
                        <div className="text-muted-foreground">Min</div>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            inputMode="numeric"
                            type="number"
                            min={priceBounds.min}
                            max={priceBounds.max}
                            step={priceBounds.step}
                            value={minText}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMinText(v);
                              const n = Number(v);
                              if (Number.isFinite(n)) setPriceSafe(n, price[1], { markDirty: true });
                            }}
                            onBlur={() => setPriceSafe(Number(minText), price[1], { markDirty: true })}
                            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <span className="shrink-0 text-[11px] text-muted-foreground">{currencyLabel}</span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-border px-3 py-2">
                        <div className="text-muted-foreground">Max</div>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            inputMode="numeric"
                            type="number"
                            min={priceBounds.min}
                            max={priceBounds.max}
                            step={priceBounds.step}
                            value={maxText}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMaxText(v);
                              const n = Number(v);
                              if (Number.isFinite(n)) setPriceSafe(price[0], n, { markDirty: true });
                            }}
                            onBlur={() => setPriceSafe(price[0], Number(maxText), { markDirty: true })}
                            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <span className="shrink-0 text-[11px] text-muted-foreground">{currencyLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 text-sm font-semibold">{t("explore.duration")}</div>
                    <div className="space-y-2">
                      {durationBuckets.map((b) => (
                        <label key={b.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                          <Checkbox
                            checked={duration.includes(b.id)}
                            onChange={() => toggle(duration, b.id, setDuration)}
                          />
                          {b.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 text-sm font-semibold">{t("explore.difficulty")}</div>
                    <div className="flex flex-wrap gap-2">
                      {difficulties.map((d) => (
                        <Button
                          key={d.id}
                          onClick={() => toggle(diff, d.id, setDiff)}
                          type={diff.includes(d.id) ? "primary" : "default"}
                          shape="round"
                          size="small"
                        >
                          {t(`explore.${d.id}` as any)}
                        </Button>
                      ))}
                    </div>
                  </div>

                </div>

              <div className="fixed bottom-0 left-0 right-0 border-t bg-background/90 p-4 backdrop-blur">
                <div className="container-page">
                  <Button block type="primary" size="large" onClick={() => setFiltersOpen(false)}>
                    {t("explore.applyFilters")}
                  </Button>
                </div>
              </div>
            </Drawer>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t("explore.title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("explore.count", { n: filtered.length })}</p>
            </div>
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="w-full sm:w-72">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("explore.searchP")}
                  prefix={<Search className="h-4 w-4 text-muted-foreground" />}
                  allowClear
                />
              </div>
              <Button
                className="w-full sm:w-auto"
                onClick={() =>
                  setSort((s) => (s === "popular" ? "price_asc" : s === "price_asc" ? "price_desc" : "popular"))
                }
              >
                {sortLabel}
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <TourCardSkeleton key={`tour-skeleton-${i}`} />)
            ) : isError ? (
              <div className="col-span-full rounded-3xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                Failed to load tours. Check backend.
              </div>
            ) : paged.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-border py-14">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t("explore.noResults")}
                />
              </div>
            ) : (
              paged.map((tour) => <TourCard key={tour.id} tour={tour} />)
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 overflow-x-auto pb-1">
              <AntPagination
                current={page}
                total={sorted.length}
                pageSize={PAGE_SIZE}
                showSizeChanger={false}
                onChange={(p) => setPage(p)}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Explore;


