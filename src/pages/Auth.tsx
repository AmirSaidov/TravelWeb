import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app";
import { toast } from "@/hooks/use-toast";

interface Props { mode: "login" | "register" | "forgot" }

const AuthShell: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; footer: React.ReactNode }> = ({ title, subtitle, children, footer }) => (
  <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
    <div className="relative hidden lg:block">
      <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80" alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 gradient-hero-overlay" />
      <div className="absolute bottom-10 left-10 max-w-md text-white">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur">Kyrgyzstan Travel</span>
        <h2 className="mt-4 font-display text-3xl font-semibold">Where mountains touch the sky.</h2>
      </div>
    </div>
    <div className="flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-8 space-y-4">{children}</div>
        <div className="mt-6 text-center text-sm">{footer}</div>
      </div>
    </div>
  </div>
);

export const AuthPage = ({ mode }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signIn = useAppStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") {
      toast({ title: "Reset link sent", description: "Check your inbox (mock)." });
      navigate("/login");
      return;
    }
    signIn({
      id: Math.random().toString(36).slice(2),
      name: name || email.split("@")[0] || "Traveler",
      email: email || "demo@kyrgyz.travel",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    });
    toast({ title: mode === "login" ? "Welcome back!" : "Account created" });
    navigate("/dashboard");
  };

  if (mode === "forgot") {
    return (
      <AuthShell title={t("auth.reset")} subtitle={t("auth.resetSub")}
        footer={<Link to="/login" className="text-brand hover:underline">{t("auth.signin")}</Link>}>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label>{t("auth.email")}</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button type="submit" className="h-11 w-full bg-brand text-brand-foreground hover:bg-brand/90">{t("auth.sendLink")}</Button>
        </form>
      </AuthShell>
    );
  }

  const isLogin = mode === "login";
  return (
    <AuthShell
      title={isLogin ? t("auth.signin") : t("auth.signup")}
      footer={
        isLogin ? (<>{t("auth.noAccount")} <Link to="/register" className="font-semibold text-brand hover:underline">{t("auth.signup")}</Link></>) :
        (<>{t("auth.haveAccount")} <Link to="/login" className="font-semibold text-brand hover:underline">{t("auth.signin")}</Link></>)
      }>
      <Button type="button" variant="outline" onClick={submit as any} className="h-11 w-full rounded-xl bg-card">
        <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" fill="#34A853"/><path d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/></svg>
        {t("auth.continueGoogle")}
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />{t("auth.or")}<div className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={submit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        )}
        <div className="space-y-1.5"><Label>{t("auth.email")}</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>{t("auth.password")}</Label>
            {isLogin && <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-brand">{t("auth.forgot")}</Link>}
          </div>
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="h-11 w-full bg-brand text-brand-foreground hover:bg-brand/90">
          {isLogin ? t("auth.signin") : t("auth.signup")}
        </Button>
      </form>
    </AuthShell>
  );
};
