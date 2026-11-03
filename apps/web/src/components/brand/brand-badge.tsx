"use client";

import * as React from "react";
import { Terminal } from "@/components/icons/brand-icons";
import { cn } from "@/lib/utils";

export interface BrandBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

/**
 * Adaptive MCP-Lock Terminal Brand Badge.
 * - Light Mode: Crisp white badge with clean border and rich terminal green icon.
 * - Dark Mode: Deep obsidian slate badge with subtle border and glowing neon lime-green icon.
 * Smoothly transitions when users toggle between light and dark themes.
 */
export function BrandBadge({ className, size = "md" }: BrandBadgeProps) {
  const sizeClasses = size === "sm" ? "size-7 rounded-md" : "size-8 rounded-lg";
  const iconSizeClasses = size === "sm" ? "size-3.5" : "size-4";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center transition-all duration-200",
        "bg-white border border-line shadow-sm text-[#15803d]",
        "dark:bg-[#151d28] dark:border-white/10 dark:text-signal dark:shadow-[0_0_12px_rgba(184,245,104,0.12)]",
        sizeClasses,
        className,
      )}
      aria-hidden="true"
    >
      <Terminal className={iconSizeClasses} aria-hidden="true" />
    </span>
  );
}

export function BrandLogo({ className, size = "md" }: BrandBadgeProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandBadge size={size} />
      <span className="text-lg font-bold tracking-tight text-ink transition-colors duration-200">
        mcp-lock
      </span>
    </div>
  );
}
