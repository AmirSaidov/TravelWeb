"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { staysApi } from "@/lib/api";
import { StayCard, StayCardSkeleton, type Stay } from "@/components/ui-bits/StayCard";
import { Button, Checkbox, Drawer, Empty, Input, Pagination as AntPagination, Slider } from "antd";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";



const DEFAULT_PRICE_MIN = 0;
const DEFAULT_PRICE_MAX = 500;
const DEFAULT_PRICE_STEP = 10;
const PAGE_SIZE = 20;





const Stays = () => {
  const { t, i18n } = useTranslation();
  
  const stayTypes = [
    { id: "hotel", label: t("staysPage.hotel") },
    { id: "yurt", label: t("staysPage.yurtCamp") },
    { id: "guesthouse", label: t("staysPage.guesthouse") },
    { id: "apartment", label: t("staysPage.apartment") },
  ];

  const amenitiesList = [
    { id: "wifi", label: t("staysPage.wifi") },
    { id: "parking", label: t("staysPage.parking") },
    { id: "breakfast", label: t("staysPage.breakfastIncluded") },
    { id: "kitchen", label: t("staysPage.kitchen") },
    { id: "ac", label: t("staysPage.airConditioning") },
  ];

  const currency = useAppStore((s) => s.currency);
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const setParams = (next: URLSearchParams, opts?: { replace?: boolean }) => {
    const qs = next.toString();
    const url = qs ? `/stays?${qs}` : "/stays";
    if (opts?.replace) router.replace(url);
    else router.push(url);
  };

  const initialWhere = (params.get("where") || "").trim();
  const initialGuests = Number(params.get("guests") || 0) || 0;

  const [price, setPrice] = useState<[number, number]>([DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX]);
  const [minText, setMinText] = useState(() => String(DEFAULT_PRICE_MIN));
  const [maxText, setMaxText] = useState(() => String(DEFAULT_PRICE_MAX));
  const [types, setTypes] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [q, setQ] = useState(initialWhere);
  const [sort, setSort] = useState<"popular" | "price_asc" | "price_desc">("popular");
  const pageFromUrl = Math.max(1, Number(params.get("page") || 1) || 1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const currencyLabel = String(currency || "USD").toUpperCase();

  const { data: serverStays = [], isLoading } = useQuery({
    queryKey: ["stays", currency],
    queryFn: () => staysApi.getStays(currency),
  });

  const priceBounds = useMemo(() => {
    if (!serverStays.length) return [DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX] as [number, number];
    const prices = serverStays
      .map((stay) => Number(stay.pricePerNight))
      .filter((value) => Number.isFinite(value));
    if (!prices.length) return [DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX] as [number, number];
    const min = Math.max(DEFAULT_PRICE_MIN, Math.floor(Math.min(...prices) / DEFAULT_PRICE_STEP) * DEFAULT_PRICE_STEP);
    const max = Math.max(
      DEFAULT_PRICE_MAX,
      Math.ceil(Math.max(...prices) / DEFAULT_PRICE_STEP) * DEFAULT_PRICE_STEP
    );
    return [min, max] as [number, number];
  }, [serverStays]);

  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
  const snap = (n: number, step: number) => Math.round(n / step) * step;
  const setPriceSafe = (nextMin: number, nextMax: number) => {
    const [min, max] = priceBounds;
    const step = DEFAULT_PRICE_STEP;
    const a = snap(clamp(Number(nextMin), min, max), step);
    const b = snap(clamp(Number(nextMax), min, max), step);
    const minV = Math.min(a, b);
    const maxV = Math.max(a, b);
    setPrice([minV, maxV]);
  };

  useEffect(() => {
    setPrice(priceBounds);
  }, [priceBounds]);

  useEffect(() => {
    setMinText(String(price[0]));
    setMaxText(String(price[1]));
  }, [price]);

  const filtered = useMemo(() => {
    return serverStays.filter((stay) => {
      if (q && !`${stay.title} ${stay.location} ${stay.region}`.toLowerCase().includes(q.toLowerCase())) return false;
      const stayPrice = Number(stay.pricePerNight);
      if (stayPrice < price[0] || stayPrice > price[1]) return false;
      if (initialGuests > 0 && stay.maxGuests < initialGuests) return false;
      if (types.length && !types.includes(stay.type)) return false;
      if (amenities.length && !amenities.every(a => stay.amenities.includes(a))) return false;
      return true;
    });
  }, [serverStays, q, price, types, amenities, initialGuests]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === "price_asc") return list.sort((a, b) => a.pricePerNight - b.pricePerNight);
    if (sort === "price_desc") return list.sort((a, b) => b.pricePerNight - a.pricePerNight);
    return list.sort((a, b) => (b.rating - a.rating) || (b.reviewCount - a.reviewCount));
  }, [filtered, sort]);

  const sortLabel = t("explore.sort") || "Sort: Popular";

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(pageFromUrl, totalPages);
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [page, sorted]);

  const setPage = (nextPage: number) => {
    const safe = Math.min(Math.max(1, nextPage), totalPages);
    const next = new URLSearchParams(params);
    next.set("page", String(safe));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* SIDEBAR */}
        <aside className="hidden space-y-7 lg:block">
          <div>
            <div className="mb-3 text-sm font-semibold">Accommodation Type</div>
            <div className="space-y-2">
              {stayTypes.map((st) => (
                <label key={st.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox checked={types.includes(st.id)} onChange={() => toggle(types, st.id, setTypes)} />
                  {st.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Price per night</span>
              <span className="text-xs text-muted-foreground">{currencyLabel}</span>
            </div>
            <Slider
              min={DEFAULT_PRICE_MIN}
              max={DEFAULT_PRICE_MAX}
              step={DEFAULT_PRICE_STEP}
              value={price}
              range
              onChange={(v) => Array.isArray(v) && setPriceSafe(Number(v[0]), Number(v[1]))}
            />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border px-3 py-2">
                <div className="text-muted-foreground">Min</div>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    type="number"
                    value={minText}
                    onChange={(e) => { setMinText(e.target.value); const n = Number(e.target.value); if (Number.isFinite(n)) setPriceSafe(n, price[1]); }}
                    onBlur={() => setPriceSafe(Number(minText), price[1])}
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
                    value={maxText}
                    onChange={(e) => { setMaxText(e.target.value); const n = Number(e.target.value); if (Number.isFinite(n)) setPriceSafe(price[0], n); }}
                    onBlur={() => setPriceSafe(price[0], Number(maxText))}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="shrink-0 text-[11px] text-muted-foreground">{currencyLabel}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold">Amenities</div>
            <div className="space-y-2">
              {amenitiesList.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox checked={amenities.includes(a.id)} onChange={() => toggle(amenities, a.id, setAmenities)} />
                  {a.label}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* RESULTS */}
        <section>
          <div className="mb-4 flex flex-col gap-3 lg:hidden">
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
                    <div className="mb-3 text-sm font-semibold">Accommodation Type</div>
                    <div className="space-y-2">
                      {stayTypes.map((st) => (
                        <label key={st.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                          <Checkbox checked={types.includes(st.id)} onChange={() => toggle(types, st.id, setTypes)} />
                          {st.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold">Price per night</span>
                      <span className="text-xs text-muted-foreground">{currencyLabel}</span>
                    </div>
                    <Slider
                      range
                      min={DEFAULT_PRICE_MIN}
                      max={DEFAULT_PRICE_MAX}
                      step={DEFAULT_PRICE_STEP}
                      value={price}
                      onChange={(v) => Array.isArray(v) && setPriceSafe(Number(v[0]), Number(v[1]))}
                    />
                  </div>

                  <div>
                    <div className="mb-3 text-sm font-semibold">Amenities</div>
                    <div className="space-y-2">
                      {amenitiesList.map((a) => (
                        <label key={a.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                          <Checkbox checked={amenities.includes(a.id)} onChange={() => toggle(amenities, a.id, setAmenities)} />
                          {a.label}
                        </label>
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
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">Stays in Kyrgyzstan</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("staysPage.count", { n: filtered.length })}</p>
            </div>
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="w-full sm:w-72">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search hotels, yurts..."
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
              Array.from({ length: 6 }).map((_, i) => <StayCardSkeleton key={`stay-skeleton-${i}`} />)
            ) : paged.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-border py-14">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t("explore.noResults") || "No stays found"}
                />
              </div>
            ) : (
              paged.map((stay) => <StayCard key={stay.id} stay={stay} />)
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

export default Stays;
