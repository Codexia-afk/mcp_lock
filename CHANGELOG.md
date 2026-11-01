# Changelog

All notable changes to `mcp-lock` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`mcp-lock diff --json`** — machine-readable JSON diff report for CI and tooling.
  Emits a canonical report on stdout with `comparable`, `reasons`, `added`, `removed`,
  `addedCount`, `removedCount`, `autoApproveNarrower`, and a derived `status`
  (`pass`, `review`, or `incomplete`) plus the same exit-code contract as the text output
  (0 pass / 2 review required / 3 usage error / 4 incomplete evidence).
  - Why: the maintainer GitHub Action and downstream CI systems need structured output to
    surface capability-diff results; parsing human-readable CLI text is brittle.

- **`mcp-lock badge --json`** — machine-readable JSON badge/evidence report for CI and
  README automation.
  - Why: badge Markdown text is human-facing; CI can now consume structured counts.

- **`mcp-lock policy propose --json` and `mcp-lock policy assess --json`** — machine-readable
  JSON output for proposed/assessed policies, with pure-JSON stdout in `--json` mode.
  - Why: policy workflows need structured unapproved-capability results.

### Changed

- **Release version stamping** — the CLI version is now a linker-injectable variable
  (`var version = "0.1.0-dev"`) instead of a hardcoded constant, enabling builds such as
  `go build -ldflags "-X main.version=0.2.0" -o bin/mcp-lock ./cmd/mcp-lock`.
  - Why: releases and CI artifacts previously always reported `0.1.0-dev`; version must be
    injectable at release time.

- **Maintainer GitHub Action** (`.github/actions/mcp-lock/action.yml`) now consumes
  `mcp-lock diff --json` and populates the previously declared-but-unused `added-count`
  output. The step summary now renders the JSON diff report.
  - Why: the `added-count` output was documented but never written; CI workflows consuming
    it received an empty value.

## [0.1.0] - 2026-11-02

- Initial open-source implementation of the author-side behavioral trust wedge:
  threat model, canonical schemas, MCP protocol harness, auto-generated scenarios, npx/uvx
  wrapping, OS observation, canonical `behavior.lock`, semantic diff with
  `--auto-approve-narrower`, release-gate fixture pair, GitHub Action, trust badge, and
  empirical study report.
