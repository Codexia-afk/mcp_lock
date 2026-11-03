"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Apple, Linux, Windows } from "@/components/icons/brand-icons";

const OS_TABS = [
  { id: "macos", label: "macOS", icon: Apple },
  { id: "linux", label: "Linux", icon: Linux },
  { id: "windows", label: "Windows", icon: Windows },
] as const;

type OsType = (typeof OS_TABS)[number]["id"];

export function InstallTabs() {
  const [os, setOs] = React.useState<OsType>("macos");

  return (
    <div className="mt-12">
      <div role="tablist" aria-label="Installation platform" className="inline-flex h-10 items-center rounded-lg border border-line bg-inset p-1">
        {OS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={os === tab.id}
            id={`os-tab-${tab.id}`}
            aria-controls={`os-panel-${tab.id}`}
            tabIndex={os === tab.id ? 0 : -1}
            onClick={() => setOs(tab.id)}
            className={`inline-flex h-8 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              os === tab.id ? "bg-surface text-ink shadow-sm" : "text-muted"
            }`}
          >
            <tab.icon className="size-4" aria-hidden="true" /> {tab.label}
          </button>
        ))}
      </div>

      {os === "macos" ? <MacosPanel /> : null}
      {os === "linux" ? <LinuxPanel /> : null}
      {os === "windows" ? <WindowsPanel /> : null}
    </div>
  );
}

function MacosPanel() {
  return (
    <div id="os-panel-macos" role="tabpanel" aria-labelledby="os-tab-macos" className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">macOS</h2>
        <p className="mt-2 text-muted">Apple Silicon and Intel Macs run scans through a Linux container engine.</p>
        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">Prerequisites</h3>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted">
          <li>Go 1.26+ (optional — prebuilt binaries are planned).</li>
          <li>Docker Desktop with Linux container engine.</li>
          <li>macOS 12+ recommended.</li>
        </ul>
        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">Verify</h3>
        <pre className="overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`docker info --format "{{.OSType}} {{.ServerVersion}}"
mcp-lock doctor`}</pre>
        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">First observation</h3>
        <pre className="overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`mcp-lock observe -- npx -y @modelcontextprotocol/server-everything`}</pre>
        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">Troubleshooting</h3>
        <div className="rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <AlertTriangle className="size-4 text-warning" /> Docker daemon connectivity
          </p>
          <p className="mt-2 text-muted">
            Ensure Docker Desktop is running and set to use the Linux VM. macOS-hosted Linux containers observe Linux-container behavior, not native macOS syscalls.
          </p>
        </div>
      </section>
      <aside className="h-fit lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <h3 className="font-semibold">Next steps</h3>
          <ol className="mt-3 list-decimal space-y-1.5 pl-6 text-sm text-muted">
            <li>
              Read the <a className="text-primary hover:underline" href="/docs/macos">macOS setup guide</a>.
            </li>
            <li>
              Run <code className="font-mono">mcp-lock doctor</code> and confirm <code className="font-mono">status: ready</code>.
            </li>
            <li>
              Continue to <a className="text-primary hover:underline" href="/docs/first-scan">your first scan</a>.
            </li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

function LinuxPanel() {
  return (
    <div id="os-panel-linux" role="tabpanel" aria-labelledby="os-tab-linux" className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Linux</h2>
        <p className="mt-2 text-muted">Native Linux hosts observe behavior through a Linux container engine.</p>
        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">Prerequisites</h3>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted">
          <li>Docker Engine with the Linux daemon.</li>
          <li>Docker group membership for the CLI user.</li>
          <li>Go 1.26+ if building from source.</li>
        </ul>
        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">Verify</h3>
        <pre className="overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`docker info --format "{{.OSType}} {{.ServerVersion}}"
mcp-lock doctor`}</pre>
        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">First observation</h3>
        <pre className="overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`mcp-lock observe -- npx -y @modelcontextprotocol/server-everything`}</pre>
        <div className="mt-6 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <AlertTriangle className="size-4 text-warning" /> Docker group membership
          </p>
          <p className="mt-2 text-muted">
            Grant the Docker group explicitly rather than broad host permissions; the container boundary shares the host kernel.
          </p>
        </div>
      </section>
      <aside className="h-fit lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <h3 className="font-semibold">Next steps</h3>
          <ol className="mt-3 list-decimal space-y-1.5 pl-6 text-sm text-muted">
            <li>
              Read the <a className="text-primary hover:underline" href="/docs/linux">Linux setup guide</a>.
            </li>
            <li>
              Continue to <a className="text-primary hover:underline" href="/docs/first-scan">your first scan</a>.
            </li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

function WindowsPanel() {
  return (
    <div id="os-panel-windows" role="tabpanel" aria-labelledby="os-tab-windows" className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Windows</h2>
        <p className="mt-2 text-muted">Windows scans run through WSL2 or Docker Desktop with a Linux container engine.</p>
        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">Prerequisites</h3>
        <ul className="list-decimal pl-6 text-sm text-muted">
          <li>Windows 10/11.</li>
          <li>WSL2 or Docker Desktop (Linux mode).</li>
          <li>Go 1.26+ if building from source.</li>
        </ul>
        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">First observation</h3>
        <pre className="overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`mcp-lock observe -- npx -y @modelcontextprotocol/server-everything`}</pre>
        <div className="mt-6 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <AlertTriangle className="size-4 text-warning" /> WSL filesystem paths
          </p>
          <p className="mt-2 text-muted">Use Linux-style paths inside WSL2; Windows-native filesystem paths are not observed.</p>
        </div>
      </section>
      <aside className="h-fit lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <h3 className="font-semibold">Next steps</h3>
          <ol className="mt-3 list-decimal space-y-1.5 pl-6 text-sm text-muted">
            <li>
              Read the <a className="text-primary hover:underline" href="/docs/windows">Windows setup guide</a>.
            </li>
            <li>
              Continue to <a className="text-primary hover:underline" href="/docs/first-scan">your first scan</a>.
            </li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

