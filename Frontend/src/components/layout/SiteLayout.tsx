import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AuthModal } from "@/components/auth/AuthModal";

export const SiteLayout = ({ footerVariant = "dark" }: { footerVariant?: "dark" | "light" }) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer variant={footerVariant} />
      <AuthModal />
    </div>
  );
};
