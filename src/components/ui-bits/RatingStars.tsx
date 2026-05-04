import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const RatingStars = ({ value, size = 14, showValue = true, className }: { value: number; size?: number; showValue?: boolean; className?: string }) => (
  <div className={cn("inline-flex items-center gap-1", className)}>
    <Star className="fill-gold text-gold" style={{ width: size, height: size }} />
    {showValue && <span className="text-sm font-semibold">{value.toFixed(value >= 5 ? 1 : 2).replace(/\.0$/, ".0")}</span>}
  </div>
);
