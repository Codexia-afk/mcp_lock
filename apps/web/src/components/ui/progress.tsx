import { cn } from "@/lib/utils";

export function Progress({ value, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: number }) {
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} className={cn("h-2 w-full overflow-hidden rounded-full bg-inset", className)} {...props}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
