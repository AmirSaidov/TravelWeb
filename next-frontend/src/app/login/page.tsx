"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { useAppStore } from "@/store/app";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useAppStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await authApi.login({ email, password });
      signIn(user, token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Не удалось войти. Проверь email/пароль.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-card">
        <div className="mb-6 text-center">
          <div className="font-display text-2xl font-semibold">Войти</div>
          <div className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-[hsl(var(--primary))] hover:underline">
              Регистрация
            </Link>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3.5 text-sm outline-none"
              autoComplete="email"
              inputMode="email"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Пароль</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3.5 text-sm outline-none"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[hsl(var(--primary))] px-6 font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Входим…" : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

