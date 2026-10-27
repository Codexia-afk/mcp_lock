package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"mcp-lock/internal/mcpclient"
)

func validConfig() Config {
	return Config{SchemaVersion: SchemaVersion, Image: "sha256:" + strings.Repeat("a", 64),
		Entrypoint: []string{"/app/server"}, ProtocolMode: "modern",
		Scenarios: []mcpclient.Scenario{{Name: "read", Tool: "read_fixture", Arguments: json.RawMessage(`{}`)}},
	}
}

func TestEvidenceInputDigestsTrackMeaningfulChanges(t *testing.T) {
	c := validConfig()
	first, err := c.ScenarioDigest()
	if err != nil {
		t.Fatal(err)
	}
	c.Scenarios[0].Arguments = json.RawMessage(`{  }`)
	second, err := c.ScenarioDigest()
	if err != nil || first != second {
		t.Fatalf("JSON whitespace changed scenario digest: %v", err)
	}
	c.Scenarios[0].Arguments = json.RawMessage(`{"x":1}`)
	third, err := c.ScenarioDigest()
	if err != nil || third == first {
		t.Fatalf("scenario change not detected: %v", err)
	}

	root := t.TempDir()
	file := filepath.Join(root, "public.txt")
	if err := os.WriteFile(file, []byte("A"), 0600); err != nil {
		t.Fatal(err)
	}
	c.FixtureMounts = []FixtureMount{{Source: root, Target: "/fixtures"}}
	before, err := c.FixtureDigest()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(file, []byte("B"), 0600); err != nil {
		t.Fatal(err)
	}
	after, err := c.FixtureDigest()
	if err != nil || before == after {
		t.Fatalf("fixture content change not detected: %v", err)
	}
}

func TestConfigRejectsUnpinnedImageAndInvalidArguments(t *testing.T) {
	c := validConfig()
	if err := c.Validate(); err != nil {
		t.Fatal(err)
	}
	c.Image = "mcp-lock-echo:latest"
	if err := c.Validate(); err == nil {
		t.Fatal("unpinned image accepted")
	}
	c.Image = "--privileged@sha256:" + strings.Repeat("a", 64)
	if err := c.Validate(); err == nil {
		t.Fatal("option-like image reference accepted")
	}
	c = validConfig()
	c.Scenarios[0].Arguments = json.RawMessage(`[]`)
	if err := c.Validate(); err == nil {
		t.Fatal("non-object arguments accepted")
	}
	c = validConfig()
	c.FixtureMounts = []FixtureMount{{Source: "/tmp/fixtures", Target: "/proc/secret"}}
	if err := c.Validate(); err == nil {
		t.Fatal("reserved fixture target accepted")
	}
}
