"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calculator, Globe2, ListChecks, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { getPageContext, initPageActionTracking } from "@/lib/aiContext";
import { AIMessageMarkdown } from "@/components/ai/AIMessageMarkdown";

interface DayBlock {
  day: number;
  title: string;
  tag: "Culture" | "Nature" | "Adventure";
  text: string;
  img: string;
}

interface Msg {
  id: string;
  role: "user" | "assistant";
  text?: string;
  timeline?: DayBlock[];
  pricePerPerson?: number;
  ts: number;
}

type AiChatResponse = { answer: string };

const createId = () => Math.random().toString(36).slice(2);

const AIAssistantPage = () => {
  const { t } = useTranslation();
  const [budget, setBudget] = useState(false);
  const [checklist, setChecklist] = useState(false);
  const [consult, setConsult] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    initPageActionTracking();
  }, []);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || isLoading) return;

    const userMsg: Msg = { id: createId(), role: "user", text: message, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { data } = await api.post<AiChatResponse>("/ai/chat/", { message, context: getPageContext() });
      setMessages((m) => [...m, { id: createId(), role: "assistant", ts: Date.now(), text: data.answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: createId(), role: "assistant", ts: Date.now(), text: t("ai.error") },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setIsLoading(false);
  };

  return (
    <section className="container-page py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t("ai.title")}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="grid h-2 w-2 place-items-center rounded-full bg-brand" />
              <span className="font-semibold uppercase tracking-wider text-brand">{t("ai.status")}</span>
            </div>
          </div>
          <Button variant="outline" onClick={reset} className="rounded-full">
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="flex h-[70vh] min-h-[520px] flex-col overflow-hidden rounded-3xl bg-background shadow-elevated ring-1 ring-border">
          {/* Quick tools */}
          <div className="flex flex-wrap gap-2 border-b border-border px-5 py-4">
            <Button size="sm" variant="secondary" onClick={() => setBudget(true)} className="rounded-full text-xs">
              <Calculator className="h-3.5 w-3.5" /> Budget
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setChecklist(true)} className="rounded-full text-xs">
              <ListChecks className="h-3.5 w-3.5" /> Checklist
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setConsult(true)} className="rounded-full text-xs">
              <Globe2 className="h-3.5 w-3.5" /> Visa
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.length === 0 && (
              <div className="rounded-3xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                {t("ai.disclaimer")}
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id}>
                {m.role === "user" ? (
                  <div className="ml-auto max-w-[88%] space-y-1 text-right sm:max-w-[80%]">
                    <div className="overflow-hidden rounded-2xl rounded-tr-sm bg-secondary px-4 py-2.5 text-left text-sm leading-6 break-words">{m.text}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">JUST NOW</div>
                  </div>
                ) : (
                  <div className="flex min-w-0 gap-2">
                    <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-brand to-emerald-700">
                      <Globe2 className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="min-w-0 max-w-[88%] space-y-3 sm:max-w-[85%]">
                      {m.text && (
                        <div className="overflow-hidden rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3">
                          <AIMessageMarkdown content={m.text} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-brand to-emerald-700">
                  <Globe2 className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="max-w-[85%] space-y-3">
                  <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-2.5 text-sm text-muted-foreground">
                    {"AI думает..."}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="flex gap-2 overflow-x-auto border-t border-border px-5 py-3 no-scrollbar">
            {[t("ai.suggestPack"), t("ai.suggestHotel"), t("ai.suggestWeather")].map((s, i) => (
              <Button
                key={i}
                size="sm"
                variant="ghost"
                disabled={isLoading}
                onClick={() => send(s)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                  i === 0
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : i === 1
                      ? "bg-brand-soft text-accent-foreground hover:bg-brand-soft/80"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
              >
                {s}
              </Button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-background p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.placeholder")}
              disabled={isLoading}
              className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading}
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <BudgetDialog open={budget} onOpenChange={setBudget} />
      <ChecklistDialog open={checklist} onOpenChange={setChecklist} />
      <ConsultDialog open={consult} onOpenChange={setConsult} />
    </section>
  );
};

export default AIAssistantPage;

const BudgetDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [people, setPeople] = useState(2);
  const [days, setDays] = useState(5);
  const [base, setBase] = useState(120);
  const [extras, setExtras] = useState(150);
  const total = people * days * base + extras;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Budget calculator</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>People</Label>
            <Input type="number" min={1} value={people} onChange={(e) => setPeople(+e.target.value || 1)} />
          </div>
          <div className="space-y-1.5">
            <Label>Days</Label>
            <Input type="number" min={1} value={days} onChange={(e) => setDays(+e.target.value || 1)} />
          </div>
          <div className="space-y-1.5">
            <Label>Per day / person ($)</Label>
            <Input type="number" value={base} onChange={(e) => setBase(+e.target.value || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label>Extras ($)</Label>
            <Input type="number" value={extras} onChange={(e) => setExtras(+e.target.value || 0)} />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground">
          <span className="text-sm font-medium opacity-80">Estimated total</span>
          <span className="font-display text-2xl font-semibold">${total.toLocaleString()}</span>
        </div>
        <p className="text-xs text-muted-foreground">Includes accommodation, meals and guide. Add visa & flights separately.</p>
      </DialogContent>
    </Dialog>
  );
};

const ChecklistDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const items = [
    "Layered clothing (5–25°C swings)",
    "Waterproof hiking boots",
    "Sunglasses & SPF50 sunscreen (high altitude UV)",
    "Headlamp + spare batteries",
    "Refillable water bottle (2L+)",
    "Light down jacket for cold yurt nights",
    "Cash in KGS — many remote areas have no card readers",
    "Power adapter Type C/F",
    "Personal first-aid kit + altitude meds",
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Smart checklist · Mountains & yurts</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i} className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded accent-[hsl(var(--brand))]" />
              <span>{i}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

const ConsultDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Visa & entry</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tell the assistant your citizenship + travel dates, and it will suggest what to check. Always verify with official sources.
        </p>
      </DialogContent>
    </Dialog>
  );
};
