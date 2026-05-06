import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, House, ConciergeBell, Compass, Landmark, Mountain, Tent, Leaf, Waves } from "lucide-react";
import { TourCard } from "@/components/ui-bits/TourCard";
import { tours } from "@/mocks/data";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AnimatePresence, motion } from "framer-motion";

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "yurts" | "tours">("all");
  const [activeSearchTab, setActiveSearchTab] = useState<string | null>(null);
  const [guests, setGuests] = useState({ adults: 0, children: 0, infants: 0, pets: 0 });
  const [heroIndex, setHeroIndex] = useState(0);

  const heroImages = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80",
    "https://cdn-kz.kursiv.media/wp-content/uploads/2025/05/gora-sulajman-too_foto_oshcity.gov_.kg_.jpg",
    "https://avatars.mds.yandex.net/get-altay/15344725/2a0000019abff5dcbf93a1549315e6188894/orig",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=80",
    "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=2400&q=80",
    "https://images.unsplash.com/photo-1443890923422-7819ed4101c0?auto=format&fit=crop&w=2400&q=80",
    "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=2400&q=80",
  ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  const categories = [
    { iconSrc: "/icons/hiking.png", label: t("categories.hiking"), sub: "Трекинг и хайкинг", q: "trekking" },
    { iconSrc: "/icons/horse.png", label: t("categories.horse"), sub: "Конные туры", q: "horseback" },
    { iconSrc: "/icons/cultural.png", label: t("categories.cultural"), sub: "История и традиции", q: "cultural" },
    { iconSrc: "/icons/eco.png", label: t("categories.eco"), sub: "Природа и экотуры", q: "eco" },
    { iconSrc: "/icons/yurts.png", label: t("categories.yurts"), sub: "Проживание в юртах", q: "yurts" },
    { iconSrc: "/icons/lakes.png", label: t("categories.lakes"), sub: "Озёра и водопады", q: "Issyk-Kul" },
  ];

  const Divider = () => <div className="hidden h-8 w-[1px] bg-border md:block" />;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden bg-black">
          <AnimatePresence mode="sync" initial={false}>
            <motion.img
              key={heroImages[heroIndex]}
              src={heroImages[heroIndex]}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ x: "100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 gradient-hero-overlay" />
        </div>
        <div className="container-page relative pb-24 pt-16 text-white sm:pb-32 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md ring-1 ring-white/25">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {t("hero.pill")}
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] sm:text-6xl md:text-7xl text-balance">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/85 sm:text-lg">
              {t("hero.subtitle")}
            </p>
          </div>

          {/* Tabs */}
          <div className="mx-auto mt-10 flex w-fit overflow-hidden rounded-2xl bg-white/10 p-1 backdrop-blur-md ring-1 ring-white/20">
            {([
              ["all", t("search.allStays")],
              ["yurts", t("search.yurts")],
              ["tours", t("search.tours")],
            ] as const).map(([key, label]) => (
              <Button
                key={key}
                variant="ghost"
                onClick={() => setTab(key)}
                className={`relative rounded-xl px-5 py-2 text-sm font-medium transition-colors ${tab === key ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-white/85 hover:text-white"}`}
              >
                <span className="flex items-center gap-2">
                  {key === "all" ? <House className="h-4 w-4" /> : key === "yurts" ? <Compass className="h-4 w-4" /> : <ConciergeBell className="h-4 w-4" />}
                  {label}
                </span>
                {(key === "yurts" || key === "tours") && (
                  <span className="absolute -top-2 right-1 rounded-full bg-[#1f2d4f] px-1.5 py-[2px] text-[9px] font-semibold uppercase tracking-wide text-white">
                    новое
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Search bar */}
          <div className="mx-auto mt-8 w-full max-w-5xl relative">
            {/* Click outside overlay */}
            {activeSearchTab && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setActiveSearchTab(null)}
              />
            )}
            
            <div className="relative z-50 flex flex-col gap-2 rounded-[2rem] bg-white p-2 text-foreground shadow-elevated ring-1 ring-black/5 md:flex-row md:items-center md:gap-0 md:rounded-full">
              
              {/* WHERE */}
              <Popover open={activeSearchTab === "where"} onOpenChange={(open) => setActiveSearchTab(open ? "where" : null)}>
                <div className="relative z-10 flex w-full md:w-auto md:flex-[1.5]">
                  <PopoverTrigger asChild>
                    <button className="group relative w-full cursor-pointer rounded-full px-5 py-3 text-left transition-all hover:bg-muted/30 sm:px-8">
                      {activeSearchTab === "where" && (
                        <motion.div
                          layoutId="active-search-tab"
                          className="absolute inset-0 rounded-full bg-muted/60 shadow-sm"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className="relative z-10">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">Где</div>
                        <div className="mt-0.5 text-[15px] font-medium text-muted-foreground/80 group-hover:text-foreground">
                          Поиск направлений
                        </div>
                      </div>
                    </button>
                  </PopoverTrigger>
                </div>
                <PopoverContent side="bottom" sideOffset={20} align="start" className="w-[420px] rounded-3xl p-6 shadow-2xl z-[60]">
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Рекомендуемые направления</h4>
                      <div className="grid grid-cols-1 gap-1">
                        {[
                          { city: "Иссык-Кульская область, Каракол", icon: Landmark, sub: "Горнолыжная база и трекинг" },
                          { city: "Нарынская область, Сон-Көл", icon: Waves, sub: "Высокогорное озеро и юрты" },
                          { city: "Чуйская область, Ала-Арча", icon: Mountain, sub: "Национальный парк рядом с Бишкеком" },
                          { city: "Джалал-Абадская область, Арсланбоб", icon: Leaf, sub: "Ореховые леса и водопады" },
                          { city: "Ошская область, Ош", icon: Landmark, sub: "Сулайман-Тоо и восточный колорит" },
                          { city: "Нарынская область, Көл-Суу", icon: Tent, sub: "Бирюзовое озеро в скалах" },
                        ].map((item) => (
                          <button key={item.city} className="flex w-full items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-muted/50">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                              <item.icon className="h-6 w-6" />
                            </div>
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

              <Divider />

              {/* WHEN */}
              <Popover open={activeSearchTab === "when"} onOpenChange={(open) => setActiveSearchTab(open ? "when" : null)}>
                <div className="relative z-10 flex w-full md:w-auto md:flex-1">
                  <PopoverTrigger asChild>
                    <button className="group relative w-full cursor-pointer rounded-full px-5 py-3 text-left transition-all hover:bg-muted/30 sm:px-8">
                      {activeSearchTab === "when" && (
                        <motion.div
                          layoutId="active-search-tab"
                          className="absolute inset-0 rounded-full bg-muted/60 shadow-sm"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className="relative z-10 text-center">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">Когда</div>
                        <div className="mt-0.5 text-[15px] font-medium text-muted-foreground/80 group-hover:text-foreground">
                          Выберите даты
                        </div>
                      </div>
                    </button>
                  </PopoverTrigger>
                </div>
                <PopoverContent side="bottom" sideOffset={20} align="center" className="w-[850px] rounded-3xl p-6 shadow-2xl z-[60]">
                  <div className="mb-6 flex justify-center gap-2">
                    <button className="rounded-full bg-muted px-6 py-2 text-sm font-semibold shadow-sm">Даты</button>
                    <button className="rounded-full px-6 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/50">Гибкий график</button>
                  </div>
                  <div className="flex justify-center">
                    <Calendar 
                      mode="range" 
                      numberOfMonths={2} 
                      className="border-none" 
                      classNames={{
                        day_selected: "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white",
                        day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-black",
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <Divider />

              {/* WHO */}
              <Popover open={activeSearchTab === "who"} onOpenChange={(open) => setActiveSearchTab(open ? "who" : null)}>
                <div className="relative z-10 flex w-full md:w-auto md:flex-1">
                  <PopoverTrigger asChild>
                    <button className="group relative w-full cursor-pointer rounded-full px-5 py-3 text-left transition-all hover:bg-muted/30 sm:px-8">
                      {activeSearchTab === "who" && (
                        <motion.div
                          layoutId="active-search-tab"
                          className="absolute inset-0 rounded-full bg-muted/60 shadow-sm"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className="relative z-10">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">Кто</div>
                        <div className="mt-0.5 text-[15px] font-medium text-muted-foreground/80 truncate group-hover:text-foreground">
                          {guests.adults + guests.children + guests.infants + guests.pets > 0 
                            ? `${guests.adults + guests.children + guests.infants + guests.pets} гостей` 
                            : "Добавить"}
                        </div>
                      </div>
                    </button>
                  </PopoverTrigger>
                </div>
                <PopoverContent side="bottom" sideOffset={20} align="end" className="w-[420px] rounded-3xl p-6 shadow-2xl z-[60]">
                  <div className="space-y-6">
                    {[
                      { id: "adults", label: "Взрослые", sub: "От 13 лет" },
                      { id: "children", label: "Дети", sub: "2–12 лет" },
                      { id: "infants", label: "Младенцы", sub: "До 2 лет" },
                      { id: "pets", label: "Домашние животные", sub: "Путешествуете с животным?" },
                    ].map((item) => {
                      const count = guests[item.id as keyof typeof guests];
                      return (
                        <div key={item.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                          <div>
                            <div className="text-[15px] font-semibold">{item.label}</div>
                            <div className="text-sm text-muted-foreground">{item.sub}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setGuests(prev => ({ ...prev, [item.id]: Math.max(0, prev[item.id as keyof typeof guests] - 1) }))}
                              disabled={count === 0}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-lg transition-colors hover:border-foreground disabled:border-muted-foreground/30 disabled:text-muted-foreground/30 disabled:hover:border-muted-foreground/30 cursor-pointer disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <span className="w-4 text-center text-sm font-medium">{count}</span>
                            <button 
                              onClick={() => setGuests(prev => ({ ...prev, [item.id]: prev[item.id as keyof typeof guests] + 1 }))}
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
                onClick={() => navigate("/explore")}
                className="group z-10 flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#0F1729] px-6 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1e293b] hover:shadow-[0_10px_30px_rgba(15,23,41,0.45)] active:scale-95 md:ml-2 md:w-auto" 
              >
                <Search className="h-5 w-5 stroke-[2.5px] transition-transform duration-300 group-hover:scale-110 group-hover:-translate-x-0.5" />
                <span className="font-semibold text-sm">Искать</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {categories.map((c, i) => (
            <button
              key={c.label}
              onClick={() => navigate(`/explore?cat=${c.q}`)}
              className={`group rounded-3xl border px-5 py-6 text-left transition-all ${i === 0 ? "border-[#a8a2ff] bg-[linear-gradient(145deg,#f6f5ff_0%,#f8f8ff_100%)] shadow-sm" : "border-border bg-card hover:-translate-y-0.5 hover:shadow-md"}`}
            >
              <div className="relative mb-3 flex justify-center">
                <span className="pointer-events-none absolute inset-x-8 top-2 h-12 rounded-full bg-[#8f8cff]/0 blur-xl transition-all duration-500 group-hover:bg-[#8f8cff]/40 group-hover:scale-125" />
                <img
                  src={c.iconSrc}
                  alt=""
                  className="relative z-10 h-16 w-16 object-contain transition-all duration-500 group-hover:-translate-y-1.5 group-hover:scale-110 group-hover:rotate-1 group-hover:drop-shadow-[0_10px_20px_rgba(95,84,162,0.35)]"
                />
              </div>
              <div className="text-center text-lg font-semibold text-foreground">{c.label}</div>
              <div className="mt-1 text-center text-sm text-muted-foreground">{c.sub}</div>
            </button>
          ))}
        </div>
      </section>

      {/* WHAT SEARCHING NOW */}
      <section className="container-page pb-24 pt-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("home.searchingTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("home.searchingSub")}</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tours.slice(0, 4).map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </section>
    </>
  );
};

const Divider = () => <div className="h-10 w-[1px] bg-border/60" />;

export default Home;


