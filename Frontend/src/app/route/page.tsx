"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import RoutePage from "@/screens/RoutePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RoutePage />
    </Suspense>
  );
}
