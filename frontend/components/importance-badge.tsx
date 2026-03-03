import { cn } from "@/lib/utils";

interface ImportanceBadgeProps {
  score: number;
  className?: string;
}

export function ImportanceBadge({ score, className }: ImportanceBadgeProps) {
  const getColor = (s: number) => {
    if (s >= 9) return "bg-importance-critical/20 text-importance-critical border-importance-critical/30";
    if (s >= 7) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    if (s >= 5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-white/10 text-white/50 border-white/10";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        getColor(score),
        className
      )}
    >
      {score}/10
    </span>
  );
}
