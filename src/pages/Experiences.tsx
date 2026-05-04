import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { tours } from "@/mocks/data";
import { TourCard } from "@/components/ui-bits/TourCard";
import type { TourType } from "@/types";

const groups: { id: TourType; title: string; subtitle: string }[] = [
  { id: "horseback", title: "Horseback adventures", subtitle: "Multi-day rides across alpine pastures" },
  { id: "trekking", title: "Trekking & hiking", subtitle: "From day-walks to high-altitude expeditions" },
  { id: "cultural", title: "Cultural immersion", subtitle: "Live with families, learn ancient crafts" },
  { id: "yurts", title: "Yurt stays", subtitle: "Sleep where the nomads sleep" },
  { id: "off-road", title: "Off-road & extreme", subtitle: "4x4, MTB and remote canyons" },
];

const Experiences = () => {
  const { t } = useTranslation();
  return (
    <div className="container-page py-12">
      <header className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-brand">Curated</span>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Experiences across Kyrgyzstan</h1>
        <p className="mt-3 text-muted-foreground">Pick your kind of adventure — every tour is hand-vetted by our team of local guides.</p>
      </header>

      <div className="mt-14 space-y-16">
        {groups.map((g) => {
          const list = tours.filter((tr) => tr.types.includes(g.id)).slice(0, 4);
          if (list.length === 0) return null;
          return (
            <section key={g.id}>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold sm:text-3xl">{g.title}</h2>
                  <p className="text-sm text-muted-foreground">{g.subtitle}</p>
                </div>
                <Link to={`/explore?cat=${g.id}`} className="text-sm font-medium text-brand hover:underline">View all →</Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((tr) => <TourCard key={tr.id} tour={tr} />)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default Experiences;
