"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type FaqItem = { id: string; q: string; a: string; tags: string[] };

const Faq = () => {
  const { t } = useTranslation();
  const [q, setQ] = useState("");

  const items: FaqItem[] = useMemo(
    () => [
      { id: "language", q: t("faq.language.q"), a: t("faq.language.a"), tags: ["language", "i18n"] },
      { id: "currency", q: t("faq.currency.q"), a: t("faq.currency.a"), tags: ["currency", "prices"] },
      { id: "booking", q: t("faq.booking.q"), a: t("faq.booking.a"), tags: ["booking"] },
      { id: "payment", q: t("faq.payment.q"), a: t("faq.payment.a"), tags: ["payment"] },
      { id: "cancellation", q: t("faq.cancellation.q"), a: t("faq.cancellation.a"), tags: ["cancellation"] },
    ],
    [t]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((it) => `${it.q} ${it.a} ${it.tags.join(" ")}`.toLowerCase().includes(query));
  }, [items, q]);

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{t("faq.title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{t("faq.subtitle")}</p>
        </div>

        <div className="relative w-full md:w-[420px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("faq.searchP")}
            className="h-11 rounded-2xl pl-11"
          />
        </div>
      </div>

      <div className="mt-8 rounded-3xl bg-card p-2 shadow-card ring-1 ring-border">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {t("faq.noResults")}
          </div>
        ) : (
          <Accordion type="single" collapsible className="rounded-2xl overflow-hidden">
            {filtered.map((it) => (
              <AccordionItem key={it.id} value={it.id} className="border-border/70 px-4">
                <AccordionTrigger className="py-4 text-left text-base font-semibold hover:no-underline">
                  {it.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                  {it.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default Faq;

