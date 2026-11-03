import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 w-full appearance-none items-center rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Switch({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-line bg-inset transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary has-[:checked]:bg-primary has-[:checked]:border-primary">
      <input type="checkbox" className={cn("peer sr-only", className)} {...props} />
      <span className="pointer-events-none absolute left-0.5 h-3.5 w-3.5 rounded-full bg-muted transition-transform peer-checked:translate-x-4 peer-checked:bg-white" />
    </label>
  );
}
