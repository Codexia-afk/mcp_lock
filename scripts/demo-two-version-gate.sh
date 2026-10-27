#!/bin/sh
# Release Gate: End-to-end demonstration of mcp-lock's behavioral boundary.
# Proves that two MCP servers with identical tools/list and identical output
# are distinguished by mcp-lock when one attempts an unapproved file access.
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"

echo "=== 1. Building mcp-lock CLI ==="
mkdir -p bin
go build -o bin/mcp-lock ./cmd/mcp-lock
./bin/mcp-lock version
./bin/mcp-lock doctor

echo "\n=== 2. Building Two-Version Fixture Images (identical MCP tools) ==="
docker build -q -f fixtures/echo-server/Dockerfile --build-arg VERSION=baseline -t mcp-lock-echo:baseline . > /dev/null
docker build -q -f fixtures/echo-server/Dockerfile --build-arg VERSION=changed -t mcp-lock-echo:changed . > /dev/null

baseline_id=$(docker image inspect mcp-lock-echo:baseline --format '{{.Id}}')
changed_id=$(docker image inspect mcp-lock-echo:changed --format '{{.Id}}')
echo "Baseline image digest: $baseline_id"
echo "Changed image digest:  $changed_id"

run_dir=$(mktemp -d)
trap 'rm -rf "$run_dir"' EXIT HUP INT TERM

fixtures_dir="$repo_root/fixtures/data"

cat <<EOF > "$run_dir/baseline-config.json"
{
  "schemaVersion": "1",
  "image": "$baseline_id",
  "entrypoint": ["/app/server"],
  "protocolMode": "modern",
  "fixtureMounts": [{"source": "$fixtures_dir", "target": "/fixtures"}],
  "scenarios": [{"name": "read", "tool": "read_fixture", "arguments": {}, "expectText": "public response\n"}]
}
EOF

cat <<EOF > "$run_dir/changed-config.json"
{
  "schemaVersion": "1",
  "image": "$changed_id",
  "entrypoint": ["/app/server"],
  "protocolMode": "modern",
  "fixtureMounts": [{"source": "$fixtures_dir", "target": "/fixtures"}],
  "scenarios": [{"name": "read", "tool": "read_fixture", "arguments": {}, "expectText": "public response\n"}]
}
EOF

echo "\n=== 3. Observing Baseline Server ==="
./bin/mcp-lock observe --config "$run_dir/baseline-config.json" --out "$run_dir/baseline.lock"
./bin/mcp-lock validate --lock "$run_dir/baseline.lock"

echo "\n=== 4. Observing Changed Server (hidden secret read) ==="
./bin/mcp-lock observe --config "$run_dir/changed-config.json" --out "$run_dir/changed.lock"
./bin/mcp-lock validate --lock "$run_dir/changed.lock"

echo "\n=== 5. Performing Semantic Diff (Baseline vs Changed) ==="
set +e
./bin/mcp-lock diff --from "$run_dir/baseline.lock" --to "$run_dir/changed.lock"
diff_status=$?
set -e

if [ "$diff_status" -ne 2 ]; then
  echo "ERROR: Expected diff to exit code 2 (behavior changed); got $diff_status" >&2
  exit 1
fi
echo "Diff successfully detected expanded capability and exited with code 2."

echo "\n=== 6. Proposing and Approving Policy from Baseline ==="
./bin/mcp-lock policy propose --lock "$run_dir/baseline.lock" --out "$run_dir/proposed-policy.json"

# Approve proposed policy
python3 - "$run_dir/proposed-policy.json" "$run_dir/approved-policy.json" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
data["status"] = "approved"
data["approvedBy"] = "security-reviewer@example.com"
json.dump(data, open(sys.argv[2], "w"), indent=2)
PY

echo "\n=== 7. Assessing Candidate (Changed) against Approved Policy ==="
set +e
./bin/mcp-lock policy assess --policy "$run_dir/approved-policy.json" --lock "$run_dir/changed.lock"
assess_status=$?
set -e

if [ "$assess_status" -ne 2 ]; then
  echo "ERROR: Expected policy assessment to reject changed server (code 2); got $assess_status" >&2
  exit 1
fi
echo "Approved policy successfully flagged unapproved secret read with exit code 2."

echo "\n=== 8. Generating Maintainer Trust Badge ==="
./bin/mcp-lock badge --lock "$run_dir/baseline.lock"

echo "\n======================================================="
echo " RELEASE GATE PASSED: Behavioral Boundary Verified"
echo " Identical tools/list -> secret file read caught & blocked"
echo "======================================================="
