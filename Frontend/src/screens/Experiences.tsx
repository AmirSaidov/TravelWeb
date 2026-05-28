import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toursApi } from "@/lib/api";
import { TourCard } from "@/components/ui-bits/TourCard";
import type { TourType } from "@/types";
import { useAppStore } from "@/store/app";

const groups: TourType[] = ["horseback", "trekking", "cultural", "yurts", "off-road"];

const Experiences = () => {
  const { t, i18n } = useTranslation();
  const currency = useAppStore((s) => s.currency);
  const currentLang = i18n.language;
  const { data: tours = [] } = useQuery({
    queryKey: ["tours", currency, currentLang],
    queryFn: () => toursApi.getTours(currency),
  });
  return (
    <div className="container-page py-12">
      <header className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-brand">{t("experiences.curated")}</span>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{t("experiences.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("experiences.subtitle")}</p>
      </header>

      <div className="mt-14 space-y-16">
        {groups.map((g) => {
          const list = tours.filter((tr) => tr.types.includes(g)).slice(0, 4);
          if (list.length === 0) return null;
          return (
            <section key={g}>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t(`experiences.groups.${g}.title`)}</h2>
                  <p className="text-sm text-muted-foreground">{t(`experiences.groups.${g}.subtitle`)}</p>
                </div>
                <Link href={`/explore?cat=${g}`} className="text-sm font-medium text-brand hover:underline">
                  {t("experiences.viewAll")} →
                </Link>
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
