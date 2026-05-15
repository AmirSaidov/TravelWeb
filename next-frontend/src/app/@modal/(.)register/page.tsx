"use client";

import { useRouter } from "next/navigation";
import { RegisterCard } from "@/components/auth/RegisterCard";
import { Modal } from "@/components/ui/Modal";

export default function RegisterModalPage() {
  const router = useRouter();

  return (
    <Modal title="Регистрация" onClose={() => router.back()}>
      <RegisterCard variant="plain" />
    </Modal>
  );
}
