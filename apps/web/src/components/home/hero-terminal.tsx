"use client";

import * as React from "react";
import { Play, RotateCcw, Check, Copy } from "lucide-react";
import { Terminal } from "@/components/icons/brand-icons";

const DEMO_STEPS = [
  {
    cmd: "$ mcp-lock doctor",
    output: [
      "host: darwin/arm64",
      "Docker daemon: linux 29.8.2",
      "status: ready (protocol checks and OS observer available)",
      "backends: docker-strace-linux-v1, emulated-tracer-v1",
    ],
  },
  {
    cmd: "$ mcp-lock observe -- npx -y @modelcontextprotocol/server-filesystem /tmp",
    output: [
      "==> Synthesizing isolated container with non-root UID 65532:65532...",
      "==> Container digest: sha256:9f2c1a4b7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a",
      "==> Running MCP tool scenarios under docker-strace-linux-v1...",
      "==> Capturing OS events: 3 filesystem reads, 0 network connects, 0 spawned processes",
      "==> Emitted canonical behavior.lock (evidenceDigest: sha256:7b1e4c9a...)",
    ],
  },
  {
    cmd: "$ mcp-lock diff --from baseline.lock --to candidate.lock --auto-approve-narrower",
    output: [
      "Checking behavioral compatibility...",
      "  - Protocol match: 2026-07-28 stdio [OK]",
      "  - Test suite match: sha256:4d8a... [OK]",
      "  - Environment match: linux/amd64 [OK]",
      "",
      "[PASS] Auto-approved narrower: 0 added operations, 1 removed operation.",
      "Exit code: 0",
    ],
  },
];

export function HeroTerminal() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const current = DEMO_STEPS[activeStep];

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % DEMO_STEPS.length);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(current.cmd.replace(/^\$\s*/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-[#0c1017] shadow-2xl ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#ff5f56]" />
          <span className="size-3 rounded-full bg-[#ffbd2e]" />
          <span className="size-3 rounded-full bg-[#27c93f]" />
          <span className="ml-2 font-mono text-xs text-white/50">terminal — mcp-lock v0.1.0</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
            title="Copy command"
          >
            {copied ? <Check className="size-3 text-signal" /> : <Copy className="size-3" />}
            <span className="font-mono">{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/10 bg-[#090d14] px-4 py-2 text-xs">
        {DEMO_STEPS.map((step, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveStep(idx)}
            className={`mr-3 rounded px-2.5 py-1 font-mono transition-colors ${
              activeStep === idx
                ? "bg-primary text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            Step {idx + 1}
          </button>
        ))}
      </div>

      <div className="min-h-[260px] p-5 font-mono text-[13px] leading-relaxed text-[#dbe4ee]">
        <div className="flex items-center gap-2 text-signal">
          <span>{current.cmd}</span>
        </div>
        <div className="mt-3 space-y-1">
          {current.output.map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith("[PASS]")
                  ? "font-semibold text-signal"
                  : line.startsWith("==")
                    ? "text-[#8bb2ff]"
                    : line.startsWith("  -")
                      ? "text-[#a0aec0]"
                      : "text-[#cbd5e1]"
              }
            >
              {line || "\u00A0"}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-[#090d14] p-3 text-xs">
        <span className="font-mono text-white/50">Step {activeStep + 1} of {DEMO_STEPS.length}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-semibold text-white transition hover:bg-primary-hover"
          >
            <Play className="size-3" /> Next step
          </button>
        </div>
      </div>
    </div>
  );
}

