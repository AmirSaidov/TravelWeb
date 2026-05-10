import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/app";

export function AuthRoute({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const openAuthModal = useAppStore((s) => s.openAuthModal);

  useEffect(() => {
    openAuthModal(mode === "register" ? "register" : "login");
    const from = (location.state as any)?.from as string | undefined;
    navigate(from ?? "/", { replace: true });
  }, [mode, navigate, openAuthModal, location.state]);

  return null;
}

