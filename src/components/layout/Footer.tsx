import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export const Footer = ({ variant = "dark" }: { variant?: "dark" | "light" }) => {
  const { t } = useTranslation();
  const dark = variant === "dark";
  return (
    <footer className={dark ? "bg-primary text-primary-foreground" : "bg-surface text-foreground border-t border-border"}>
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground font-display font-bold">K</div>
              <span className="font-display text-lg font-semibold">Kyrgyzstan Travel</span>
            </div>
            <p className={`text-sm leading-relaxed ${dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {t("footer.about")}
            </p>
            <div className="flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className={`grid h-9 w-9 place-items-center rounded-full ${dark ? "bg-white/10 hover:bg-white/20" : "bg-muted hover:bg-secondary"} transition-colors`}><Instagram className="h-4 w-4" /></a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className={`grid h-9 w-9 place-items-center rounded-full ${dark ? "bg-white/10 hover:bg-white/20" : "bg-muted hover:bg-secondary"} transition-colors`}><Twitter className="h-4 w-4" /></a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className={`grid h-9 w-9 place-items-center rounded-full ${dark ? "bg-white/10 hover:bg-white/20" : "bg-muted hover:bg-secondary"} transition-colors`}><Facebook className="h-4 w-4" /></a>
            </div>
          </div>

          <div>
            <h4 className={`mb-4 font-display text-base font-semibold`}>{t("footer.destinations")}</h4>
            <ul className={`space-y-2 text-sm ${dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              <li><Link to="/explore?region=Issyk-Kul" className="hover:text-brand">Issyk-Kul Lake</Link></li>
              <li><Link to="/explore?region=Ala-Archa" className="hover:text-brand">Ala Archa Gorge</Link></li>
              <li><Link to="/explore?region=Naryn" className="hover:text-brand">Song Kul Lake</Link></li>
              <li><Link to="/explore?region=Pamir" className="hover:text-brand">Pamir Mountains</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-base font-semibold">{t("footer.info")}</h4>
            <ul className={`space-y-2 text-sm ${dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              <li><Link to="/experiences" className="hover:text-brand">{t("footer.travelVisa")}</Link></li>
              <li><Link to="/explore" className="hover:text-brand">{t("footer.bestTime")}</Link></li>
              <li><Link to="/experiences" className="hover:text-brand">{t("footer.etiquette")}</Link></li>
              <li><Link to="/map" className="hover:text-brand">{t("footer.safety")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-base font-semibold">{t("footer.newsletter")}</h4>
            <p className={`mb-3 text-sm ${dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t("footer.newsletterSub")}</p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); toast({ title: "Subscribed", description: "Thanks for joining our newsletter." }); }}>
              <Input placeholder={t("footer.emailP")} className={dark ? "bg-white/10 border-white/15 text-primary-foreground placeholder:text-primary-foreground/50" : ""} />
              <Button type="submit" className="bg-brand text-brand-foreground hover:bg-brand/90">{t("footer.join")}</Button>
            </form>
          </div>
        </div>

        <div className={`mt-12 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center ${dark ? "border-white/10 text-primary-foreground/60" : "border-border text-muted-foreground"}`}>
          <p>© 2026 Kyrgyzstan Travel. {t("footer.rights")} Licensed tour operator #KG-4015.</p>
          <div className="flex gap-5">
            <Link to="/explore" className="hover:text-brand">{t("footer.privacy")}</Link>
            <Link to="/experiences" className="hover:text-brand">{t("footer.terms")}</Link>
            <Link to="/map" className="hover:text-brand">{t("footer.sitemap")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
