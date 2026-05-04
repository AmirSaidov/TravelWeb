import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AIAssistant } from "@/components/ai/AIAssistant";

export const SiteLayout = ({ footerVariant = "dark" }: { footerVariant?: "dark" | "light" }) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer variant={footerVariant} />
      <AIAssistant />
    </div>
  );
};
