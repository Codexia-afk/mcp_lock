"use client";

import * as React from "react";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { useTheme, type Theme } from "./theme-provider";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: Array<{
  value: Theme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    value: "system",
    label: "System",
    icon: Laptop,
    description: "Follows your operating system theme settings.",
  },
  {
    value: "light",
    label: "Light",
    icon: Sun,
    description: "Crisp white background with high-contrast text.",
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
    description: "Deep obsidian palette engineered for low light.",
  },
];

/**
 * Tactical sliding pill toggle switch between Light and Dark mode.
 * Features animated sliding knob, subtle track icons, and keyboard accessibility.
 */
export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme (currently ${theme})`}
      onClick={toggleTheme}
      className={cn(
        "group relative inline-flex h-8 w-15 shrink-0 cursor-pointer items-center rounded-full border border-line bg-inset p-1 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      {/* Background Track Icons */}
      <span className="pointer-events-none absolute inset-x-1.5 flex items-center justify-between px-0.5">
        <Sun
          className={cn(
            "size-3.5 transition-all duration-200",
            !isDark ? "text-amber-500 opacity-90 scale-100" : "text-muted opacity-40 scale-90",
          )}
          aria-hidden="true"
        />
        <Moon
          className={cn(
            "size-3.5 transition-all duration-200",
            isDark ? "text-primary opacity-90 scale-100" : "text-muted opacity-40 scale-90",
          )}
          aria-hidden="true"
        />
      </span>

      {/* Sliding Knob */}
      <span
        className={cn(
          "pointer-events-none flex size-6 items-center justify-center rounded-full border border-line/50 bg-surface shadow-sm transition-transform duration-200 ease-out",
          isDark ? "translate-x-7 text-primary" : "translate-x-0 text-amber-500",
        )}
      >
        {isDark ? (
          <Moon className="size-3.5 transition-transform duration-200 rotate-0" aria-hidden="true" />
        ) : (
          <Sun className="size-3.5 transition-transform duration-200 rotate-0" aria-hidden="true" />
        )}
      </span>
    </button>
  );
}

/**
 * 1-click icon toggle button with smooth rotating Sun / Moon transition.
 * Clicking directly flips between light and dark themes.
 */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme (currently ${theme})`}
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink transition-colors hover:bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      <Sun
        className={cn(
          "size-4 text-amber-500 transition-all duration-300",
          isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
        )}
        aria-hidden="true"
      />
      <Moon
        className={cn(
          "absolute size-4 text-primary transition-all duration-300",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0",
        )}
        aria-hidden="true"
      />
    </button>
  );
}

/**
 * Interactive Theme Toggle with direct 1-click flip on the main button,
 * plus an optional dropdown menu to switch back to System Default.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDark = resolvedTheme === "dark";

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleDirectToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div ref={containerRef} className={cn("relative inline-flex items-center", className)}>
      {/* Primary Toggle Switch */}
      <ThemeSwitch />

      {/* Small subtle menu trigger to access System mode if desired */}
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        aria-label="Theme options (System default, Light, Dark)"
        className="ml-1 inline-flex size-6 items-center justify-center rounded text-muted hover:bg-inset hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="sr-only">Theme menu</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-3.5"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {menuOpen && (
        <div
          role="menu"
          aria-label="Theme selection"
          className="absolute right-0 top-full z-50 mt-2 w-48 origin-top-right rounded-xl border border-line bg-surface p-1.5 shadow-lg ring-1 ring-black/5 animate-fade-down focus:outline-none"
        >
          <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Appearance
          </div>
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(option.value);
                  setMenuOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-primary-soft text-primary font-semibold"
                    : "text-ink hover:bg-inset hover:text-ink",
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4" aria-hidden="true" />
                  <span>{option.label}</span>
                </span>
                {isSelected && <Check className="size-3.5 text-primary" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * 3-option visual radio cards for settings pages.
 */
export function ThemeSegmented({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Select color theme"
      className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3", className)}
    >
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
              isSelected
                ? "border-primary bg-primary-soft/40 shadow-sm ring-1 ring-primary"
                : "border-line bg-surface hover:border-ink/20 hover:bg-inset",
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg",
                  isSelected ? "bg-primary text-white" : "bg-inset text-ink",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              {isSelected && <Check className="size-4 text-primary" aria-hidden="true" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{option.label}</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">{option.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
