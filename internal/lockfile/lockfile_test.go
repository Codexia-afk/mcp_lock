package lockfile

import (
	"bytes"
	"path/filepath"
	"strings"
	"testing"
)

func validLock() Lock {
	zero := 0
	digest := "sha256:" + strings.Repeat("a", 64)
	return Lock{
		SchemaVersion:  SchemaVersion,
		Server:         Server{ImageDigest: digest, Entrypoint: []string{"/app/server"}},
		Protocol:       Protocol{Version: "2026-07-28", Transport: "stdio"},
		ScenarioSuite:  ScenarioSuite{Digest: digest, FixtureDigest: digest, Completed: 1, Total: 1},
		Environment:    Environment{ImageDigest: digest, Kernel: "linux", Arch: "amd64"},
		Observer:       Observer{Backend: "test", Version: "1", LostEvents: &zero, Status: "complete"},
		Observations:   []Observation{{Kind: "file.read", Target: "/data/public", Outcome: "allowed", Scenario: "read", Count: 1}},
		EvidenceDigest: digest,
	}
}

func TestCompareRequiresCompleteComparableEvidence(t *testing.T) {
	a := validLock()
	b := validLock()
	b.Observations = append(b.Observations, Observation{Kind: "file.read", Target: "/data/secret", Outcome: "allowed", Scenario: "read", Count: 1})
	d := Compare(a, b)
	if !d.Comparable || len(d.Added) != 1 || d.Added[0].Target != "/data/secret" {
		t.Fatalf("unexpected diff: %#v", d)
	}
	b.Observer.LostEvents = nil
	if Compare(a, b).Comparable {
		t.Fatal("unknown event loss was treated as complete")
	}
	b = validLock()
	b.ScenarioSuite.Digest = "sha256:" + strings.Repeat("b", 64)
	if Compare(a, b).Comparable {
		t.Fatal("different scenarios were treated as comparable")
	}
}

func TestStrictDecodeAndStableMarshal(t *testing.T) {
	l := validLock()
	b, err := l.MarshalCanonical()
	if err != nil {
		t.Fatal(err)
	}
	if _, err := DecodeStrict(append(bytes.Clone(b), []byte(`{"extra":true}`)...)); err == nil {
		t.Fatal("accepted trailing JSON")
	}
	bad := bytes.Replace(b, []byte(`"schemaVersion"`), []byte(`"unknownField"`), 1)
	if _, err := DecodeStrict(bad); err == nil {
		t.Fatal("accepted unknown field")
	}
	l2, err := DecodeStrict(b)
	if err != nil || !l2.Complete() {
		t.Fatalf("round trip: %v", err)
	}
}

func TestSaveDoesNotReplaceEvidence(t *testing.T) {
	name := filepath.Join(t.TempDir(), "behavior.lock")
	l := validLock()
	if err := Save(name, l); err != nil {
		t.Fatal(err)
	}
	if err := Save(name, l); err == nil {
		t.Fatal("immutable lockfile was overwritten")
	}
	loaded, err := Load(name)
	if err != nil || !loaded.Complete() {
		t.Fatalf("saved lockfile: %v", err)
	}
}
