"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
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
import { useTheme } from "next-themes";
import { useStaticT } from "@/i18n/useStaticT";
import { normalizeSiteLang, SITE_LANG_KEY, toI18nLang, type SiteLang } from "@/i18n/siteLang";

const langs: { code: SiteLang; label: string }[] = [
  { code: "en", label: "ENG" },
  { code: "ru", label: "RUS" },
  { code: "ky", label: "KGZ" },
];

export const Header = () => {
  const { t, i18n } = useTranslation();
  const { header: st } = useStaticT();
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);
  const signOut = useAppStore((s) => s.signOut);
  const openAuthModal = useAppStore((s) => s.openAuthModal);
  const setAvatar = useAppStore((s) => s.setAvatar);
  const currency = useAppStore((s) => s.currency);
  const currencyMode = useAppStore((s) => s.currencyMode);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const currentLang = normalizeSiteLang(i18n.language);

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: "/explore", label: t("nav.explore") },
    { href: "/map", label: t("nav.map") },
    { href: "/experiences", label: t("nav.experiences") },
    { href: "/faq", label: t("nav.faq") },
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/ai", label: t("nav.ai") },
  ];

  const currentLangMeta = langs.find((l) => l.code === currentLang) ?? langs[0];
  const currentCurrency = normalizeCurrency(currency) || "KGS";
  const initials = (user?.name || user?.email || "U").trim().slice(0, 1).toUpperCase();

  const setSiteLang = (lang: SiteLang) => {
    const normalized = normalizeSiteLang(lang);
    // Persist for backend (Accept-Language) and for future sessions.
    try {
      localStorage.setItem(SITE_LANG_KEY, normalized);
      localStorage.setItem("lang", toI18nLang(normalized));
    } catch {
      // ignore
    }
    try {
      document.cookie = `lang=${encodeURIComponent(normalized)}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // ignore
    }
    i18n.changeLanguage(toI18nLang(normalized));
  };

  useEffect(() => {
    if (currencyMode !== "auto") return;
    const next = currencyForLang(i18n.language);
    if (currentCurrency !== next) setCurrency(next, "auto");
  }, [currencyMode, currentCurrency, i18n.language, setCurrency]);

  return (
    <header className="sticky top-0 z-[60] border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container-page flex min-h-16 items-center justify-between gap-2 py-3 md:grid md:grid-cols-[auto_1fr_auto] md:gap-3 md:py-0">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="truncate font-display text-base font-semibold tracking-tight text-primary sm:text-lg">
            Kyrgyz Travel
          </span>
        </Link>

        <nav className="hidden justify-self-center items-center gap-8 md:flex">
          {navItems.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`relative text-sm font-medium transition-colors ${
                pathname === n.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              } after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:bg-foreground/80 after:transition-transform after:scale-x-0 ${
                pathname === n.href ? "after:scale-x-100" : ""
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-xl p-0 transition-transform duration-200 hover:scale-[1.03]"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label={st.themeToggleAria}
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500" />
            )}
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
                {st.currencyAuto} ({currencyForLang(i18n.language)})
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
                {currentLangMeta.label}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {langs.map((l) => (
                <DropdownMenuItem key={l.code} onClick={() => setSiteLang(l.code)}>
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
                  {st.changeAvatar}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAvatar("")}>{st.removeAvatar}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/dashboard">{t("nav.dashboard")}</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>{st.signOut}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="md:hidden"><Link href="/explore">{t("nav.explore")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="md:hidden"><Link href="/map">{t("nav.map")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="md:hidden"><Link href="/experiences">{t("nav.experiences")}</Link></DropdownMenuItem>
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
