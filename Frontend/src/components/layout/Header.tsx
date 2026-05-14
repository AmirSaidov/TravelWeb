import { Link, NavLink } from "react-router-dom";
import { ChevronDown, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CURRENCIES, currencyForLang } from "@/lib/currencyPref";
import { normalizeCurrency } from "@/lib/currency";

const langs = [
  { code: "en", label: "ENG" },
  { code: "ru", label: "RUS" },
  { code: "kg", label: "KGZ" },
];

export const Header = () => {
  const { t, i18n } = useTranslation();
  const user = useAppStore((s) => s.user);
  const signOut = useAppStore((s) => s.signOut);
  const openAuthModal = useAppStore((s) => s.openAuthModal);
  const setAvatar = useAppStore((s) => s.setAvatar);
  const currency = useAppStore((s) => s.currency);
  const currencyMode = useAppStore((s) => s.currencyMode);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const navItems = [
    { to: "/explore", label: t("nav.explore") },
    { to: "/map", label: t("nav.map") },
    { to: "/experiences", label: t("nav.experiences") },
    { to: "/dashboard", label: t("nav.dashboard") },
  ];

  const setLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("lang", code);
    if (currencyMode === "auto") {
      setCurrency(currencyForLang(code), "auto");
    }
  };
  const currentLang = langs.find((l) => l.code === i18n.language) ?? langs[0];
  const currentCurrency = normalizeCurrency(currency) || "KGS";
  const initials = (user?.name || user?.email || "U").trim().slice(0, 1).toUpperCase();

  useEffect(() => {
    if (currencyMode !== "auto") return;
    const next = currencyForLang(i18n.language);
    if (currentCurrency !== next) setCurrency(next, "auto");
  }, [currencyMode, currentCurrency, i18n.language, setCurrency]);

  return (
    <header className="sticky top-0 z-[60] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-page flex min-h-16 items-center justify-between gap-2 py-3 md:grid md:grid-cols-[auto_1fr_auto] md:gap-3 md:py-0">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="truncate font-display text-base font-semibold tracking-tight text-primary sm:text-lg">
            Kyrgyz Travel
          </span>
        </Link>

        <nav className="hidden justify-self-center items-center gap-8 md:flex">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `relative text-sm font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                } after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:bg-foreground/80 after:transition-transform after:scale-x-0 [&.active]:after:scale-x-100`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <Button
            asChild
            size="sm"
            className="h-9 rounded-full bg-brand px-3 text-xs text-brand-foreground hover:bg-brand/90 sm:px-4 sm:text-sm"
          >
            <Link to="/ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t("nav.ai")}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-2.5 text-xs font-medium sm:px-4 sm:text-sm">
                {currentCurrency}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCurrency(currencyForLang(i18n.language), "auto")}>
                Auto ({currencyForLang(i18n.language)})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {CURRENCIES.map((c) => (
                <DropdownMenuItem key={c} onClick={() => setCurrency(c, "manual")}>
                  {c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-2.5 text-xs font-medium sm:px-4 sm:text-sm">
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

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Menu" className="h-9 w-9 rounded-full p-0 overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center bg-muted text-xs font-semibold text-foreground">
                      {initials}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    if (!file) return;
                    if (!file.type.startsWith("image/")) return;
                    if (file.size > 1024 * 1024) return; // 1MB cap to keep localStorage happy

                    const reader = new FileReader();
                    reader.onload = () => {
                      const url = typeof reader.result === "string" ? reader.result : "";
                      if (!url) return;
                      setAvatar(url);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    avatarInputRef.current?.click();
                  }}
                >
                  Change avatar…
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAvatar("")}>Remove avatar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/dashboard">{t("nav.dashboard")}</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="md:hidden"><Link to="/explore">{t("nav.explore")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="md:hidden"><Link to="/map">{t("nav.map")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="md:hidden"><Link to="/experiences">{t("nav.experiences")}</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs sm:px-4 sm:text-sm"
                onClick={() => openAuthModal("login")}
              >
                {t("nav.login")}
              </Button>
              <Button
                size="sm"
                className="hidden h-9 bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90 min-[420px]:inline-flex sm:px-4 sm:text-sm"
                onClick={() => openAuthModal("register")}
              >
                {t("nav.signup")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
