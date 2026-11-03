import * as React from "react";
import { cn } from "@/lib/utils";

export function Alert({ variant = "info", className, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "info" | "success" | "warning" | "critical" }) {
  const styles = {
    info: "border-primary/30 bg-primary-soft text-ink",
    success: "border-signal/40 bg-signal/10 text-ink",
    warning: "border-warning/40 bg-warning-soft text-ink",
    critical: "border-critical/40 bg-critical-soft text-ink",
  } as const;
  return <div role="alert" className={cn("rounded-lg border p-4 text-sm", styles[variant], className)} {...props} />;
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("mb-1 font-semibold", className)} {...props} />;
}
export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm opacity-90", className)} {...props} />;
}
