"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme as antdTheme } from "antd";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { initI18n } from "@/i18n";

export function Providers({ children, initialLang }: { children: React.ReactNode; initialLang?: string }) {
  const [queryClient] = useState(() => new QueryClient());

  // Ensure the very first render (both SSR and CSR) uses the same language.
  initI18n(initialLang);

  useEffect(() => {
    const stored = localStorage.getItem("lang")?.trim();
    if (!stored) return;

    document.cookie = `lang=${encodeURIComponent(stored)}; path=/; max-age=31536000; samesite=lax`;
    initI18n(stored);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: "#ef4444",
            colorInfo: "#ef4444",
            colorSuccess: "#22c55e",
            borderRadius: 24,
            fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          },
        }}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
