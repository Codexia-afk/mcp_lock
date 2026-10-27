package policy

import (
	"strings"
	"testing"

	"mcp-lock/internal/lockfile"
)

func TestPolicyRejectsUnsafePathsAndUnreviewedApproval(t *testing.T) {
	digest := "sha256:" + strings.Repeat("a", 64)
	p := Policy{SchemaVersion: SchemaVersion, Status: "approved", ServerImageDigest: digest, EvidenceDigest: digest, RequiredControls: []string{"filesystem", "network", "process"}}
	if err := p.Validate(); err == nil {
		t.Fatal("approved policy without reviewer accepted")
	}
	p.ApprovedBy = "reviewer"
	p.Files = []FileRule{{Path: "/data/../secret", Access: "read"}}
	if err := p.Validate(); err == nil {
		t.Fatal("unclean path accepted")
	}
	p.Files[0].Path = "/data/public"
	if err := p.Validate(); err != nil {
		t.Fatal(err)
	}
	p.Executables = []ExecRule{{Path: "/bin/helper"}}
	if err := p.Validate(); err == nil {
		t.Fatal("approved executable without digest accepted")
	}
	p.Executables = nil
	p.Network = []NetworkRule{{Host: "evil,option", Port: 443}}
	if err := p.Validate(); err == nil {
		t.Fatal("invalid network hostname accepted")
	}
}

func TestAssessCandidateFlagsNewFileAccessAndIdentity(t *testing.T) {
	digestA := "sha256:" + strings.Repeat("a", 64)
	digestB := "sha256:" + strings.Repeat("b", 64)
	zero := 0
	p := Policy{SchemaVersion: SchemaVersion, Status: "approved", ServerImageDigest: digestA, EvidenceDigest: digestA,
		Files:            []FileRule{{Path: "/fixtures/public.txt", Access: "read"}},
		RequiredControls: []string{"filesystem", "network", "process"}, ApprovedBy: "reviewer"}
	l := lockfile.Lock{SchemaVersion: "1", Server: lockfile.Server{ImageDigest: digestB, Entrypoint: []string{"/app/server"}},
		Protocol:      lockfile.Protocol{Version: "2026-07-28", Transport: "stdio"},
		ScenarioSuite: lockfile.ScenarioSuite{Digest: digestA, FixtureDigest: digestA, Completed: 1, Total: 1},
		Environment:   lockfile.Environment{ImageDigest: digestA, Kernel: "linux", Arch: "amd64"},
		Observer:      lockfile.Observer{Backend: "test", Version: "1", LostEvents: &zero, Status: "complete"},
		Observations: []lockfile.Observation{
			{Kind: "file.read", Target: "/fixtures/public.txt", Outcome: "allowed", Scenario: "read", Count: 1},
			{Kind: "file.read", Target: "/fixtures/secret.txt", Outcome: "allowed", Scenario: "read", Count: 1},
		}, EvidenceDigest: digestB}
	a, err := AssessCandidate(p, l)
	if err != nil {
		t.Fatal(err)
	}
	if !a.IdentityChanged || len(a.Unapproved) != 1 || a.Unapproved[0].Target != "/fixtures/secret.txt" {
		t.Fatalf("assessment: %#v", a)
	}
	l.Observer.LostEvents = nil
	if _, err := AssessCandidate(p, l); err == nil {
		t.Fatal("incomplete evidence accepted")
	}
	l.Observer.LostEvents = &zero
	l.Observations = append(l.Observations, lockfile.Observation{Kind: "network.connect", Target: "api.example.com:443", Outcome: "allowed", Scenario: "read", Count: 1})
	proposal, err := Propose(l)
	if err != nil || len(proposal.ReviewRequired) != 1 || len(proposal.Network) != 0 {
		t.Fatalf("network must require manual review: %#v %v", proposal, err)
	}
}
