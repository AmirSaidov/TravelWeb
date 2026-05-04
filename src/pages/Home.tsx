import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { Mountain, Tent, Landmark, Leaf, Waves, Footprints } from "lucide-react";
import { TourCard } from "@/components/ui-bits/TourCard";
import { tours } from "@/mocks/data";

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "yurts" | "tours">("all");

  const categories = [
    { icon: Footprints, label: t("categories.hiking"), q: "trekking" },
    { icon: Mountain, label: t("categories.horse"), q: "horseback" },
    { icon: Landmark, label: t("categories.cultural"), q: "cultural" },
    { icon: Leaf, label: t("categories.eco"), q: "eco" },
    { icon: Tent, label: t("categories.yurts"), q: "yurts" },
    { icon: Waves, label: t("categories.lakes"), q: "Issyk-Kul" },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80" alt="" className="h-full w-full object-cover" />
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
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-xl px-5 py-2 text-sm font-medium transition-colors ${tab === key ? "bg-primary text-primary-foreground" : "text-white/85 hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); navigate("/explore"); }}
            className="mx-auto mt-4 flex max-w-4xl items-stretch gap-0 rounded-3xl bg-white p-2 text-foreground shadow-elevated"
          >
            <Field label={t("search.where")} placeholder={t("search.whereP")} />
            <Divider />
            <Field label={t("search.checkin")} placeholder={t("search.addDates")} icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />} />
            <Divider />
            <Field label={t("search.checkout")} placeholder={t("search.addDates")} icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />} />
            <Divider />
            <Field label={t("search.guests")} placeholder={t("search.addGuests")} />
            <button type="submit" className="ml-1 grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold text-gold-foreground transition hover:brightness-105" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page py-10">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-16">
          {categories.map((c, i) => (
            <button
              key={c.label}
              onClick={() => navigate(`/explore?cat=${c.q}`)}
              className={`group flex flex-col items-center gap-2 text-sm font-medium ${i === 0 ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <c.icon className={`h-6 w-6 ${i === 0 ? "text-brand" : ""}`} />
              <span className={i === 0 ? "border-b-2 border-brand pb-1" : ""}>{c.label}</span>
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

const Field = ({ label, placeholder, icon }: { label: string; placeholder: string; icon?: React.ReactNode }) => (
  <label className="flex-1 cursor-text rounded-2xl px-5 py-2.5 transition-colors hover:bg-muted/60">
    <div className="text-[11px] font-semibold uppercase tracking-wide">{label}</div>
    <div className="mt-0.5 flex items-center justify-between gap-2">
      <input className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder={placeholder} />
      {icon}
    </div>
  </label>
);
const Divider = () => <div className="my-2 w-px bg-border" />;

export default Home;
