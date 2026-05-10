import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Paperclip, RefreshCw, Calculator, ListChecks, Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";

interface DayBlock { day: number; title: string; tag: "Culture" | "Nature" | "Adventure"; text: string; img: string; }
interface Msg { id: string; role: "user" | "assistant"; text?: string; timeline?: DayBlock[]; pricePerPerson?: number; ts: number; }
type AiChatResponse = { answer: string };

const createId = () => Math.random().toString(36).slice(2);

const initial: Msg[] = [
  { id: "1", role: "user", text: "Can you help me plan a 3-day trip to Issyk-Kul lake? I'm interested in hiking and local culture.", ts: Date.now() - 60_000 },
  {
    id: "2", role: "assistant", ts: Date.now() - 30_000,
    text: "Of course! Issyk-Kul is magical. I've drafted a perfect 3-day itinerary that balances the alpine beauty of the north shore with the cultural heritage of Karakol.",
    timeline: [
      { day: 1, title: "Cholpon-Ata & Petroglyphs", tag: "Culture", text: "Visit the open-air museum and relax by the crystal clear water.", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=160&q=80" },
      { day: 2, title: "Karakol & Jeti-Oguz", tag: "Nature", text: "Explore the \"Seven Bulls\" rock formations and the wooden Dungan Mosque.", img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=160&q=80" },
      { day: 3, title: "Ala-Köl Day Hike", tag: "Adventure", text: "Trek to the alpine lake at 3,500m for jaw-dropping turquoise views.", img: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=160&q=80" },
    ],
    pricePerPerson: 685,
  },
];

export const AIAssistant = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [budget, setBudget] = useState(false);
  const [checklist, setChecklist] = useState(false);
  const [consult, setConsult] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open, isLoading]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || isLoading) return;

    const userMsg: Msg = { id: createId(), role: "user", text: message, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { data } = await api.post<AiChatResponse>("/ai/chat/", { message });
      setMessages((m) => [
        ...m,
        {
          id: createId(), role: "assistant", ts: Date.now(),
          text: data.answer,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: createId(), role: "assistant", ts: Date.now(), text: "\u041e\u0448\u0438\u0431\u043a\u0430 AI. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setMessages(initial);
    setIsLoading(false);
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-elevated transition hover:scale-105"
            aria-label="Open AI assistant"
          >
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand/40" />
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="fixed bottom-6 right-6 z-50 flex h-[640px] max-h-[calc(100vh-3rem)] w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl bg-background shadow-elevated ring-1 ring-border"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-emerald-700">
                <Globe2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-display text-base font-semibold">{t("ai.title")}</div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand">
                  <span className="grid h-1.5 w-1.5 place-items-center rounded-full bg-brand" />
                  {t("ai.status")}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={reset} className="h-8 w-8 rounded-full text-muted-foreground" aria-label="Reset"><RefreshCw className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 rounded-full text-muted-foreground" aria-label="Close"><X className="h-4 w-4" /></Button>
            </div>

            {/* Quick tools */}
            <div className="flex gap-2 border-b border-border px-5 py-3">
              <Button size="sm" variant="secondary" onClick={() => setBudget(true)} className="rounded-full text-xs"><Calculator className="h-3.5 w-3.5" /> Budget</Button>
              <Button size="sm" variant="secondary" onClick={() => setChecklist(true)} className="rounded-full text-xs"><ListChecks className="h-3.5 w-3.5" /> Checklist</Button>
              <Button size="sm" variant="secondary" onClick={() => setConsult(true)} className="rounded-full text-xs"><Globe2 className="h-3.5 w-3.5" /> Visa</Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {messages.map((m) => (
                <div key={m.id}>
                  {m.role === "user" ? (
                    <div className="ml-auto max-w-[80%] space-y-1 text-right">
                      <div className="rounded-2xl rounded-tr-sm bg-secondary px-4 py-2.5 text-left text-sm">{m.text}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">JUST NOW</div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-brand to-emerald-700">
                        <Globe2 className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="max-w-[85%] space-y-3">
                        {m.text && <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-2.5 text-sm">{m.text}</div>}
                        {m.timeline && (
                          <div>
                            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              📅 {t("ai.proposed")}
                            </div>
                            <div className="space-y-2">
                              {m.timeline.map((d) => (
                                <div key={d.day} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                                  <img src={d.img} alt="" className="h-14 w-14 rounded-lg object-cover" />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand">{t("ai.day")} {d.day}</span>
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${d.tag === "Culture" ? "bg-blue-100 text-blue-700" : d.tag === "Nature" ? "bg-brand-soft text-accent-foreground" : "bg-amber-100 text-amber-700"}`}>{d.tag}</span>
                                    </div>
                                    <div className="mt-0.5 text-sm font-semibold leading-tight">{d.title}</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{d.text}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {m.pricePerPerson && (
                              <div className="mt-2 flex items-center justify-between rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
                                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Estimated for 1 person</div>
                                <div className="font-display text-lg font-semibold">${m.pricePerPerson}<span className="text-[10px] font-normal opacity-70"> USD total</span></div>
                              </div>
                            )}
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
                      {"AI \u0434\u0443\u043c\u0430\u0435\u0442..."}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="flex gap-2 overflow-x-auto border-t border-border px-5 py-3 no-scrollbar">
              {[t("ai.suggestPack"), t("ai.suggestHotel"), t("ai.suggestWeather")].map((s, i) => (
                <Button key={i} size="sm" variant="ghost" disabled={isLoading} onClick={() => send(s)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${i === 0 ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : i === 1 ? "bg-brand-soft text-accent-foreground hover:bg-brand-soft/80" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}>{s}</Button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 border-t border-border bg-background p-3"
            >
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground"><Paperclip className="h-4 w-4" /></Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("ai.placeholder")}
                disabled={isLoading}
                className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button type="submit" size="icon" disabled={isLoading} className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:opacity-90"><Send className="h-4 w-4" /></Button>
            </form>
            <p className="px-5 pb-2 text-center text-[10px] text-muted-foreground">{t("ai.disclaimer")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <BudgetDialog open={budget} onOpenChange={setBudget} />
      <ChecklistDialog open={checklist} onOpenChange={setChecklist} />
      <ConsultDialog open={consult} onOpenChange={setConsult} />
    </>
  );
};

const BudgetDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [people, setPeople] = useState(2);
  const [days, setDays] = useState(5);
  const [base, setBase] = useState(120);
  const [extras, setExtras] = useState(150);
  const total = people * days * base + extras;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="font-display">Budget calculator</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>People</Label><Input type="number" min={1} value={people} onChange={(e) => setPeople(+e.target.value || 1)} /></div>
          <div className="space-y-1.5"><Label>Days</Label><Input type="number" min={1} value={days} onChange={(e) => setDays(+e.target.value || 1)} /></div>
          <div className="space-y-1.5"><Label>Per day / person ($)</Label><Input type="number" value={base} onChange={(e) => setBase(+e.target.value || 0)} /></div>
          <div className="space-y-1.5"><Label>Extras ($)</Label><Input type="number" value={extras} onChange={(e) => setExtras(+e.target.value || 0)} /></div>
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
        <DialogHeader><DialogTitle className="font-display">Smart checklist · Mountains & yurts</DialogTitle></DialogHeader>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (<li key={i} className="flex items-start gap-2"><input type="checkbox" className="mt-1 h-4 w-4 rounded accent-[hsl(var(--brand))]" /><span>{i}</span></li>))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

const ConsultDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle className="font-display">Visa & travel rules</DialogTitle></DialogHeader>
      <div className="space-y-4 text-sm leading-relaxed">
        <div>
          <h4 className="mb-1 font-semibold">Visa-free entry</h4>
          <p className="text-muted-foreground">Citizens of 60+ countries (EU, UK, US, Canada, Japan, AU/NZ) can enter Kyrgyzstan visa-free for up to 60 days.</p>
        </div>
        <div>
          <h4 className="mb-1 font-semibold">Border zones</h4>
          <p className="text-muted-foreground">Kol-Suu, Inylchek and parts of the Chinese border require a permit (we handle these).</p>
        </div>
        <div>
          <h4 className="mb-1 font-semibold">Etiquette</h4>
          <p className="text-muted-foreground">Remove shoes when entering a yurt. Accept tea with both hands. Modest dress in mosques and small villages.</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
