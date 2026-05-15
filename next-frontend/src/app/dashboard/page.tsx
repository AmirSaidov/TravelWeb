"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { useAppStore } from "@/store/app";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const token = useAppStore((s) => s.token);
  const signIn = useAppStore((s) => s.signIn);
  const signOut = useAppStore((s) => s.signOut);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (user) return;
    if (!token) return;
    setLoadingProfile(true);
    authApi
      .profile()
      .then((u) => signIn(u, token))
      .catch(() => {
        signOut();
        router.push("/login");
      })
      .finally(() => setLoadingProfile(false));
  }, [router, signIn, signOut, token, user]);

  if (!token) {
    return (
      <div className="container-page py-10">
        <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Нужно войти в аккаунт.
          <div className="mt-4">
            <Link href="/login" className="text-[hsl(var(--primary))] hover:underline">
              Войти
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loadingProfile && !user) {
    return (
      <div className="container-page py-10">
        <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] py-16 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Загружаем профиль…
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
            {user?.name ? `С возвращением, ${user.name}` : "Личный кабинет"}
          </h1>
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            Управляйте бронированиями, избранным и профилем.
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="inline-flex h-10 items-center justify-center rounded-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 text-sm font-semibold hover:bg-[hsl(var(--accent))]"
        >
          Выйти
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-card">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Профиль</div>
          <div className="mt-2 font-semibold">{user?.email ?? "—"}</div>
          <div className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
            Полный функционал профиля (аватар/телефон/редактирование) перенесём следующим шагом.
          </div>
        </div>
        <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-card">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Бронирования</div>
          <div className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
            Перенос server bookings/оплаты — после миграции остальных API методов.
          </div>
        </div>
        <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-card">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Избранное</div>
          <div className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
            Избранное перенесём вместе со стором туров и карточками (toggle save).
          </div>
        </div>
      </div>
    </div>
  );
}

