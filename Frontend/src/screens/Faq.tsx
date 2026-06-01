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
      <div className="mx-auto flex max-w-3xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{t("faq.title")}</h1>
          <p className="mt-4 text-base text-muted-foreground">{t("faq.subtitle")}</p>
        </div>

        <div className="relative w-full shrink-0 md:w-[320px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("faq.searchP")}
            className="h-12 w-full rounded-2xl bg-card pl-12 text-base shadow-sm ring-1 ring-border/50 transition-all focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="mt-10 mx-auto max-w-3xl">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            {t("faq.noResults")}
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {filtered.map((it) => (
              <AccordionItem key={it.id} value={it.id} className="rounded-2xl border border-border bg-card px-6 shadow-sm transition-all hover:shadow-md data-[state=open]:shadow-md">
                <AccordionTrigger className="py-5 text-left text-[17px] font-semibold hover:no-underline hover:text-primary">
                  {it.q}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-[15px] leading-relaxed text-muted-foreground">
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

