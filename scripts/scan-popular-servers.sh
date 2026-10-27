#!/bin/sh
# scan-popular-servers.sh
# Demonstrates how mcp-lock automatically wraps and audits popular MCP server packages.
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"

mkdir -p bin
go build -o bin/mcp-lock ./cmd/mcp-lock

echo "=== Popular MCP Servers Behavioral Audit Scanner ==="
echo "Testing automated wrapping, scenario synthesis, and observation."

# Example target: server-everything (clean reference server)
echo "\nScanning @modelcontextprotocol/server-everything..."
if [ "${1:-}" = "--live" ]; then
  ./bin/mcp-lock observe -- npx -y @modelcontextprotocol/server-everything
  ./bin/mcp-lock badge --lock behavior.lock
else
  echo "Dry-run mode (use --live to execute full docker container build and observation)."
  echo "Command: ./bin/mcp-lock observe -- npx -y @modelcontextprotocol/server-everything"
  echo "Verified report available in: docs/reports/POPULAR_MCP_SERVERS_REPORT.md"
fi
