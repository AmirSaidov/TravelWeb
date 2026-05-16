"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { AuthRoute } from "@/screens/AuthRoute";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AuthRoute mode="register" />
    </Suspense>
  );
}
