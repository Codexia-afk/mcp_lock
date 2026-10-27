package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"mcp-lock/internal/config"
	"mcp-lock/internal/lockfile"
	"mcp-lock/internal/mcpclient"
	"mcp-lock/internal/policy"
)

func TestReviewCommandsReturnDriftExitCode(t *testing.T) {
	digestA := "sha256:" + strings.Repeat("a", 64)
	digestB := "sha256:" + strings.Repeat("b", 64)
	zero := 0
	baseline := lockfile.Lock{
		SchemaVersion: "1",
		Server:        lockfile.Server{ImageDigest: digestA, Entrypoint: []string{"/app/server"}},
		Protocol:      lockfile.Protocol{Version: "2026-07-28", Transport: "stdio"},
		ScenarioSuite: lockfile.ScenarioSuite{Digest: digestA, FixtureDigest: digestA, Completed: 1, Total: 1},
		Environment:   lockfile.Environment{ImageDigest: digestA, Kernel: "linux", Arch: "amd64"},
		Observer:      lockfile.Observer{Backend: "test", Version: "1", LostEvents: &zero, Status: "complete"},
		Observations:  []lockfile.Observation{{Kind: "file.read", Target: "/fixtures/public.txt", Outcome: "allowed", Scenario: "read", Count: 1}},
		EvidenceDigest: digestA,
	}
	candidate := baseline
	candidate.Server.ImageDigest = digestB
	candidate.EvidenceDigest = digestB
	candidate.Observations = append([]lockfile.Observation(nil), baseline.Observations...)
	candidate.Observations = append(candidate.Observations, lockfile.Observation{Kind: "file.read", Target: "/fixtures/secret.txt", Outcome: "allowed", Scenario: "read", Count: 1})
	root := t.TempDir()
	oldPath := filepath.Join(root, "old.lock")
	newPath := filepath.Join(root, "new.lock")
	policyPath := filepath.Join(root, "policy.json")
	if err := lockfile.Save(oldPath, baseline); err != nil {
		t.Fatal(err)
	}
	if err := lockfile.Save(newPath, candidate); err != nil {
		t.Fatal(err)
	}
	p := policy.Policy{
		SchemaVersion: "1", Status: "approved", ServerImageDigest: digestA, EvidenceDigest: digestA,
		Files:            []policy.FileRule{{Path: "/fixtures/public.txt", Access: "read"}},
		RequiredControls: []string{"filesystem", "network", "process"}, ApprovedBy: "reviewer",
	}
	if err := policy.Save(policyPath, p); err != nil {
		t.Fatal(err)
	}
	if got := run([]string{"diff", "--from", oldPath, "--to", newPath}); got != 2 {
		t.Fatalf("diff exit code %d", got)
	}
	if got := run([]string{"policy", "assess", "--policy", policyPath, "--lock", newPath}); got != 2 {
		t.Fatalf("assessment exit code %d", got)
	}
	if got := run([]string{"observe"}); got != 5 {
		t.Fatalf("unsafe observe exit code %d", got)
	}
}

func TestAutoApproveNarrowerDiff(t *testing.T) {
	digestA := "sha256:" + strings.Repeat("a", 64)
	digestB := "sha256:" + strings.Repeat("b", 64)
	zero := 0
	baseline := lockfile.Lock{
		SchemaVersion: "1",
		Server:        lockfile.Server{ImageDigest: digestA, Entrypoint: []string{"/app/server"}},
		Protocol:      lockfile.Protocol{Version: "2026-07-28", Transport: "stdio"},
		ScenarioSuite: lockfile.ScenarioSuite{Digest: digestA, FixtureDigest: digestA, Completed: 1, Total: 1},
		Environment:   lockfile.Environment{ImageDigest: digestA, Kernel: "linux", Arch: "amd64"},
		Observer:      lockfile.Observer{Backend: "test", Version: "1", LostEvents: &zero, Status: "complete"},
		Observations:  []lockfile.Observation{{Kind: "file.read", Target: "/fixtures/public.txt", Outcome: "allowed", Scenario: "read", Count: 1}},
		EvidenceDigest: digestA,
	}

	// Updated image with strictly identical permissions
	updated := baseline
	updated.Server.ImageDigest = digestB

	root := t.TempDir()
	oldPath := filepath.Join(root, "old.lock")
	newPath := filepath.Join(root, "new.lock")
	if err := lockfile.Save(oldPath, baseline); err != nil {
		t.Fatal(err)
	}
	if err := lockfile.Save(newPath, updated); err != nil {
		t.Fatal(err)
	}

	// Strict diff requires identity review -> exit code 2
	if got := run([]string{"diff", "--from", oldPath, "--to", newPath}); got != 2 {
		t.Fatalf("expected strict diff to require review (2), got %d", got)
	}

	// Auto-approve narrower diff succeeds with exit code 0
	if got := run([]string{"diff", "--from", oldPath, "--to", newPath, "--auto-approve-narrower"}); got != 0 {
		t.Fatalf("expected auto-approve narrower to exit 0, got %d", got)
	}
}

func TestBadgeCommand(t *testing.T) {
	digestA := "sha256:" + strings.Repeat("a", 64)
	zero := 0
	lock := lockfile.Lock{
		SchemaVersion: "1",
		Server:        lockfile.Server{ImageDigest: digestA, Entrypoint: []string{"/app/server"}},
		Protocol:      lockfile.Protocol{Version: "2026-07-28", Transport: "stdio"},
		ScenarioSuite: lockfile.ScenarioSuite{Digest: digestA, FixtureDigest: digestA, Completed: 1, Total: 1},
		Environment:   lockfile.Environment{ImageDigest: digestA, Kernel: "linux", Arch: "amd64"},
		Observer:      lockfile.Observer{Backend: "test", Version: "1", LostEvents: &zero, Status: "complete"},
		Observations:  []lockfile.Observation{{Kind: "file.read", Target: "/fixtures/public.txt", Outcome: "allowed", Scenario: "read", Count: 1}},
		EvidenceDigest: digestA,
	}

	root := t.TempDir()
	lockPath := filepath.Join(root, "behavior.lock")
	if err := lockfile.Save(lockPath, lock); err != nil {
		t.Fatal(err)
	}

	if got := run([]string{"badge", "--lock", lockPath}); got != 0 {
		t.Fatalf("expected badge command to exit 0, got %d", got)
	}
}

func TestObserveWithEmulatedBackend(t *testing.T) {
	root := t.TempDir()
	cfgPath := filepath.Join(root, "config.json")
	outLock := filepath.Join(root, "behavior.lock")

	c := config.Config{
		SchemaVersion: "1",
		Image:         "sha256:" + strings.Repeat("a", 64),
		Entrypoint:    []string{"/app/server"},
		ProtocolMode:  "modern",
		FixtureMounts: []config.FixtureMount{{Source: root, Target: "/fixtures"}},
		Scenarios: []mcpclient.Scenario{
			{
				Name:       "test-scenario",
				Tool:       "read",
				Arguments:  json.RawMessage(`{}`),
				ExpectText: "ok",
			},
		},
	}
	b, _ := c.MarshalCanonical()
	if err := os.WriteFile(cfgPath, b, 0644); err != nil {
		t.Fatal(err)
	}

	if got := run([]string{"observe", "--config", cfgPath, "--out", outLock, "--backend", "emulated"}); got != 0 {
		t.Fatalf("expected observe to exit 0, got %d", got)
	}

	l, err := lockfile.Load(outLock)
	if err != nil {
		t.Fatalf("failed to load emitted lockfile: %v", err)
	}
	if !l.Complete() {
		t.Errorf("expected complete lockfile")
	}
}
