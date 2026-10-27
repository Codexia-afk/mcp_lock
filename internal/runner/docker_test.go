package runner

import (
	"encoding/json"
	"path/filepath"
	"slices"
	"strings"
	"testing"

	"mcp-lock/internal/config"
	"mcp-lock/internal/mcpclient"
)

func TestDockerArgsContainIsolationAndPinnedImage(t *testing.T) {
	root := t.TempDir()
	root, err := filepath.EvalSymlinks(root)
	if err != nil {
		t.Fatal(err)
	}
	c := config.Config{
		SchemaVersion: "1", Image: "fixture@sha256:" + strings.Repeat("a", 64),
		Entrypoint: []string{"/app/server"}, ProtocolMode: "modern",
		FixtureMounts: []config.FixtureMount{{Source: root, Target: "/fixtures"}},
		Scenarios:     []mcpclient.Scenario{{Name: "read", Tool: "read_fixture", Arguments: json.RawMessage(`{}`)}},
	}
	args, err := DockerArgs(c)
	if err != nil {
		t.Fatal(err)
	}
	for _, needed := range []string{"none", "--read-only", "ALL", "no-new-privileges=true", "65532:65532", c.Image} {
		if !slices.Contains(args, needed) {
			t.Fatalf("missing %q from %v", needed, args)
		}
	}
	c.FixtureMounts[0].Source = filepath.Join(root, "missing")
	if _, err := DockerArgs(c); err == nil {
		t.Fatal("missing fixture source accepted")
	}
	c.FixtureMounts[0].Source = root
	c.FixtureMounts[0].Target = "/fixtures,bind-propagation=rshared"
	if _, err := DockerArgs(c); err == nil {
		t.Fatal("Docker mount option injection accepted")
	}
}
