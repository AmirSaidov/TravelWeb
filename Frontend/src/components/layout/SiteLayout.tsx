"use client";

import { usePathname } from "next/navigation";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AuthModal } from "@/components/auth/AuthModal";

export const SiteLayout = ({
  children,
  footerVariant = "dark",
}: {
  children: React.ReactNode;
  footerVariant?: "dark" | "light";
}) => {
  const pathname = usePathname();
  const showFloatingAssistant = pathname !== "/ai";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer variant={footerVariant} />
      <AuthModal />
      {showFloatingAssistant && <AIAssistant />}
    </div>
  );
};
