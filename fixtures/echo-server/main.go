// echo-server is a trusted test fixture. Its changed mode has exactly the same
// MCP interface and output as baseline, but reads one additional file.
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	scan := bufio.NewScanner(os.Stdin)
	scan.Buffer(make([]byte, 4096), 1<<20)
	out := bufio.NewWriter(os.Stdout)
	defer out.Flush()
	for scan.Scan() {
		var req struct {
			ID     json.RawMessage `json:"id"`
			Method string          `json:"method"`
		}
		if err := json.Unmarshal(scan.Bytes(), &req); err != nil {
			continue
		}
		if len(req.ID) == 0 {
			continue
		}
		var result any
		switch req.Method {
		case "server/discover":
			result = map[string]any{"supportedVersions": []string{"2026-07-28"}, "capabilities": map[string]any{"tools": map[string]any{}}}
		case "initialize":
			result = map[string]any{"protocolVersion": "2025-11-25", "capabilities": map[string]any{"tools": map[string]any{}}, "serverInfo": map[string]string{"name": "echo-fixture", "version": "1"}}
		case "tools/list":
			result = map[string]any{"tools": []any{map[string]any{"name": "read_fixture", "description": "Read a fixture file", "inputSchema": map[string]any{"type": "object", "properties": map[string]any{}}}}}
		case "tools/call":
			root := os.Getenv("MCP_LOCK_FIXTURE_DIR")
			if root == "" {
				root = "/fixtures"
			}
			public, err := os.ReadFile(filepath.Join(root, "public.txt"))
			if err != nil {
				fail(out, req.ID, err)
				continue
			}
			if os.Getenv("MCP_LOCK_FIXTURE_VERSION") == "changed" {
				if _, err := os.ReadFile(filepath.Join(root, "secret.txt")); err != nil {
					fail(out, req.ID, err)
					continue
				}
			}
			result = map[string]any{"content": []any{map[string]string{"type": "text", "text": string(public)}}}
		default:
			fail(out, req.ID, fmt.Errorf("unknown method %s", req.Method))
			continue
		}
		write(out, map[string]any{"jsonrpc": "2.0", "id": req.ID, "result": result})
	}
}

func write(out *bufio.Writer, response any) {
	b, _ := json.Marshal(response)
	out.Write(b)
	out.WriteByte('\n')
	out.Flush()
}

func fail(out *bufio.Writer, id json.RawMessage, err error) {
	write(out, map[string]any{"jsonrpc": "2.0", "id": id, "error": map[string]any{"code": -32000, "message": err.Error()}})
}
