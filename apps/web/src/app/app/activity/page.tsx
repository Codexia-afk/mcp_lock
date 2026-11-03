"use client";

import * as React from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

interface AuditEvent {
  id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export default function ActivityPage() {
  const [events, setEvents] = React.useState<AuditEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/activity");
      const data = (await res.json()) as { events?: AuditEvent[] };
      setEvents(data.events ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <SkeletonText lines={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Administration</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Activity</h1>
        <p className="mt-2 text-muted">Audit history for workspace actions.</p>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No activity yet" description="Workspace actions will appear here." />
      ) : (
        <div className="rounded-xl border border-line bg-surface shadow-sm">
          <ul className="divide-y divide-line">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <ActivityIcon className="size-4 text-primary" aria-hidden="true" />
                <span className="font-mono text-xs">{e.action}</span>
                {e.targetType ? <span className="text-muted">target: {e.targetType} {e.targetId}</span> : null}
                <span className="ml-auto text-xs text-muted">{new Date(e.createdAt).toISOString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
