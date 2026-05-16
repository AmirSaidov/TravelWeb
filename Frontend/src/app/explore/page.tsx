"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Explore from "@/screens/Explore";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Explore />
    </Suspense>
  );
}
