import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Landmark, Mountain, Tent, Leaf, Waves, Footprints } from "lucide-react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { TourCard } from "@/components/ui-bits/TourCard";
import { tours } from "@/mocks/data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import searchAnimation from "@/assets/lottie/searching.json";
import ctaPulseAnimation from "@/assets/lottie/cta-pulse.json";

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "yurts" | "tours">("all");
  const [activeSearchTab, setActiveSearchTab] = useState<string | null>(null);
  const [guests, setGuests] = useState({ adults: 0, children: 0, infants: 0, pets: 0 });
  const [selectedWhere, setSelectedWhere] = useState("");
  const [flexibleDates, setFlexibleDates] = useState(false);

  const categories = [
    { icon: Footprints, label: t("categories.hiking"), q: "trekking" },
    { icon: Mountain, label: t("categories.horse"), q: "horseback" },
    { icon: Landmark, label: t("categories.cultural"), q: "cultural" },
    { icon: Leaf, label: t("categories.eco"), q: "eco" },
    { icon: Tent, label: t("categories.yurts"), q: "yurts" },
    { icon: Waves, label: t("categories.lakes"), q: "Issyk-Kul" },
  ];

  const guestCount = guests.adults + guests.children + guests.infants + guests.pets;

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 gradient-hero-overlay" />
        </div>
        <div className="container-page relative pb-24 pt-16 text-white sm:pb-32 sm:pt-24">
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md ring-1 ring-white/25">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {t("hero.pill")}
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] sm:text-6xl md:text-7xl text-balance">{t("hero.title")}</h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/85 sm:text-lg">{t("hero.subtitle")}</p>
          </motion.div>

          <div className="mx-auto mt-10 flex w-fit overflow-hidden rounded-2xl bg-white/10 p-1 backdrop-blur-md ring-1 ring-white/20">
            {([ ["all", t("search.allStays")], ["yurts", t("search.yurts")], ["tours", t("search.tours")] ] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} className={`rounded-xl px-5 py-2 text-sm font-medium transition-colors ${tab === key ? "bg-primary text-primary-foreground" : "text-white/85 hover:text-white"}`}>{label}</button>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mx-auto mt-8 w-full max-w-5xl relative">
            {activeSearchTab && <div className="fixed inset-0 z-40" onClick={() => setActiveSearchTab(null)} />}

            <div className="relative z-50 flex items-center gap-0 rounded-full bg-white p-2 text-foreground shadow-elevated ring-1 ring-black/5">
              <Popover open={activeSearchTab === "where"} onOpenChange={(open) => setActiveSearchTab(open ? "where" : null)}>
                <div className="flex flex-[1.5] relative z-10">
                  <PopoverTrigger asChild>
                    <button className="group relative w-full cursor-pointer rounded-full px-8 py-3 text-left transition-all hover:bg-muted/30">
                      {activeSearchTab === "where" && <motion.div layoutId="active-search-tab" className="absolute inset-0 rounded-full bg-muted/60 shadow-sm" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                      <div className="relative z-10">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Where</div>
                        <div className="mt-0.5 text-[15px] font-medium text-muted-foreground/80">{selectedWhere || "Search destinations"}</div>
                      </div>
                    </button>
                  </PopoverTrigger>
                </div>
                <PopoverContent side="bottom" sideOffset={20} align="start" className="w-[420px] rounded-3xl p-6 shadow-2xl z-[60]">
                  <div className="space-y-1">
                    {[
                      "Issyk-Kul, Karakol",
                      "Naryn, Son-Kul",
                      "Ala-Archa, Chuy",
                      "Arslanbob, Jalal-Abad",
                      "Osh, Sulayman-Too",
                      "Kel-Suu, Naryn",
                    ].map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedWhere(city);
                          setActiveSearchTab(null);
                        }}
                        className="flex w-full items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><Landmark className="h-6 w-6" /></div>
                        <div className="text-left"><div className="text-sm font-bold">{city}</div><div className="text-xs text-muted-foreground">Popular location</div></div>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Divider />

              <Popover open={activeSearchTab === "when"} onOpenChange={(open) => setActiveSearchTab(open ? "when" : null)}>
                <div className="flex flex-1 relative z-10">
                  <PopoverTrigger asChild>
                    <button className="group relative w-full cursor-pointer rounded-full px-8 py-3 text-left transition-all hover:bg-muted/30">
                      {activeSearchTab === "when" && <motion.div layoutId="active-search-tab" className="absolute inset-0 rounded-full bg-muted/60 shadow-sm" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                      <div className="relative z-10 text-center"><div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">When</div><div className="mt-0.5 text-[15px] font-medium text-muted-foreground/80">{flexibleDates ? "Flexible dates" : "Select dates"}</div></div>
                    </button>
                  </PopoverTrigger>
                </div>
                <PopoverContent side="bottom" sideOffset={20} align="center" className="w-[850px] rounded-3xl p-6 shadow-2xl z-[60]">
                  <div className="mb-6 flex justify-center gap-2">
                    <button onClick={() => setFlexibleDates(false)} className={`rounded-full px-6 py-2 text-sm font-semibold ${!flexibleDates ? "bg-muted shadow-sm" : "text-muted-foreground hover:bg-muted/50"}`}>Dates</button>
                    <button onClick={() => setFlexibleDates(true)} className={`rounded-full px-6 py-2 text-sm font-semibold ${flexibleDates ? "bg-muted shadow-sm" : "text-muted-foreground hover:bg-muted/50"}`}>Flexible</button>
                  </div>
                  <div className="flex justify-center"><Calendar mode="range" numberOfMonths={2} className="border-none" /></div>
                </PopoverContent>
              </Popover>

              <Divider />

              <Popover open={activeSearchTab === "who"} onOpenChange={(open) => setActiveSearchTab(open ? "who" : null)}>
                <div className="flex flex-1 relative z-10">
                  <PopoverTrigger asChild>
                    <button className="group relative w-full cursor-pointer rounded-full px-8 py-3 text-left transition-all hover:bg-muted/30">
                      {activeSearchTab === "who" && <motion.div layoutId="active-search-tab" className="absolute inset-0 rounded-full bg-muted/60 shadow-sm" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                      <div className="relative z-10"><div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Who</div><div className="mt-0.5 text-[15px] font-medium text-muted-foreground/80 truncate">{guestCount > 0 ? `${guestCount} guests` : "Add guests"}</div></div>
                    </button>
                  </PopoverTrigger>
                </div>
                <PopoverContent side="bottom" sideOffset={20} align="end" className="w-[420px] rounded-3xl p-6 shadow-2xl z-[60]">
                  <div className="space-y-6">
                    {[{ id: "adults", label: "Adults" }, { id: "children", label: "Children" }, { id: "infants", label: "Infants" }, { id: "pets", label: "Pets" }].map((item) => {
                      const count = guests[item.id as keyof typeof guests];
                      return (
                        <div key={item.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                          <div className="text-[15px] font-semibold">{item.label}</div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setGuests((prev) => ({ ...prev, [item.id]: Math.max(0, prev[item.id as keyof typeof guests] - 1) }))} disabled={count === 0} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-lg transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40">-</button>
                            <span className="w-4 text-center text-sm font-medium">{count}</span>
                            <button onClick={() => setGuests((prev) => ({ ...prev, [item.id]: prev[item.id as keyof typeof guests] + 1 }))} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-lg transition-colors hover:border-foreground">+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              <motion.button
                onClick={() => {
                  navigate("/explore");
                  toast({ title: "Searching", description: selectedWhere ? `Destination: ${selectedWhere}` : "Showing all destinations" });
                }}
                className="ml-2 flex h-14 items-center gap-2 rounded-full bg-[#0F1729] px-6 text-white transition-all hover:bg-[#1e293b] hover:shadow-lg active:scale-95 shrink-0 z-10"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.96 }}
              >
                
                <Search className="h-5 w-5 stroke-[2.5px]" />
                <span className="font-semibold text-sm">Search</span>
              </motion.button>
            </div>
          </motion.div>

        </div>
      </section>

      <section className="container-page py-10">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-16">
          {categories.map((c, i) => (
            <motion.button key={c.label} onClick={() => navigate(`/explore?cat=${c.q}`)} whileHover={{ y: -2 }} className={`group flex flex-col items-center gap-2 text-sm font-medium transition-all ${i === 0 ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <c.icon className={`h-6 w-6 transition-transform group-hover:scale-110 ${i === 0 ? "text-brand" : ""}`} />
              <span className={`transition-all ${i === 0 ? "border-b-2 border-brand pb-1" : "pb-1 border-b-2 border-transparent"}`}>{c.label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="container-page pb-24 pt-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("home.searchingTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("home.searchingSub")}</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tours.slice(0, 4).map((tour) => <TourCard key={tour.id} tour={tour} />)}
        </div>
      </section>
    </>
  );
};

const Divider = () => <div className="h-10 w-[1px] bg-border/60" />;

export default Home;
