"use client";

import { useEffect, useRef, useState } from "react";
import { Globe2, RefreshCw, Send } from "lucide-react";
import { api } from "@/lib/api/client";

type Msg = { id: string; role: "user" | "assistant"; text: string; ts: number };
type AiChatResponse = { answer: string };

const createId = () => Math.random().toString(36).slice(2);

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const reset = () => {
    setMessages([]);
    setIsLoading(false);
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || isLoading) return;

    setMessages((m) => [...m, { id: createId(), role: "user", text: message, ts: Date.now() }]);
    setInput("");
    setIsLoading(true);

    try {
      const { data } = await api.post<AiChatResponse>("/ai/chat/", { message });
      setMessages((m) => [...m, { id: createId(), role: "assistant", text: data.answer, ts: Date.now() }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: createId(), role: "assistant", text: "Ошибка AI. Попробуйте ещё раз.", ts: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="container-page py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">AI ассистент</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
              <span className="grid h-2 w-2 place-items-center rounded-full bg-[hsl(var(--brand))]" />
              <span className="font-semibold uppercase tracking-wider text-[hsl(var(--brand))]">ЭКСПЕРТ ОНЛАЙН</span>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 text-sm font-medium hover:bg-[hsl(var(--accent))]"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
        </div>

        <div className="flex h-[70vh] min-h-[520px] flex-col overflow-hidden rounded-3xl bg-[hsl(var(--background))] shadow-elevated ring-1 ring-[hsl(var(--border))]">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.length === 0 && (
              <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-6 text-sm text-[hsl(var(--muted-foreground))]">
                AI может ошибаться. Проверяйте важную информацию (визы, безопасность, цены).
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id}>
                {m.role === "user" ? (
                  <div className="ml-auto max-w-[80%] space-y-1 text-right">
                    <div className="rounded-2xl rounded-tr-sm bg-[hsl(var(--secondary))] px-4 py-2.5 text-left text-sm">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-[hsl(var(--brand))] to-emerald-700">
                      <Globe2 className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="max-w-[85%] space-y-3">
                      <div className="rounded-2xl rounded-tl-sm bg-[hsl(var(--muted))]/60 px-4 py-2.5 text-sm">
                        {m.text}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-[hsl(var(--brand))] to-emerald-700">
                  <Globe2 className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="max-w-[85%]">
                  <div className="rounded-2xl rounded-tl-sm bg-[hsl(var(--muted))]/60 px-4 py-2.5 text-sm text-[hsl(var(--muted-foreground))]">
                    AI думает…
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-[hsl(var(--border))] px-5 py-3 no-scrollbar">
            {["Что взять с собой?", "Отели в Караколе", "Прогноз погоды"].map((s) => (
              <button
                key={s}
                type="button"
                disabled={isLoading}
                onClick={() => send(s)}
                className="shrink-0 rounded-full bg-[hsl(var(--muted))]/60 px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спросите о вашем путешествии…"
              disabled={isLoading}
              className="h-11 flex-1 rounded-xl border border-[hsl(var(--input))] bg-transparent px-3.5 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-95 disabled:opacity-60"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

