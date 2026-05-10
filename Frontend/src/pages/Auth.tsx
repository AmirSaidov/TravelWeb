import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import { Apple, Chrome, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app";
import { toast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";

interface Props { mode: "login" | "register" | "forgot" }

export function AuthForm({
  mode,
  onSuccess,
  variant = "page",
}: {
  mode: Exclude<Props["mode"], "forgot">;
  onSuccess?: () => void;
  variant?: "page" | "modal";
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signIn = useAppStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp =
        mode === "login"
          ? await authApi.login({ email, password })
          : await authApi.register({ name, email, password });

      signIn(
        {
          id: String(resp.user.id),
          name: resp.user.name,
          email: resp.user.email,
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
          createdAt: (resp.user as any)?.created_at ?? undefined,
        },
        resp.token
      );

      toast({ title: mode === "login" ? "Welcome back!" : "Account created" });
      onSuccess?.();
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Auth error",
        description: err?.response?.data?.error ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";
  return (
    <>
      <form ref={formRef} onSubmit={submit} className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {!isLogin && (
            <div className="border-b border-border bg-background/40 px-6 py-5">
              <Label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 border-0 bg-transparent px-0 text-[15px] shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
              />
            </div>
          )}
          <div className="border-b border-border bg-background/40 px-6 py-5">
            <Label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {t("auth.email")}
            </Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-10 border-0 bg-transparent px-0 text-[15px] shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
            />
          </div>
          <div className="bg-background/40 px-6 py-5">
            <div className="mb-2 flex items-center justify-between gap-4">
              <Label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {t("auth.password")}
              </Label>
              {isLogin && (
                <Link
                  to="/forgot-password"
                  className="whitespace-nowrap text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {t("auth.forgot")}
                </Link>
              )}
            </div>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 border-0 bg-transparent px-0 text-[15px] shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
            />
          </div>
        </div>

        {variant === "page" && (
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link to="#" className="font-semibold text-foreground underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]"
        >
          {isLogin ? t("auth.signin") : t("auth.signup")}
        </Button>
      </form>

      {variant === "page" && (
        <>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-background px-3">{t("auth.or")}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => formRef.current?.querySelector("input")?.focus()}
              className="h-12 w-full justify-between rounded-xl bg-card px-4"
            >
              <Mail className="h-5 w-5" />
              <span className="flex-1 text-center font-semibold">Continue with Email</span>
              <span className="w-5" />
            </Button>
            <Button type="button" variant="outline" onClick={submit as any} className="h-12 w-full justify-between rounded-xl bg-card px-4">
              <Chrome className="h-5 w-5" />
              <span className="flex-1 text-center font-semibold">{t("auth.continueGoogle")}</span>
              <span className="w-5" />
            </Button>
            <Button type="button" variant="outline" className="h-12 w-full justify-between rounded-xl bg-card px-4">
              <Apple className="h-5 w-5" />
              <span className="flex-1 text-center font-semibold">Continue with Apple</span>
              <span className="w-5" />
            </Button>
          </div>
        </>
      )}
    </>
  );
}

const AuthShell: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}> = ({ title, subtitle, children, footer }) => (
  <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-[1.2fr_1fr]">
    {/* Left: Hero */}
    <div className="relative hidden md:block">
      <img
        src="https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=2400&q=80"
        alt=""
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 gradient-hero-overlay" />
      <div className="absolute left-8 top-8">
        <span className="font-display text-2xl font-semibold text-white drop-shadow-sm">Kyrgyz Travel</span>
      </div>
      <div className="absolute bottom-12 left-8 max-w-md text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <h2 className="font-display text-4xl font-semibold leading-tight">Discover the heart of Central Asia.</h2>
        <p className="mt-4 text-sm text-white/85">
          Join our community of explorers and find the most authentic stays across the Great Silk Road.
        </p>
      </div>
    </div>

    {/* Right: Form */}
    <div className="flex items-center justify-center bg-background px-6 py-12 sm:px-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-10 md:hidden">
          <span className="font-display text-xl font-semibold text-primary">Kyrgyz Travel</span>
        </div>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        {children}

        <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
      </div>
    </div>
  </div>
);

export const AuthPage = ({ mode }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      toast({ title: "Reset link sent", description: "Check your inbox." });
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "forgot") {
    return (
      <AuthShell
        title={t("auth.reset")}
        subtitle={t("auth.resetSub")}
        footer={<Link to="/login" className="text-primary hover:underline">{t("auth.signin")}</Link>}
      >
        <form onSubmit={submitForgot} className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("auth.email")}</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            {t("auth.sendLink")}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome to Kyrgyz Travel"
      subtitle="Log in or sign up to continue your journey."
      footer={
        mode === "login"
          ? (<>{t("auth.noAccount")} <Link to="/register" className="font-semibold text-brand hover:underline">{t("auth.signup")}</Link></>)
          : (<>{t("auth.haveAccount")} <Link to="/login" className="font-semibold text-brand hover:underline">{t("auth.signin")}</Link></>)
      }
    >
      <AuthForm mode={mode} />
    </AuthShell>
  );
};
