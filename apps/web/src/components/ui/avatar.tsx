import { cn } from "@/lib/utils";

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hues = [221, 265, 150, 25, 350];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const hue = hues[hash % hues.length];
  return (
    <span
      className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white", className)}
      style={{ backgroundColor: `hsl(${hue} 65% 42%)` }}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}
