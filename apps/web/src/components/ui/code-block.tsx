"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function CodeBlock({ code, language, className, showCopy = true }: { code: string; language?: string; className?: string; showCopy?: boolean }) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };
  return (
    <div className={className}>
      {showCopy ? (
        <div className="relative">
          <button
            type="button"
            onClick={onCopy}
            aria-label="Copy code to clipboard"
            className="absolute right-2 top-2 rounded-md border border-line bg-surface/80 p-1.5 text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
          <pre className="overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] leading-relaxed text-[#dbe4ee]">
            <code>{code}</code>
          </pre>
        </div>
      ) : (
        <pre className="overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] leading-relaxed text-[#dbe4ee]">
          <code>{code}</code>
        </pre>
      )}
      {language ? <div className="mt-2 font-mono text-xs text-muted">{language}</div> : null}
    </div>
  );
}
