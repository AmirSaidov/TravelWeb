"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronRight, Search, Star } from "lucide-react";
import { addDays, format, nextFriday } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

import { useQuery } from "@tanstack/react-query";
import { toursApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/app";
import { formatMoney } from "@/lib/currency";

const Home = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const currentLang = i18n.language;
  const currency = useAppStore((s) => s.currency);

  const [activeSearchTab, setActiveSearchTab] = useState<"where" | "when" | "who" | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [where, setWhere] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [dateMode, setDateMode] = useState<"dates" | "flexible">("dates");
  const [guests, setGuests] = useState({ adults: 0, children: 0, infants: 0, pets: 0 });

  const unsplash = (photoId: string, w: number, q = 60) =>
    `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&q=${q}`;
  const unsplashSrcSet = (photoId: string) =>
    [640, 960, 1280, 1600, 2000].map((w) => `${unsplash(photoId, w)} ${w}w`).join(", ");

  const heroImages = useMemo(
    () => [
      { id: "photo-1506905925346-21bda4d32df4", alt: "" },
      { id: "photo-1482192505345-5655af888cc4", alt: "" },
      { id: "photo-1443890923422-7819ed4101c0", alt: "" },
    ],
    []
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    // Preload the next hero image to avoid janky transitions.
    const next = heroImages[(heroIndex + 1) % heroImages.length];
    const img = new window.Image();
    img.decoding = "async";
    img.src = unsplash(next.id, 2000);
  }, [heroImages, heroIndex]);

  const recommendedPlaces = useMemo(
    () => [
      { city: "Issyk-Kul, Karakol", sub: "Ski base & trekking", iconSrc: "/icons/rec-karakol.png", scale: 2.2 },
      { city: "Naryn, Song-Kul", sub: "High-altitude lake & yurts", iconSrc: "/icons/rec-sonkol.png", scale: 2.2 },
      { city: "Chui, Ala-Archa", sub: "National park near Bishkek", iconSrc: "/icons/rec-alaarcha.png", scale: 1.8 },
      { city: "Jalal-Abad, Arslanbob", sub: "Walnut forests & waterfalls", iconSrc: "/icons/rec-arslanbob.png", scale: 1.8 },
      { city: "Osh, Osh", sub: "Sulaiman-Too & bazaar vibe", iconSrc: "/icons/rec-osh.png", scale: 1.8 },
      { city: "Naryn, Kol-Suu", sub: "Turquoise lake in cliffs", iconSrc: "/icons/rec-kolsuu.png", scale: 1.8 },
    ],
    []
  );

  const { data: tours = [], isLoading: toursLoading } = useQuery({
    queryKey: ["tours", currency, currentLang],
    queryFn: () => toursApi.getTours(currency),
  });

  const peopleTotal = guests.adults + guests.children;
  const guestTotal = peopleTotal + guests.infants + guests.pets;
  const popular = useMemo(() => tours.slice(0, 3), [tours]);
  const curated = useMemo(() => tours.slice(0, 4), [tours]);

  const datesLabel = (() => {
    const from = dateRange.from ? format(dateRange.from, "MMM d") : null;
    const to = dateRange.to ? format(dateRange.to, "MMM d") : null;
    if (from && to) return `${from} — ${to}`;
    if (from) return from;
    return t("search.addDates");
  })();

  const onSearch = () => {
    const qp = new URLSearchParams();
    if (where.trim()) qp.set("where", where.trim());
    if (dateRange.from) qp.set("from", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange.to) qp.set("to", format(dateRange.to, "yyyy-MM-dd"));
    if (peopleTotal > 0) qp.set("guests", String(peopleTotal));
    router.push(`/explore${qp.toString() ? `?${qp.toString()}` : ""}`);
  };

  const setFlexiblePreset = (preset: "weekend" | "7" | "14" | "30") => {
    const start = nextFriday(new Date());
    const days = preset === "weekend" ? 2 : preset === "7" ? 7 : preset === "14" ? 14 : 30;
    setDateRange({ from: start, to: addDays(start, days) });
  };

  return (
    <>
      {/* HERO */}
      <section className="relative h-[380px] overflow-hidden">
        <div className="absolute inset-0 overflow-hidden bg-black">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={heroImages[heroIndex].id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 1.05, ease: [0.22, 0.72, 0, 1] }}
            >
              <Image
                src={unsplash(heroImages[heroIndex].id, 2000)}
                alt={heroImages[heroIndex].alt}
                fill
                sizes="100vw"
                priority={heroIndex === 0}
                quality={70}
                className="select-none object-cover"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 gradient-hero-overlay" />
        </div>

        <div className="container-page relative pt-14 text-white sm:pt-20">
          {/* Floating Search Bar */}
          <div className="mx-auto w-full max-w-5xl">
            {activeSearchTab && (
              <div className="fixed inset-0 z-20" onClick={() => setActiveSearchTab(null)} />
            )}

            <div className="relative z-30 flex flex-col gap-2 overflow-visible rounded-3xl bg-surface p-2 text-foreground shadow-elevated ring-1 ring-border/60 md:flex-row md:items-center md:gap-0 md:divide-x md:divide-border/80 md:overflow-hidden md:rounded-[999px]">
              {/* WHERE */}
              <Popover open={activeSearchTab === "where"} onOpenChange={(open) => setActiveSearchTab(open ? "where" : null)}>
                <div className="relative z-10 flex w-full md:w-auto md:flex-[1.5]">
                  <PopoverTrigger asChild>
                    <button className="group relative w-full cursor-pointer mr-4 rounded-full px-6 py-3 text-left transition-all hover:bg-muted/40 sm:px-8">
                      {activeSearchTab === "where" && (
                        <motion.div
                          layoutId="active-search-tab"
                          className="absolute inset-0 rounded-full bg-muted/60 shadow-sm"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className="relative z-10">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
                          {t("search.where")}
                        </div>
                        <input
                          value={where}
                          onChange={(e) => setWhere(e.target.value)}
                          placeholder={t("search.whereP")}
                          className="mt-0.5 w-full bg-transparent text-[15px] font-medium text-muted-foreground outline-none placeholder:text-muted-foreground/70 group-hover:text-foreground"
                        />
                      </div>
                    </button>
                  </PopoverTrigger>
                </div>
                <PopoverContent side="bottom" sideOffset={18} align="start" className="z-[80] w-[420px] rounded-3xl p-6 shadow-2xl">
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {t("search.recommended")}
                      </h4>
                      <div className="grid grid-cols-1 gap-1.5">
                        {recommendedPlaces.map((item) => (
                          <button
                            key={item.city}
                            className="group flex w-full items-center gap-4 rounded-2xl p-3 transition-all hover:bg-muted/60"
                            onClick={() => {
                              setWhere(item.city);
                              setActiveSearchTab(null);
                            }}
                          >
                            <Image
                              src={item.iconSrc}
                              alt=""
                              width={48}
                              height={48}
                              className="h-12 w-12 shrink-0 object-contain transition-transform duration-300 group-hover:scale-110"
                              style={{ transform: `scale(${item.scale})` }}
                            />
                            <div className="text-left">
                              <div className="text-sm font-bold">{item.city}</div>
                              <div className="text-xs text-muted-foreground">{item.sub}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* DATES */}
              <Popover open={activeSearchTab === "when"} onOpenChange={(open) => setActiveSearchTab(open ? "when" : null)}>
                <div className="relative z-10 flex w-full md:w-auto md:flex-1">
                  <PopoverTrigger asChild>
                    <button className="group relative w-full cursor-pointer rounded-full px-6 py-3 text-left transition-all hover:bg-black/5 sm:px-8">
                      {activeSearchTab === "when" && (
                        <motion.div
                          layoutId="active-search-tab"
                          className="absolute inset-0 rounded-full bg-black/5 shadow-sm"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className="relative z-10">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
                          {t("search.datesTab")}
                        </div>
                        <div className="mt-0.5 text-[15px] font-medium text-muted-foreground group-hover:text-foreground">
                          {datesLabel}
                        </div>
                      </div>
                    </button>
                  </PopoverTrigger>
                </div>
                <PopoverContent
                  side="bottom"
                  sideOffset={20}
                  align="center"
                  className="z-[80] w-[min(64rem,calc(100vw-2rem))] max-w-5xl rounded-3xl p-8 shadow-2xl"
                >
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDateMode("dates")}
                        className={`rounded-full px-6 py-2 text-sm font-semibold shadow-sm transition-colors ${
                          dateMode === "dates" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        {t("search.datesTab")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateMode("flexible")}
                        className={`rounded-full px-6 py-2 text-sm font-semibold shadow-sm transition-colors ${
                          dateMode === "flexible" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        {t("search.flexibleTab")}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 rounded-full px-4 text-xs"
                        onClick={() => setDateRange({})}
                      >
                        {t("search.clear")}
                      </Button>
                      <Button type="button" className="h-9 rounded-full px-4 text-xs" onClick={() => setActiveSearchTab(null)}>
                        {t("search.apply")}
                      </Button>
                    </div>
                  </div>

                  {dateMode === "dates" ? (
                    <div className="w-full">
                      <Calendar
                        mode="range"
                        numberOfMonths={2}
                        selected={dateRange as any}
                        onSelect={(range: any) => setDateRange(range ?? {})}
                        className="w-full border-none p-0"
                        classNames={{
                          months: "flex w-full flex-col gap-6 md:flex-row md:justify-between md:gap-10",
                          month: "w-full space-y-4",
                          caption_label: "text-base font-semibold",
                          nav_button: "h-9 w-9",
                          head_cell: "w-10 text-[0.85rem]",
                          cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-xl [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-xl last:[&:has([aria-selected])]:rounded-r-xl focus-within:relative focus-within:z-20",
                          day: "h-10 w-10 rounded-xl p-0 text-sm font-medium aria-selected:opacity-100",
                          day_selected: "bg-foreground text-background hover:bg-foreground hover:text-background focus:bg-foreground focus:text-background",
                          day_range_middle: "aria-selected:bg-muted aria-selected:text-foreground",
                        }}
                        components={{
                          IconLeft: () => <span className="inline-flex h-5 w-5 items-center justify-center">‹</span>,
                          IconRight: () => <span className="inline-flex h-5 w-5 items-center justify-center">›</span>,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { id: "weekend" as const, title: t("search.nextWeekend"), sub: t("search.presetWeekendSub") },
                        { id: "7" as const, title: t("search.preset7"), sub: t("search.preset7Sub") },
                        { id: "14" as const, title: t("search.preset14"), sub: t("search.preset14Sub") },
                        { id: "30" as const, title: t("search.preset30"), sub: t("search.preset30Sub") },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFlexiblePreset(p.id)}
                          className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40"
                        >
                          <div className="text-sm font-semibold">{p.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{p.sub}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* WHO */}
              <Popover open={activeSearchTab === "who"} onOpenChange={(open) => setActiveSearchTab(open ? "who" : null)}>
                <div className="relative z-10 flex w-full md:w-auto md:flex-1">
                  <PopoverTrigger asChild>
                    <button className="group relative w-full cursor-pointer rounded-full px-6 py-3 text-left transition-all hover:bg-muted/40 sm:px-8">
                      {activeSearchTab === "who" && (
                        <motion.div
                          layoutId="active-search-tab"
                          className="absolute inset-0 rounded-full bg-muted/60 shadow-sm"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className="relative z-10">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
                          {t("search.guests")}
                        </div>
                        <div className="mt-0.5 truncate text-[15px] font-medium text-muted-foreground/80 group-hover:text-foreground">
                          {peopleTotal > 0 ? t("search.guestsCount", { n: peopleTotal }) : t("search.addGuests")}
                        </div>
                      </div>
                    </button>
                  </PopoverTrigger>
                </div>
                <PopoverContent side="bottom" sideOffset={20} align="end" className="z-[80] w-[420px] rounded-3xl p-6 shadow-2xl">
                  <div className="space-y-6">
                    {[
                      { id: "adults", label: t("search.adults"), sub: t("search.adultsSub") },
                      { id: "children", label: t("search.children"), sub: t("search.childrenSub") },
                      { id: "infants", label: t("search.infants"), sub: t("search.infantsSub") },
                      { id: "pets", label: t("search.pets"), sub: t("search.petsSub") },
                    ].map((item) => {
                      const count = guests[item.id as keyof typeof guests];
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
                        >
                          <div>
                            <div className="text-[15px] font-semibold">{item.label}</div>
                            <div className="text-sm text-muted-foreground">{item.sub}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                setGuests((prev) => ({
                                  ...prev,
                                  [item.id]: Math.max(0, prev[item.id as keyof typeof guests] - 1),
                                }))
                              }
                              disabled={count === 0}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-lg transition-colors hover:border-foreground disabled:border-muted-foreground/30 disabled:text-muted-foreground/30 disabled:hover:border-muted-foreground/30 cursor-pointer disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <span className="w-4 text-center text-sm font-medium">{count}</span>
                            <button
                              onClick={() =>
                                setGuests((prev) => ({
                                  ...prev,
                                  [item.id]: prev[item.id as keyof typeof guests] + 1,
                                }))
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-lg transition-colors hover:border-foreground"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              <button
                onClick={onSearch}
                className="group z-10 flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-elevated active:scale-95 md:mx-2 md:w-14 md:rounded-full md:px-0"
              >
                <Search className="h-6 w-6 stroke-[2.5px] transition-transform duration-300 group-hover:scale-110" />
                <span className="sr-only">{t("search.search")}</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* POPULAR DESTINATIONS */}
      <section className="container-page py-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("home.popularTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Explore the hidden gems of Central Asia</p>
          </div>
          <button
            onClick={() => router.push("/explore")}
            className="hidden items-center gap-1 border-b border-foreground/70 pb-1 text-xs font-semibold text-foreground transition-colors hover:border-foreground md:flex"
          >
            {t("home.viewAll")} <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Important: avoid fixed heights on small screens so cards never overflow/overlap next sections */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:h-[600px] md:grid-cols-12">
          {toursLoading ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-card shadow-elevated ring-1 ring-black/10 md:col-span-8 md:aspect-auto md:h-full">
              <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <Skeleton className="h-6 w-28 rounded-full bg-white/30" />
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-7 w-3/5 bg-white/30" />
                  <Skeleton className="h-4 w-2/5 bg-white/20" />
                </div>
              </div>
            </div>
          ) : (
            <a
              href={popular[0] ? `/tour/${popular[0].slug}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-elevated ring-1 ring-black/10 md:col-span-8 md:aspect-auto md:h-full"
            >
              <img
                src={popular[0]?.hero}
                alt={popular[0]?.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0)_35%,rgba(0,0,0,0)_60%,rgba(0,0,0,0.55)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-left text-white">
                <span className="inline-flex w-fit rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-primary shadow-sm backdrop-blur">
                  Most visited
                </span>
                <div className="mt-3">
                  <div className="font-display text-2xl font-semibold">{popular[0]?.title}</div>
                  <div className="text-sm text-white/85">{popular[0]?.region}</div>
                </div>
              </div>
            </a>
          )}

          <div className="grid gap-6 md:col-span-4 md:grid-rows-2 md:h-full">
            {toursLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={`popular-skeleton-${i}`}
                    className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-card shadow-elevated ring-1 ring-black/10 md:aspect-auto md:h-full"
                  >
                    <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <Skeleton className="h-6 w-3/5 bg-white/30" />
                      <Skeleton className="mt-2 h-4 w-2/5 bg-white/20" />
                    </div>
                  </div>
                ))
              : [popular[1], popular[2]].filter(Boolean).map((p) => (
                  <a
                    key={p.id}
                    href={`/tour/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-[16/9] overflow-hidden rounded-2xl shadow-elevated ring-1 ring-black/10 md:aspect-auto md:h-full"
                  >
                    <Image src={p.hero} alt={p.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0)_40%,rgba(0,0,0,0.6)_100%)]" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-left text-white">
                      <div className="font-display text-xl font-semibold">{p.title}</div>
                      <div className="text-xs text-white/85">{p.location}</div>
                    </div>
                  </a>
                ))}
          </div>
        </div>
      </section>

      {/* CURATED EXPERIENCES */}
      <section className="container-page py-10">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Curated Kyrgyz Experiences</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {toursLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={`curated-skeleton-${i}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-card ring-1 ring-black/10">
                    <Skeleton className="h-full w-full rounded-none" />
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-3 w-2/5" />
                    </div>
                    <Skeleton className="h-4 w-10 rounded-full" />
                  </div>
                  <div className="mt-2">
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              ))
            : curated.map((tr) => (
                <Link key={tr.id} href={`/tour/${tr.slug}`} target="_blank" rel="noopener noreferrer" className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-card ring-1 ring-black/10">
                    <Image src={tr.hero} alt={tr.title} width={800} height={600} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{tr.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{tr.region}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-xs text-foreground">
                      <Star className="h-4 w-4 fill-foreground" />
                      <span className="font-medium">{tr.rating.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-foreground">
                    {formatMoney(tr.price, tr.currency)} <span className="text-xs font-normal text-muted-foreground">/ person</span>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-24 pt-6">
          <div className="relative overflow-hidden rounded-[2rem] bg-black p-10 shadow-elevated ring-1 ring-black/10 sm:p-14">
            <Image
              alt="Share your Kyrgyzstan"
              src={unsplash("photo-1482192505345-5655af888cc4", 2000)}
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              quality={70}
              className="object-cover opacity-90"
            />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative z-10 max-w-md text-white">
            <h2 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Share your Kyrgyzstan</h2>
            <p className="mt-4 text-sm text-white/85 sm:text-base">
              Earn extra income and meet people from all over the world by guiding travelers on unforgettable tours.
            </p>
            <Button type="button" className="mt-6 h-11 rounded-xl bg-white px-6 font-semibold text-foreground hover:bg-white/95">
              Learn more
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
