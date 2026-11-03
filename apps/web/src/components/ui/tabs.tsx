"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({ value, onValueChange, className, children }: { value: string; onValueChange: (v: string) => void; className?: string; children: React.ReactNode }) {
  const ctx = React.useMemo(() => ({ value, setValue: onValueChange }), [value, onValueChange]);
  return <TabsContext.Provider value={ctx}>{children}</TabsContext.Provider>;
}

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { value, setValue } = useTabs();
  return (
    <div
      role="tablist"
      className={cn("inline-flex h-10 items-center justify-center rounded-lg border border-line bg-inset p-1", className)}
      {...props}
    >
      {React.Children.map(props.children, (child) => {
        if (!React.isValidElement(child)) return null;
        const childProps = child.props as { value?: string; className?: string };
        const selected = childProps.value === value;
        const classes = cn(
          "inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          selected ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
          childProps.className,
        );
        return React.cloneElement(child as React.ReactElement<any>, { className: classes, "aria-selected": selected, id: `tab-${childProps.value}`, role: "tab", "data-state": selected ? "active" : "inactive" });
      })}
    </div>
  );
}

export function TabsTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { value, setValue } = useTabs();
  const selected = value === props.value;
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${props.value}`}
      aria-selected={selected}
      data-state={selected ? "active" : "inactive"}
      tabIndex={selected ? 0 : -1}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        selected ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
        className,
      )}
      onClick={() => setValue(props.value)}
      {...props}
    />
  );
}

export function TabsContent({ value, children, className, ...props }: { value: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const { value: selected } = useTabs();
  const active = selected === value;
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      hidden={!active}
      className={className}
      {...props}
    >
      {active ? children : null}
    </div>
  );
}
