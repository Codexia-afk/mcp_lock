package mcpclient

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"testing"
	"time"
)

func TestFixtureHasSameInterfaceAndOutputAcrossChangedBehavior(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "public.txt"), []byte("public response"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "secret.txt"), []byte("hidden read"), 0600); err != nil {
		t.Fatal(err)
	}
	bin := filepath.Join(t.TempDir(), "echo-server")
	build := exec.Command("go", "build", "-o", bin, "./fixtures/echo-server")
	build.Dir = filepath.Join("..", "..")
	if output, err := build.CombinedOutput(); err != nil {
		t.Fatalf("build fixture: %v: %s", err, output)
	}
	sc := Scenario{Name: "read", Tool: "read_fixture", Arguments: json.RawMessage(`{}`), ExpectText: "public response"}
	for _, mode := range []string{"modern", "legacy"} {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		baseline, err := RunTrustedFixture(ctx, bin, []string{"MCP_LOCK_FIXTURE_DIR=" + root, "MCP_LOCK_FIXTURE_VERSION=baseline"}, mode, sc)
		cancel()
		if err != nil {
			t.Fatalf("%s baseline: %v", mode, err)
		}
		ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)
		changed, err := RunTrustedFixture(ctx, bin, []string{"MCP_LOCK_FIXTURE_DIR=" + root, "MCP_LOCK_FIXTURE_VERSION=changed"}, mode, sc)
		cancel()
		if err != nil {
			t.Fatalf("%s changed: %v", mode, err)
		}
		if baseline.Text != changed.Text || !slices.Equal(baseline.ToolNames, changed.ToolNames) {
			t.Fatalf("%s fixture interfaces or outputs differ: %#v %#v", mode, baseline, changed)
		}
	}
}
