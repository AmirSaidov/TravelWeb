"use client";

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
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer variant={footerVariant} />
      <AuthModal />
    </div>
  );
};
