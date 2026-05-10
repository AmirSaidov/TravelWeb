import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Leaf } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { TourCard } from "@/components/ui-bits/TourCard";
import { useQuery } from "@tanstack/react-query";
import { toursApi } from "@/lib/api";
import type { Difficulty, TourType } from "@/types";
import { Button, Checkbox, Drawer, Empty, Input, Pagination as AntPagination, Slider } from "antd";
import { cn } from "@/lib/utils";

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
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const initialCat = (params.get("cat") || "") as TourType | "";
  const initialWhere = (params.get("where") || "").trim();
  const initialGuests = Number(params.get("guests") || 0) || 0;
  const from = params.get("from");
  const to = params.get("to");
  const tripDays =
    from && to ? Math.max(1, differenceInCalendarDays(parseISO(to), parseISO(from)) + 1) : null;
  const [price, setPrice] = useState<[number, number]>([50, 1200]);
  const [duration, setDuration] = useState<string[]>(["4-7"]);
  const [diff, setDiff] = useState<Difficulty[]>(["moderate"]);
  const [types, setTypes] = useState<TourType[]>(initialCat ? [initialCat] : []);
  const [q, setQ] = useState(initialWhere);
  const [sort, setSort] = useState<"popular" | "price_asc" | "price_desc">("popular");
  const pageFromUrl = Math.max(1, Number(params.get("page") || 1) || 1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: tours = [], isLoading, isError } = useQuery({
    queryKey: ["tours"],
    queryFn: () => toursApi.getTours(),
  });

  const filtered = useMemo(() => {
    return tours.filter((tr) => {
      if (q && !`${tr.title} ${tr.location} ${tr.region}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (tr.price < price[0] || tr.price > price[1]) return false;
      if (initialGuests > 0 && tr.maxGuests < initialGuests) return false;
      if (tripDays && tr.durationDays !== tripDays) return false;
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
              <span className="text-xs text-muted-foreground">USD</span>
            </div>
            <Slider
              min={50}
              max={1500}
              step={10}
              value={price}
              range
              onChange={(v) => Array.isArray(v) && setPrice([Number(v[0]), Number(v[1])] as [number, number])}
            />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border px-3 py-2">
                <div className="text-muted-foreground">Min</div>
                <div className="font-semibold">${price[0]}</div>
              </div>
              <div className="rounded-xl border border-border px-3 py-2">
                <div className="text-muted-foreground">Max</div>
                <div className="font-semibold">${price[1]}{price[1] >= 1500 ? "+" : ""}</div>
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

          <div className="rounded-2xl bg-brand-soft p-4">
            <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground"><Leaf className="h-4 w-4" /></div>
            <div className="font-display text-base font-semibold">{t("explore.sustainable")}</div>
            <p className="mt-1 text-xs text-accent-foreground/80">{t("explore.sustainableText")}</p>
            <Link to="#" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
              {t("explore.learnMore")} →
            </Link>
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
                      <span className="text-xs text-muted-foreground">USD</span>
                    </div>
                    <Slider
                      range
                      min={50}
                      max={1500}
                      step={10}
                      value={price}
                      onChange={(v) => Array.isArray(v) && setPrice([Number(v[0]), Number(v[1])] as [number, number])}
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-border px-3 py-2">
                        <div className="text-muted-foreground">Min</div>
                        <div className="font-semibold">${price[0]}</div>
                      </div>
                      <div className="rounded-xl border border-border px-3 py-2">
                        <div className="text-muted-foreground">Max</div>
                        <div className="font-semibold">
                          ${price[1]}
                          {price[1] >= 1500 ? "+" : ""}
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

                  <div className="rounded-2xl bg-brand-soft p-4">
                    <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground">
                      <Leaf className="h-4 w-4" />
                    </div>
                    <div className="font-display text-base font-semibold">{t("explore.sustainable")}</div>
                    <p className="mt-1 text-xs text-accent-foreground/80">{t("explore.sustainableText")}</p>
                    <Link to="#" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                      {t("explore.learnMore")} →
                    </Link>
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
              <div className="col-span-full rounded-3xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                Loading tours…
              </div>
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


