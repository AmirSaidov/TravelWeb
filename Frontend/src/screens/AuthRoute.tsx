"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/app";

export function AuthRoute({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openAuthModal = useAppStore((s) => s.openAuthModal);

  useEffect(() => {
    openAuthModal(mode === "register" ? "register" : "login");
    const from = (searchParams.get("from") || "/").trim() || "/";
    router.replace(from);
  }, [mode, openAuthModal, router, searchParams]);

  return null;
}
