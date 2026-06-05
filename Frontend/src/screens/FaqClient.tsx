"use client";

import { useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export type FaqItem = { id: string; q: string; a: string; tags: string[] };

export function FaqClient({ items, searchPlaceholder, noResultsText }: { items: FaqItem[], searchPlaceholder: string, noResultsText: string }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((it) => `${it.q} ${it.a} ${it.tags.join(" ")}`.toLowerCase().includes(query));
  }, [items, q]);

  return (
    <section className="flex w-full min-w-0 flex-col gap-6">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-12 w-full rounded-2xl bg-card pl-12 text-base shadow-sm ring-1 ring-border/50 transition-all focus-visible:ring-primary"
        />
      </div>

      <div className="w-full min-w-0">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            {noResultsText}
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {filtered.map((it) => (
              <AccordionItem
                key={it.id}
                value={it.id}
                className="overflow-hidden rounded-2xl border border-border bg-card px-6 shadow-sm transition-all hover:shadow-md data-[state=open]:shadow-md"
              >
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
    </section>
  );
}
