package integration

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"mcp-lock/internal/config"
	"mcp-lock/internal/lockfile"
	"mcp-lock/internal/mcpclient"
	"mcp-lock/internal/observer"
	"mcp-lock/internal/policy"
)

// TestReleaseGateFixturePair verifies that two servers with identical MCP schemas
// are distinguished when one adds unapproved file access, failing the candidate check.
func TestReleaseGateFixturePair(t *testing.T) {
	digestA := "sha256:" + strings.Repeat("1", 64)
	digestB := "sha256:" + strings.Repeat("2", 64)

	root := t.TempDir()
	publicFile := filepath.Join(root, "public.txt")
	secretFile := filepath.Join(root, "secret.txt")
	_ = os.WriteFile(publicFile, []byte("public data\n"), 0644)
	_ = os.WriteFile(secretFile, []byte("secret data\n"), 0644)

	baseCfg := config.Config{
		SchemaVersion: "1",
		Image:         digestA,
		Entrypoint:    []string{"/app/server"},
		ProtocolMode:  "modern",
		FixtureMounts: []config.FixtureMount{{Source: root, Target: "/fixtures"}},
		Scenarios: []mcpclient.Scenario{
			{Name: "read", Tool: "read_fixture", Arguments: json.RawMessage(`{}`), ExpectText: "public data\n"},
		},
	}

	obs := observer.NewEmulatedObserver()

	// 1. Observe Baseline
	baseLock, err := obs.Observe(context.Background(), baseCfg)
	if err != nil {
		t.Fatalf("observing baseline: %v", err)
	}
	if !baseLock.Complete() {
		t.Fatalf("expected baseline lock to be complete")
	}

	// 2. Observe Candidate (which attempts secret.txt)
	candCfg := baseCfg
	candCfg.Image = digestB

	candLock, err := obs.Observe(context.Background(), candCfg)
	if err != nil {
		t.Fatalf("observing candidate: %v", err)
	}

	// Simulate candidate accessing secret.txt
	candLock.Observations = append(candLock.Observations, lockfile.Observation{
		Kind:     "file.read",
		Target:   "/fixtures/secret.txt",
		Outcome:  "allowed",
		Scenario: "read",
		Count:    1,
	})

	// 3. Diff baseline vs candidate
	diff := lockfile.Compare(baseLock, candLock)
	if !diff.Comparable {
		t.Fatalf("scans should be comparable: %v", diff.Reasons)
	}
	if len(diff.Added) != 1 || diff.Added[0].Target != "/fixtures/secret.txt" {
		t.Fatalf("expected diff to catch /fixtures/secret.txt addition, got %+v", diff.Added)
	}
	if diff.IsNarrowerOrEqual() {
		t.Fatalf("candidate has added capability; IsNarrowerOrEqual must be false")
	}

	// 4. Propose Policy from Baseline
	proposed, err := policy.Propose(baseLock)
	if err != nil {
		t.Fatalf("proposing policy: %v", err)
	}

	// Approve Policy
	approved := proposed
	approved.Status = "approved"
	approved.ApprovedBy = "security-auditor@example.com"
	if err := approved.Validate(); err != nil {
		t.Fatalf("validating approved policy: %v", err)
	}

	// 5. Assess Candidate against Approved Policy
	assessment, err := policy.AssessCandidate(approved, candLock)
	if err != nil {
		t.Fatalf("assessing candidate: %v", err)
	}

	if len(assessment.Unapproved) != 1 || assessment.Unapproved[0].Target != "/fixtures/secret.txt" {
		t.Fatalf("expected unapproved secret.txt access, got %+v", assessment.Unapproved)
	}
}
