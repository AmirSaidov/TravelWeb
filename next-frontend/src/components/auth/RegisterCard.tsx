"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { useAppStore } from "@/store/app";

export function RegisterCard({ variant = "card" }: { variant?: "card" | "plain" }) {
  const router = useRouter();
  const signIn = useAppStore((s) => s.signIn);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await authApi.register({ name, email, password });
      signIn(user, token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.error ??
          "Не удалось зарегистрироваться. Проверь данные и попробуй ещё раз.",
      );
    } finally {
      setLoading(false);
    }
  };

  const shellClassName =
    variant === "plain"
      ? ""
      : "rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-card";

  return (
    <div className={shellClassName}>
      <div className="mb-6 text-center">
        <div className="font-display text-2xl font-semibold">Регистрация</div>
        <div className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[hsl(var(--primary))] hover:underline">
            Войти
          </Link>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Имя</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3.5 text-sm outline-none"
            autoComplete="name"
            required
          />
        </div>
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
            autoComplete="new-password"
            required
          />
        </div>

        {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[hsl(var(--primary))] px-6 font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "Создаём…" : "Создать аккаунт"}
        </button>
      </form>
    </div>
  );
}
