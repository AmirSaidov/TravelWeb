"use client";

import Link from "next/link";
import { Instagram, Twitter, Facebook } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Footer = ({ variant = "dark" }: { variant?: "dark" | "light" }) => {
  const { t } = useTranslation();
  const dark = variant === "dark";
  return (
    <footer className="bg-surface text-foreground border-t border-border">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center bg-primary text-primary-foreground font-display font-bold">K</div>
              <span className="font-display text-lg font-semibold">Kyrgyzstan Travel</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("footer.about")}
            </p>
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="grid h-9 w-9 place-items-center border border-border bg-card hover:bg-accent transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="grid h-9 w-9 place-items-center border border-border bg-card hover:bg-accent transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="grid h-9 w-9 place-items-center border border-border bg-card hover:bg-accent transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className={`mb-4 font-display text-base font-semibold`}>{t("footer.destinations")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/explore?region=Issyk-Kul" className="hover:text-primary">Issyk-Kul Lake</Link></li>
              <li><Link href="/explore?region=Ala-Archa" className="hover:text-primary">Ala Archa Gorge</Link></li>
              <li><Link href="/explore?region=Naryn" className="hover:text-primary">Song Kul Lake</Link></li>
              <li><Link href="/explore?region=Pamir" className="hover:text-primary">Pamir Mountains</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-base font-semibold">{t("footer.info")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/info/visa" className="hover:text-primary">{t("footer.travelVisa")}</Link></li>
              <li><Link href="/info/best-time" className="hover:text-primary">{t("footer.bestTime")}</Link></li>
              <li><Link href="/info/etiquette" className="hover:text-primary">{t("footer.etiquette")}</Link></li>
              <li><Link href="/info/safety" className="hover:text-primary">{t("footer.safety")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-base font-semibold">{t("footer.newsletter")}</h4>
            <p className="mb-3 text-sm text-muted-foreground">{t("footer.newsletterSub")}</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input placeholder={t("footer.emailP")} className="bg-background border-border text-foreground placeholder:text-muted-foreground" />
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{t("footer.join")}</Button>
            </form>
          </div>
        </div>

        <div className={`mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center`}>
          <p>© 2026 Kyrgyzstan Travel. {t("footer.rights")} Licensed tour operator #KG-4015.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-primary">{t("footer.privacy")}</Link>
            <Link href="/terms" className="hover:text-primary">{t("footer.terms")}</Link>
            <Link href="/sitemap" className="hover:text-primary">{t("footer.sitemap")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
