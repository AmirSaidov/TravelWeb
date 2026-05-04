import { Link, NavLink } from "react-router-dom";
import { Menu, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const langs = [
  { code: "en", label: "ENG" },
  { code: "ru", label: "RUS" },
  { code: "kg", label: "KGZ" },
];

export const Header = () => {
  const { t, i18n } = useTranslation();
  const user = useAppStore((s) => s.user);
  const signOut = useAppStore((s) => s.signOut);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/explore", label: t("nav.explore") },
    { to: "/map", label: t("nav.map") },
    { to: "/experiences", label: t("nav.experiences") },
    { to: "/dashboard", label: t("nav.dashboard") },
  ];

  const setLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("lang", code);
  };
  const currentLang = langs.find((l) => l.code === i18n.language) ?? langs[0];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">
            K
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Kyrgyzstan Travel</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `relative text-sm font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                } after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:bg-brand after:transition-transform ${
                  "after:scale-x-0"
                } [&.active]:after:scale-x-100`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full font-medium">
                {currentLang.label}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {langs.map((l) => (
                <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)}>
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full" aria-label="Menu">
                {user ? (
                  <img src={user.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/dashboard">{t("nav.dashboard")}</Link></DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild><Link to="/login">{t("nav.login")}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/register">{t("nav.signup")}</Link></DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="md:hidden"><Link to="/explore">{t("nav.explore")}</Link></DropdownMenuItem>
              <DropdownMenuItem asChild className="md:hidden"><Link to="/map">{t("nav.map")}</Link></DropdownMenuItem>
              <DropdownMenuItem asChild className="md:hidden"><Link to="/experiences">{t("nav.experiences")}</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
