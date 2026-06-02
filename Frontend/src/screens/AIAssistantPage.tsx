"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Compass,
  Globe2,
  Loader2,
  Menu,
  MessageSquareText,
  Mountain,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import { getPageContext, initPageActionTracking } from "@/lib/aiContext";
import { getNumberLocale } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { AIMessageMarkdown } from "@/components/ai/AIMessageMarkdown";
import { AITourCards } from "@/components/ai/AITourCards";
import { AIWeatherCards } from "@/components/ai/AIWeatherCards";
import { AIStayCards } from "@/components/ai/AIStayCards";
import type { AICard } from "@/components/ai/types";

type MessageRole = "user" | "assistant" | "system";

type AIChatMessage = {
  id: number | string;
  conversation_id?: number;
  role: MessageRole;
  content: string;
  cards?: AICard[];
  created_at?: string | null;
};

type AIConversation = {
  id: number;
  title: string;
  session_id?: string;
  created_at?: string | null;
  updated_at?: string | null;
  last_message?: AIChatMessage | null;
  messages_count?: number;
  messages?: AIChatMessage[];
};

type ConversationDetail = AIConversation & {
  messages: AIChatMessage[];
};

type ConversationMessageResponse = {
  conversation: AIConversation;
  user_message?: AIChatMessage;
  assistant_message?: AIChatMessage;
  answer: string;
  cards?: AICard[];
  conversation_id: number;
  session_id?: string;
  messages?: AIChatMessage[];
};

type ConversationListResponse =
  | AIConversation[]
  | {
      conversations: AIConversation[];
      session_id?: string;
    };

type ConversationCreateResponse =
  | ConversationDetail
  | {
      conversation: ConversationDetail;
      session_id?: string;
    };

const ACTIVE_CONVERSATION_KEY = "kg_ai_active_conversation_id";
const AI_SESSION_KEY = "kg_ai_session_id";
const emptyStarters = [
  "Какие есть туры в Иссык-Куль?",
  "Что надеть в Оше?",
  "Сколько денег взять в Каракол?",
];

const hasWeatherCard = (cards?: AICard[]) => (cards ?? []).some((card) => card.type === "weather");

const createTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const readStoredConversationId = () => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ACTIVE_CONVERSATION_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const storeConversationId = (id: number | null) => {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(ACTIVE_CONVERSATION_KEY, String(id));
  else window.localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
};

const readAISessionId = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(AI_SESSION_KEY) || "";
};

const storeAISessionId = (sessionId?: string | null) => {
  if (typeof window === "undefined" || !sessionId) return;
  window.localStorage.setItem(AI_SESSION_KEY, sessionId);
};

const aiSessionRequestConfig = () => {
  const sessionId = readAISessionId();
  return sessionId ? { headers: { "X-AI-Session-ID": sessionId } } : {};
};

const aiSessionPayload = () => {
  const sessionId = readAISessionId();
  return sessionId ? { session_id: sessionId } : {};
};

const unpackConversationList = (payload: ConversationListResponse) => {
  if (Array.isArray(payload)) return payload;
  storeAISessionId(payload.session_id);
  return payload.conversations ?? [];
};

const unpackCreatedConversation = (payload: ConversationCreateResponse) => {
  if ("conversation" in payload) {
    storeAISessionId(payload.session_id);
    return payload.conversation;
  }
  return payload;
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "";

  const diffSeconds = Math.round((then - Date.now()) / 1000);
  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["minute", 60],
    ["hour", 60],
    ["day", 24],
    ["week", 7],
    ["month", 4.345],
    ["year", 12],
  ];

  let duration = diffSeconds;
  let unit: Intl.RelativeTimeFormatUnit = "second";
  for (const [nextUnit, amount] of divisions) {
    if (Math.abs(duration) < amount) break;
    duration = Math.round(duration / amount);
    unit = nextUnit;
  }

  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(duration, unit);
};

const conversationTitle = (conversation?: AIConversation | null) => {
  const title = conversation?.title?.trim();
  return title || "New chat";
};

const sortConversations = (items: AIConversation[]) =>
  [...items].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime || b.id - a.id;
  });

const CHAT_TEXTAREA_MAX_HEIGHT = 192;

const AIAssistantPage = () => {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeLoadRef = useRef(0);
  const skipNextLoadRef = useRef<number | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  useEffect(() => {
    initPageActionTracking();
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, loadingMessages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, CHAT_TEXTAREA_MAX_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > CHAT_TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
  }, [input]);

  const upsertConversation = (conversation: AIConversation) => {
    setConversations((current) => {
      const withoutCurrent = current.filter((item) => item.id !== conversation.id);
      return sortConversations([conversation, ...withoutCurrent]);
    });
  };

  const openConversation = (id: number | null) => {
    setActiveConversationId(id);
    storeConversationId(id);
    setSidebarOpen(false);
  };

  const createConversation = async () => {
    setCreatingConversation(true);
    setError(null);
    try {
      const { data } = await api.post<ConversationCreateResponse>(
        "/ai/conversations/",
        aiSessionPayload(),
        aiSessionRequestConfig(),
      );
      const conversation = unpackCreatedConversation(data);
      upsertConversation(conversation);
      setMessages(conversation.messages ?? []);
      skipNextLoadRef.current = conversation.id;
      openConversation(conversation.id);
      return conversation;
    } catch {
      setError("Could not create a new chat.");
      return null;
    } finally {
      setCreatingConversation(false);
    }
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    setError(null);
    try {
      const sessionId = readAISessionId();
      const { data } = await api.get<ConversationListResponse>("/ai/conversations/", {
        ...aiSessionRequestConfig(),
        params: sessionId ? { session_id: sessionId } : undefined,
      });
      const sorted = sortConversations(unpackConversationList(data));
      setConversations(sorted);

      const storedId = readStoredConversationId();
      const nextActive = sorted.some((item) => item.id === storedId) ? storedId : sorted[0]?.id ?? null;
      setActiveConversationId(nextActive);
      storeConversationId(nextActive);
      if (!nextActive) setMessages([]);
    } catch {
      setError("Could not load chat history.");
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    const loadId = activeLoadRef.current + 1;
    activeLoadRef.current = loadId;
    setLoadingMessages(true);
    setError(null);
    try {
      const { data } = await api.get<ConversationDetail>(
        `/ai/conversations/${conversationId}/`,
        aiSessionRequestConfig(),
      );
      storeAISessionId(data.session_id);
      if (activeLoadRef.current !== loadId) return;
      setMessages(data.messages ?? []);
      upsertConversation(data);
    } catch {
      if (activeLoadRef.current !== loadId) return;
      setError("Could not load this chat.");
      setMessages([]);
    } finally {
      if (activeLoadRef.current === loadId) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;
    if (skipNextLoadRef.current === activeConversationId) {
      skipNextLoadRef.current = null;
      return;
    }
    loadMessages(activeConversationId);
  }, [activeConversationId]);

  const deleteConversation = async (conversationId: number) => {
    setDeletingId(conversationId);
    setError(null);
    try {
      await api.delete(`/ai/conversations/${conversationId}/`, aiSessionRequestConfig());
      setConversations((current) => current.filter((item) => item.id !== conversationId));
      if (activeConversationId === conversationId) {
        openConversation(null);
        setMessages([]);
      }
    } catch {
      setError("Could not delete this chat.");
    } finally {
      setDeletingId(null);
    }
  };

  const sendMessage = async (text = input) => {
    const content = text.trim();
    if (!content || sending) return;

    let conversationId = activeConversationId;
    if (!conversationId) {
      const conversation = await createConversation();
      if (!conversation) return;
      conversationId = conversation.id;
    }

    const optimisticMessage: AIChatMessage = {
      id: createTempId(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const { data } = await api.post<ConversationMessageResponse>(`/ai/conversations/${conversationId}/message/`, {
        message: content,
        context: getPageContext(),
        ...aiSessionPayload(),
      }, aiSessionRequestConfig());
      storeAISessionId(data.session_id);

      if (data.messages?.length) {
        setMessages(data.messages);
      } else {
        setMessages((current) => [
          ...current.filter((item) => item.id !== optimisticMessage.id),
          data.user_message ?? optimisticMessage,
          data.assistant_message ?? {
            id: createTempId(),
            role: "assistant",
            content: data.answer,
            cards: data.cards,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      upsertConversation(data.conversation);
      openConversation(data.conversation_id);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createTempId(),
          role: "assistant",
          content: "I could not send that message. Please try again.",
          created_at: new Date().toISOString(),
        },
      ]);
      setError("Message was not sent.");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    sendMessage();
  };

  const sidebar = (
    <ChatSidebar
      activeConversationId={activeConversationId}
      conversations={conversations}
      creatingConversation={creatingConversation}
      deletingId={deletingId}
      loading={loadingConversations}
      onCreateConversation={createConversation}
      onDeleteConversation={deleteConversation}
      onOpenConversation={openConversation}
    />
  );

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container-page flex min-h-[calc(100vh-4rem)] gap-4 py-4 lg:gap-5 lg:py-5">
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-20 h-[calc(100vh-6.5rem)]">{sidebar}</div>
        </aside>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[86vw] max-w-[320px] border-r border-border/80 bg-background p-0">
            <SheetTitle className="sr-only">Chat history</SheetTitle>
            {sidebar}
          </SheetContent>
        </Sheet>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-elevated">
          <header className="flex min-h-16 items-center gap-3 border-b border-border/80 bg-card/90 px-3 backdrop-blur sm:px-5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open chat history"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground">
              <Globe2 className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold sm:text-base">
                {activeConversation ? conversationTitle(activeConversation) : "Kyrgyz Travel AI"}
              </h1>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                <span>{sending ? "Thinking" : "Ready"}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden rounded-xl sm:inline-flex"
              onClick={createConversation}
              disabled={creatingConversation}
            >
              {creatingConversation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              New Chat
            </Button>
          </header>

          {error && (
            <div className="border-b border-border/80 bg-brand-soft px-4 py-2 text-sm text-accent-foreground">
              {error}
            </div>
          )}

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-surface-muted/50 px-3 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
              {loadingMessages ? (
                <MessageSkeleton />
              ) : messages.length ? (
                messages
                  .filter((message) => message.role !== "system")
                  .map((message) => <ChatMessageBubble key={message.id} message={message} />)
              ) : (
                <EmptyChat onPickPrompt={sendMessage} disabled={sending || creatingConversation} />
              )}

              {sending && <TypingIndicator />}
            </div>
          </div>

          <footer className="border-t border-border/80 bg-card px-3 py-3 sm:px-5">
            <div className="mx-auto max-w-3xl">
              <form
                onSubmit={submitMessage}
                className="relative rounded-3xl border border-border bg-background/95 p-2 pr-14 shadow-card transition focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10"
              >
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Message Kyrgyz Travel AI"
                  disabled={sending || creatingConversation}
                  rows={1}
                  className="block max-h-48 min-h-[52px] w-full resize-none overflow-y-auto rounded-3xl border-0 bg-transparent py-3.5 pl-5 pr-3 text-sm leading-6 shadow-none outline-none ring-0 transition-[height] duration-150 ease-out [scrollbar-width:none] [-ms-overflow-style:none] placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || sending || creatingConversation}
                  className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-brand text-brand-foreground shadow-card transition hover:-translate-y-1/2 hover:scale-105 hover:bg-brand/90 disabled:scale-100 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                  aria-label="Send message"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </footer>
        </main>
      </div>
    </section>
  );
};

export default AIAssistantPage;

function ChatSidebar({
  activeConversationId,
  conversations,
  creatingConversation,
  deletingId,
  loading,
  onCreateConversation,
  onDeleteConversation,
  onOpenConversation,
}: {
  activeConversationId: number | null;
  conversations: AIConversation[];
  creatingConversation: boolean;
  deletingId: number | null;
  loading: boolean;
  onCreateConversation: () => void;
  onDeleteConversation: (id: number) => void;
  onOpenConversation: (id: number) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card lg:rounded-2xl">
      <div className="border-b border-border/80 p-3">
        <div className="mb-3 flex items-center justify-between gap-2 px-1">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-accent-foreground">
              <Mountain className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">AI History</div>
              <div className="truncate text-xs text-muted-foreground">{conversations.length} chats</div>
            </div>
          </div>
        </div>

        <Button
          type="button"
          className="h-10 w-full rounded-xl bg-brand text-brand-foreground hover:bg-brand/90"
          onClick={onCreateConversation}
          disabled={creatingConversation}
        >
          {creatingConversation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New Chat
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <ConversationSkeleton />
        ) : conversations.length ? (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                active={conversation.id === activeConversationId}
                conversation={conversation}
                deleting={deletingId === conversation.id}
                onDelete={onDeleteConversation}
                onOpen={onOpenConversation}
              />
            ))}
          </div>
        ) : (
          <div className="grid h-full place-items-center px-4 text-center">
            <div>
              <MessageSquareText className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-3 text-sm font-medium">No chats yet</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationRow({
  active,
  conversation,
  deleting,
  onDelete,
  onOpen,
}: {
  active: boolean;
  conversation: AIConversation;
  deleting: boolean;
  onDelete: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex min-h-[64px] cursor-pointer items-center gap-2 rounded-xl px-3 py-2 transition",
        active ? "bg-brand-soft text-accent-foreground" : "hover:bg-muted",
      )}
      onClick={() => onOpen(conversation.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen(conversation.id);
      }}
    >
      <MessageSquareText className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "text-muted-foreground")} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{conversationTitle(conversation)}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{formatRelativeTime(conversation.updated_at || conversation.created_at)}</span>
          {conversation.messages_count ? <span>{conversation.messages_count}</span> : null}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-lg opacity-0 transition group-hover:opacity-100 focus:opacity-100"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(conversation.id);
        }}
        disabled={deleting}
        aria-label="Delete chat"
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function ChatMessageBubble({ message }: { message: AIChatMessage }) {
  const isUser = message.role === "user";
  const weatherCard = hasWeatherCard(message.cards);

  return (
    <div className={cn("flex w-full animate-fade-in", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("min-w-0 space-y-3", isUser ? "max-w-[86%] sm:max-w-[72%]" : "max-w-full sm:max-w-[86%]")}>
        {isUser ? (
          <div className="rounded-2xl rounded-br-md bg-brand px-4 py-3 text-sm leading-6 text-brand-foreground shadow-card break-words">
            {message.content}
          </div>
        ) : (
          <div className="flex min-w-0 gap-3">
            <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-background text-brand shadow-card ring-1 ring-border">
              <Globe2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              {message.content && !weatherCard && (
                <div className="rounded-2xl rounded-tl-md border border-border/80 bg-background px-4 py-3 shadow-card">
                  <AIMessageMarkdown content={message.content} />
                </div>
              )}
              <AIWeatherCards cards={message.cards} />
              {!weatherCard && <AITourCards cards={message.cards} />}
              {!weatherCard && <AIStayCards cards={message.cards} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChat({ disabled, onPickPrompt }: { disabled: boolean; onPickPrompt: (prompt: string) => void }) {
  return (
    <div className="flex min-h-[48vh] flex-col items-center justify-center text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-card">
        <Compass className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Where to next?</h2>
      <div className="mt-5 grid w-full max-w-2xl gap-2 sm:grid-cols-3">
        {emptyStarters.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onPickPrompt(prompt)}
            className="rounded-2xl border border-border bg-background px-4 py-3 text-left text-sm leading-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated disabled:pointer-events-none disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex animate-fade-in items-center gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-background text-brand shadow-card ring-1 ring-border">
        <Globe2 className="h-4 w-4" />
      </div>
      <div className="inline-flex items-center gap-1 rounded-2xl border border-border/80 bg-background px-4 py-3 shadow-card">
        <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:160ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:320ms]" />
      </div>
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="ml-auto max-w-[70%] space-y-2">
        <Skeleton className="h-11 rounded-2xl" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-8 w-8 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      </div>
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="space-y-2 p-1">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl px-2 py-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
