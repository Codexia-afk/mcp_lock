"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AccordionProps = {
  type?: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string;
  onValueChange?: (value: string | undefined) => void;
  className?: string;
  children?: React.ReactNode;
};

export function Accordion({ type = "single", collapsible = true, defaultValue, onValueChange, className, ...props }: AccordionProps & React.HTMLAttributes<HTMLDivElement>) {
  const isMultiple = type === "multiple";
  const [openValues, setOpenValues] = React.useState<Set<string>>(new Set(defaultValue ? [defaultValue] : []));
  const open = isMultiple ? openValues : openValues.size > 0 ? openValues : new Set<string>();

  const toggle = (v: string) => {
    const isOpenNow = open.has(v);
    let next: Set<string>;
    if (isMultiple) {
      next = new Set(openValues);
      if (next.has(v)) {
        next.delete(v);
      } else {
        next.add(v);
      }
    } else {
      next = new Set<string>();
      if (!isOpenNow || !collapsible) {
        next.add(v);
      }
    }
    setOpenValues(next);
    const nextValue = next.size > 0 ? Array.from(next)[0] : undefined;
    onValueChange?.(nextValue);
  };

  const ctx = React.useMemo(() => ({ isOpen: (v: string) => open.has(v), toggle }), [open]);

  return (
    <AccordionContext.Provider value={ctx}>
      <div className={cn("divide-y divide-line", className)} {...props} />
    </AccordionContext.Provider>
  );
}

interface AccordionContextValue {
  isOpen: (v: string) => boolean;
  toggle: (v: string) => void;
}
const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export function AccordionItem({ value, className, children, ...props }: { value: string; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(AccordionContext);
  const isOpen = ctx?.isOpen(value) ?? false;
  const panelId = `accordion-panel-${value}`;
  const triggerId = `accordion-trigger-${value}`;
  return (
    <div className={cn("border-b border-line last:border-b-0", className)} {...props}>
      <AccordionHeader value={value} open={isOpen} triggerId={triggerId} panelId={panelId}>
        {children}
      </AccordionHeader>
      {isOpen ? (
        <div id={panelId} role="region" aria-labelledby={triggerId} className="pb-5 pr-8">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function AccordionHeader({ value, open, triggerId, panelId, children, ...props }: { value: string; open: boolean; triggerId: string; panelId: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(AccordionContext);
  return (
    <button
      type="button"
      id={triggerId}
      aria-expanded={open}
      aria-controls={panelId}
      className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-ink transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none"
      onClick={() => ctx?.toggle(value)}
      {...props}
    >
      <span>{children}</span>
      <span aria-hidden="true" className={cn("inline-block text-muted transition-transform duration-300", open && "rotate-180")}>▾</span>
    </button>
  );
}
