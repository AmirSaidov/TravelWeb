import { useTranslation } from "react-i18next";
import { AuthForm } from "@/pages/Auth";
import { useAppStore } from "@/store/app";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AuthModal() {
  const { t } = useTranslation();
  const { open, mode } = useAppStore((s) => s.authModal);
  const close = useAppStore((s) => s.closeAuthModal);
  const openAuthModal = useAppStore((s) => s.openAuthModal);

  const title = mode === "login" ? t("auth.signin") : t("auth.signup");

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? openAuthModal(mode) : close())}>
      <DialogContent className="max-h-[min(80vh,640px)] w-[min(440px,calc(100vw-1.25rem))] overflow-y-auto rounded-3xl p-0">
        <DialogHeader className="border-b border-border px-6 py-4 text-center">
          <DialogTitle className="text-base font-semibold">{t("auth.modalTitle")}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-6 sm:px-8">
          <div className="mb-6 text-center">
            <div className="font-display text-2xl font-semibold leading-tight">{title}</div>
          </div>
          <AuthForm mode={mode} onSuccess={close} variant="modal" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
