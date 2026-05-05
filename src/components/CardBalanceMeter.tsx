import { cn } from "@/lib/utils";

type Props = {
  remaining: number;
  total: number;
  size?: "sm" | "lg";
  className?: string;
};

function getColor(ratio: number) {
  if (ratio <= 0.2) return { bar: "bg-rose-600", text: "text-rose-700", label: "מומלץ לחדש" };
  if (ratio <= 0.5) return { bar: "bg-cocoa-400", text: "text-cocoa-700", label: "באמצע" };
  return { bar: "bg-emerald-500", text: "text-emerald-700", label: "תקין" };
}

export function CardBalanceMeter({ remaining, total, size = "sm", className }: Props) {
  const safeTotal = Math.max(total, 1);
  const ratio = Math.max(0, Math.min(1, remaining / safeTotal));
  const color = getColor(ratio);
  const big = size === "lg";

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between">
        <span className={cn("font-medium", big ? "text-lg" : "text-sm", color.text)}>
          {remaining === 0
            ? "הכרטיסייה הסתיימה"
            : `נשארו ${remaining} מתוך ${total} שיעורים`}
        </span>
        {!big && (
          <span className="text-xs text-cocoa-400">{color.label}</span>
        )}
      </div>
      <div
        className={cn(
          "mt-2 w-full overflow-hidden rounded-full bg-cocoa-100",
          big ? "h-4" : "h-2.5",
        )}
        role="progressbar"
        aria-valuenow={remaining}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className={cn("h-full rounded-full transition-all", color.bar)}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
