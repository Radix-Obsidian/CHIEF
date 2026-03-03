import { cn } from "@/lib/utils";

interface ImportanceBadgeProps {
  score: number;
  className?: string;
}

export function ImportanceBadge({ score, className }: ImportanceBadgeProps) {
  const getStyle = (s: number) => {
    if (s >= 9) return "bg-importance-critical/10 text-importance-critical";
    if (s >= 7) return "bg-importance-high/10 text-importance-high";
    if (s >= 5) return "bg-importance-medium/10 text-importance-medium";
    return "bg-chief-surface text-chief-text-muted";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
        getStyle(score),
        className
      )}
    >
      {score}
    </span>
  );
}
