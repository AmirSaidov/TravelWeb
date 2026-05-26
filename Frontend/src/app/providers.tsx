"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme as antdTheme } from "antd";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { initI18n } from "@/i18n";
import { ThemeProvider, useTheme } from "next-themes";

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
