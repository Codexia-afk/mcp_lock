import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "neutral" | "primary" | "success" | "warning" | "critical" | "info" }) {
  const variants: Record<string, string> = {
    neutral: "border-line bg-surface text-muted",
    primary: "border-primary/30 bg-primary-soft text-primary-hover",
    success: "border-signal/40 bg-signal/10 text-[#2f7a1e]",
    warning: "border-warning/40 bg-warning-soft text-[#92610f]",
    critical: "border-critical/40 bg-critical-soft text-critical",
    info: "border-primary/30 bg-primary-soft text-primary-hover",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const colors = {
    pass: "bg-signal",
    allowed: "bg-signal",
    complete: "bg-signal",
    review: "bg-warning",
    denied: "bg-critical",
    incomplete: "bg-warning",
    error: "bg-critical",
  } as const;
  return <span className={cn("inline-block size-2 rounded-full", colors[status as keyof typeof colors] ?? "bg-muted", className)} aria-hidden="true" />;
}
