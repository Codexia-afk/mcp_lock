"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export default function TeamPage() {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/workspaces");
      const data = (await res.json()) as { memberships?: Array<{ userId: string; name: string; email: string; role: string }> };
      setMembers((data.memberships ?? []).map((m) => ({ userId: m.userId, name: m.name, email: m.email, role: m.role })));
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <SkeletonText lines={3} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Administration</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Team</h1>
        <p className="mt-2 text-muted">Members of this developer workspace.</p>
      </div>

      {members.length === 0 ? (
        <EmptyState title="No members" description="Invite teammates to collaborate on behavioral baselines." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-line">
              {members.map((m) => (
                <li key={m.userId} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <Avatar name={m.name} />
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-muted">{m.email}</p>
                  </div>
                  <span className="ml-auto rounded-full border border-line bg-inset px-2.5 py-0.5 text-xs font-medium text-muted">{m.role}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
