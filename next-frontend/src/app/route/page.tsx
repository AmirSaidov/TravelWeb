import { Suspense } from "react";
import { RouteClient } from "@/components/route/RouteClient";

export default function RoutePage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-10">
          <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] py-16 text-center text-sm text-[hsl(var(--muted-foreground))]">
            Loading route…
          </div>
        </div>
      }
    >
      <RouteClient />
    </Suspense>
  );
}

