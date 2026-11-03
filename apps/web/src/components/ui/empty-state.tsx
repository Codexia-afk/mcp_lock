import { cn } from "@/lib/utils";

export function EmptyState({ icon, title, description, action, className }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center", className)}>
      {icon ? <div className="flex size-12 items-center justify-center rounded-full bg-inset text-muted">{icon}</div> : null}
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? <p className="mt-1 max-w-md text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
