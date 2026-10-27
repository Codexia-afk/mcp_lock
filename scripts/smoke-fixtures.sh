#!/bin/sh
# Protocol-only smoke test. It does not observe OS events or verify a policy.
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"

docker build -f fixtures/echo-server/Dockerfile --build-arg VERSION=baseline -t mcp-lock-echo:baseline .
docker build -f fixtures/echo-server/Dockerfile --build-arg VERSION=changed -t mcp-lock-echo:changed .
baseline_id=$(docker image inspect mcp-lock-echo:baseline --format '{{.Id}}')
changed_id=$(docker image inspect mcp-lock-echo:changed --format '{{.Id}}')

run_dir=$(mktemp -d)
run_dir=$(CDPATH= cd -- "$run_dir" && pwd -P)
trap 'rm -rf "$run_dir"' EXIT HUP INT TERM
go build -o "$run_dir/mcp-lock" ./cmd/mcp-lock
mkdir "$run_dir/approved"
cp fixtures/data/public.txt "$run_dir/approved/public.txt"
chmod 755 "$run_dir/approved"
chmod 644 "$run_dir/approved/public.txt"

python3 - "$repo_root" "$run_dir" "$baseline_id" "$changed_id" <<'PY'
import json
import pathlib
import sys

repo, output, baseline, changed = sys.argv[1:]
output = pathlib.Path(output)
for version, image in [('baseline', baseline), ('changed', changed)]:
    for fixture_dir, suffix in [(pathlib.Path(repo) / 'fixtures/data', 'full'), (output / 'approved', 'approved')]:
        config = {
            'schemaVersion': '1',
            'image': image,
            'entrypoint': ['/app/server'],
            'protocolMode': 'modern',
            'fixtureMounts': [{'source': str(fixture_dir), 'target': '/fixtures'}],
            'scenarios': [{'name': 'read', 'tool': 'read_fixture', 'arguments': {}, 'expectText': 'public response\n'}],
        }
        (output / f'{version}-{suffix}.json').write_text(json.dumps(config))
PY

"$run_dir/mcp-lock" scenario check --config "$run_dir/baseline-full.json"
"$run_dir/mcp-lock" scenario check --config "$run_dir/changed-full.json"
"$run_dir/mcp-lock" scenario check --config "$run_dir/baseline-approved.json"

set +e
"$run_dir/mcp-lock" scenario check --config "$run_dir/changed-approved.json"
changed_status=$?
set -e
if [ "$changed_status" -ne 6 ]; then
  echo "Expected changed fixture to fail with scenario exit code 6; got $changed_status" >&2
  exit 1
fi
echo "Fixture smoke test passed: identical MCP responses; extra read fails without secret mount."
