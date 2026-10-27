package observer

import (
	"context"
	"encoding/json"
	"strings"
	"testing"

	"mcp-lock/internal/config"
	"mcp-lock/internal/mcpclient"
)

func TestEmulatedObserverProducesValidLockfile(t *testing.T) {
	fixtureDir := t.TempDir()
	c := config.Config{
		SchemaVersion: "1",
		Image:         "sha256:" + strings.Repeat("a", 64),
		Entrypoint:    []string{"/app/server"},
		ProtocolMode:  "modern",
		FixtureMounts: []config.FixtureMount{
			{Source: fixtureDir, Target: "/fixtures"},
		},
		Scenarios: []mcpclient.Scenario{
			{
				Name:       "test-scenario",
				Tool:       "read",
				Arguments:  json.RawMessage(`{}`),
				ExpectText: "ok",
			},
		},
	}

	obs := NewEmulatedObserver()
	lock, err := obs.Observe(context.Background(), c)
	if err != nil {
		t.Fatalf("Observe failed: %v", err)
	}

	if err := lock.Validate(); err != nil {
		t.Fatalf("generated lockfile failed validation: %v", err)
	}

	if !lock.Complete() {
		t.Fatalf("expected lockfile to be marked complete")
	}

	if len(lock.Observations) == 0 {
		t.Fatalf("expected at least 1 observation")
	}

	var foundEntrypoint bool
	for _, o := range lock.Observations {
		if o.Target == "/app/server" && o.Kind == "process.exec" {
			foundEntrypoint = true
		}
	}
	if !foundEntrypoint {
		t.Errorf("entrypoint observation not found")
	}
}

func TestDockerObserverRejectsInvalidConfig(t *testing.T) {
	obs := NewDockerObserver()
	invalidConfig := config.Config{}
	_, err := obs.Observe(context.Background(), invalidConfig)
	if err == nil {
		t.Fatal("expected error on invalid config")
	}
}
