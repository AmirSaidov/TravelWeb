"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme as antdTheme } from "antd";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { initI18n } from "@/i18n";
import { ThemeProvider, useTheme } from "next-themes";
import { normalizeSiteLang, SITE_LANG_KEY } from "@/i18n/siteLang";
import { useAppStore } from "@/store/app";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const needle = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part.startsWith(needle)) continue;
    const raw = part.slice(needle.length);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

// Client-side init before the first render to avoid hydration mismatches.
if (typeof window !== "undefined") {
  initI18n(readCookie("lang"));
}

function AntdConfigProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#ef4444",
          colorInfo: "#ef4444",
          colorSuccess: "#22c55e",
          borderRadius: 24,
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export function Providers({ children, initialLang }: { children: React.ReactNode; initialLang?: string }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  // Initialize i18n on the server render (so SSR HTML uses correct language),
  // but avoid doing it during client render to prevent "setState while rendering" warnings from react-i18next.
  if (typeof window === "undefined") {
    initI18n(initialLang);
  }

  useEffect(() => {
    // Keep i18n in sync if SSR cookie language changes between navigations.
    initI18n(initialLang);
  }, [initialLang]);

  useEffect(() => {
    // Rehydrate persisted app state only after mount to keep the first client render
    // identical to the server render and avoid React hydration errors.
    useAppStore.persist.rehydrate();

    const stored = localStorage.getItem(SITE_LANG_KEY)?.trim() || localStorage.getItem("lang")?.trim() || "";
    if (!stored) return;

    const siteLang = normalizeSiteLang(stored);
    initI18n(siteLang);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AntdConfigProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </AntdConfigProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
