package lockfile

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

const SchemaVersion = "1"

// Lock contains reviewed evidence, not a claim that unobserved behavior is absent.
type Lock struct {
	SchemaVersion  string        `json:"schemaVersion"`
	Server         Server        `json:"server"`
	Protocol       Protocol      `json:"protocol"`
	ScenarioSuite  ScenarioSuite `json:"scenarioSuite"`
	Environment    Environment   `json:"environment"`
	Observer       Observer      `json:"observer"`
	Observations   []Observation `json:"observations"`
	EvidenceDigest string        `json:"evidenceDigest"`
}

type Server struct {
	ImageDigest string   `json:"imageDigest"`
	Entrypoint  []string `json:"entrypoint"`
}

type Protocol struct {
	Version   string `json:"version"`
	Transport string `json:"transport"`
}

type ScenarioSuite struct {
	Digest        string `json:"digest"`
	FixtureDigest string `json:"fixtureDigest"`
	Completed     int    `json:"completed"`
	Total         int    `json:"total"`
}

type Environment struct {
	ImageDigest string `json:"imageDigest"`
	Kernel      string `json:"kernel"`
	Arch        string `json:"arch"`
}

type Observer struct {
	Backend    string `json:"backend"`
	Version    string `json:"version"`
	LostEvents *int   `json:"lostEvents"` // nil means the backend cannot measure loss.
	Status     string `json:"status"`
}

type Observation struct {
	Kind         string `json:"kind"`
	Target       string `json:"target"`
	ObjectDigest string `json:"objectDigest,omitempty"`
	Outcome      string `json:"outcome"`
	Scenario     string `json:"scenario"`
	Count        int    `json:"count"`
}

func (l Lock) Validate() error {
	if l.SchemaVersion != SchemaVersion {
		return fmt.Errorf("unsupported schemaVersion %q", l.SchemaVersion)
	}
	if !digest(l.Server.ImageDigest) || len(l.Server.Entrypoint) == 0 {
		return errors.New("server image digest and entrypoint are required")
	}
	if l.Protocol.Version == "" || l.Protocol.Transport != "stdio" {
		return errors.New("a protocol version and stdio transport are required")
	}
	if !digest(l.ScenarioSuite.Digest) || !digest(l.ScenarioSuite.FixtureDigest) || l.ScenarioSuite.Total < 1 || l.ScenarioSuite.Completed < 0 || l.ScenarioSuite.Completed > l.ScenarioSuite.Total {
		return errors.New("invalid scenario suite or completion count")
	}
	if !digest(l.Environment.ImageDigest) || l.Environment.Kernel == "" || l.Environment.Arch == "" {
		return errors.New("environment image digest, kernel and architecture are required")
	}
	if l.Observer.Backend == "" || l.Observer.Version == "" || l.Observer.Status == "" {
		return errors.New("observer backend, version and status are required")
	}
	if l.Observer.Status != "complete" && l.Observer.Status != "incomplete" {
		return errors.New("observer status must be complete or incomplete")
	}
	if l.Observer.LostEvents != nil && *l.Observer.LostEvents < 0 {
		return errors.New("lostEvents cannot be negative")
	}
	if !digest(l.EvidenceDigest) {
		return errors.New("evidenceDigest must be a SHA-256 digest")
	}
	seen := map[string]bool{}
	for _, o := range l.Observations {
		if o.Kind == "" || o.Target == "" || o.Outcome == "" || o.Scenario == "" || o.Count < 1 {
			return errors.New("invalid observation")
		}
		if o.Outcome != "allowed" && o.Outcome != "denied" {
			return fmt.Errorf("invalid observation outcome %q", o.Outcome)
		}
		switch o.Kind {
		case "file.read", "file.write", "process.exec":
			if !strings.HasPrefix(o.Target, "/") || path.Clean(o.Target) != o.Target || strings.ContainsRune(o.Target, '\x00') {
				return fmt.Errorf("invalid path target %q", o.Target)
			}
		case "network.connect":
			host, port, err := net.SplitHostPort(o.Target)
			if err != nil || host == "" {
				return fmt.Errorf("invalid network target %q", o.Target)
			}
			n, err := strconv.Atoi(port)
			if err != nil || n < 1 || n > 65535 {
				return fmt.Errorf("invalid network port in %q", o.Target)
			}
		default:
			return fmt.Errorf("unknown observation kind %q", o.Kind)
		}
		if o.Kind == "process.exec" && !digest(o.ObjectDigest) {
			return errors.New("process.exec observation needs executable digest")
		}
		key := observationKey(o)
		if seen[key] {
			return fmt.Errorf("duplicate observation %q", key)
		}
		seen[key] = true
	}
	return nil
}

func (l Lock) Complete() bool {
	return l.Observer.Status == "complete" && l.Observer.LostEvents != nil && *l.Observer.LostEvents == 0 && l.ScenarioSuite.Completed == l.ScenarioSuite.Total
}

func Load(path string) (Lock, error) {
	var l Lock
	f, err := os.Open(path)
	if err != nil {
		return l, err
	}
	defer f.Close()
	d := json.NewDecoder(f)
	d.DisallowUnknownFields()
	if err := d.Decode(&l); err != nil {
		return l, err
	}
	if err := d.Decode(new(any)); !errors.Is(err, io.EOF) {
		return l, errors.New("extra JSON after lockfile")
	}
	return l, l.Validate()
}

func (l Lock) MarshalCanonical() ([]byte, error) {
	if err := l.Validate(); err != nil {
		return nil, err
	}
	l.Observations = append([]Observation(nil), l.Observations...)
	sort.Slice(l.Observations, func(i, j int) bool { return observationKey(l.Observations[i]) < observationKey(l.Observations[j]) })
	b, err := json.MarshalIndent(l, "", "  ")
	if err != nil {
		return nil, err
	}
	return append(b, '\n'), nil
}

func Save(path string, l Lock) error {
	b, err := l.MarshalCanonical()
	if err != nil {
		return err
	}
	f, err := os.CreateTemp(filepath.Dir(path), ".mcp-lock-*.tmp")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	if err := f.Chmod(0600); err != nil {
		f.Close()
		return err
	}
	if _, err := f.Write(b); err != nil {
		f.Close()
		return err
	}
	if err := f.Sync(); err != nil {
		f.Close()
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	// Evidence is immutable; a new scan must not silently replace prior evidence.
	return os.Link(f.Name(), path)
}

type Diff struct {
	Comparable bool
	Reasons    []string
	Added      []Observation
	Removed    []Observation
}

// IsNarrowerOrEqual returns true if candidate introduced zero added capabilities.
func (d Diff) IsNarrowerOrEqual() bool {
	return d.Comparable && len(d.Added) == 0
}

func Compare(a, b Lock) Diff {
	d := Diff{Comparable: true}
	if !a.Complete() || !b.Complete() {
		d.Reasons = append(d.Reasons, "one or both scans have incomplete evidence")
	}
	if a.Protocol != b.Protocol {
		d.Reasons = append(d.Reasons, "protocol differs")
	}
	if a.ScenarioSuite.Digest != b.ScenarioSuite.Digest {
		d.Reasons = append(d.Reasons, "scenario suite differs")
	}
	if a.ScenarioSuite.FixtureDigest != b.ScenarioSuite.FixtureDigest {
		d.Reasons = append(d.Reasons, "fixtures differ")
	}
	if a.ScenarioSuite.Total != b.ScenarioSuite.Total {
		d.Reasons = append(d.Reasons, "scenario count differs")
	}
	if a.Environment != b.Environment {
		d.Reasons = append(d.Reasons, "execution environment differs")
	}
	if a.Observer.Backend != b.Observer.Backend || a.Observer.Version != b.Observer.Version {
		d.Reasons = append(d.Reasons, "observer differs")
	}
	if len(d.Reasons) != 0 {
		d.Comparable = false
		return d
	}
	old := map[string]Observation{}
	newer := map[string]Observation{}
	for _, o := range a.Observations {
		old[observationKey(o)] = o
	}
	for _, o := range b.Observations {
		newer[observationKey(o)] = o
	}
	for k, o := range newer {
		if _, ok := old[k]; !ok {
			d.Added = append(d.Added, o)
		}
	}
	for k, o := range old {
		if _, ok := newer[k]; !ok {
			d.Removed = append(d.Removed, o)
		}
	}
	sort.Slice(d.Added, func(i, j int) bool { return observationKey(d.Added[i]) < observationKey(d.Added[j]) })
	sort.Slice(d.Removed, func(i, j int) bool { return observationKey(d.Removed[i]) < observationKey(d.Removed[j]) })
	return d
}

func observationKey(o Observation) string {
	return strings.Join([]string{o.Kind, o.Target, o.ObjectDigest, o.Outcome, o.Scenario}, "\x00")
}

func digest(s string) bool {
	if !strings.HasPrefix(s, "sha256:") || len(s) != len("sha256:")+64 {
		return false
	}
	for _, c := range s[len("sha256:"):] {
		if !strings.ContainsRune("0123456789abcdef", c) {
			return false
		}
	}
	return true
}

// DecodeStrict validates one JSON value without accepting trailing content.
func DecodeStrict(data []byte) (Lock, error) {
	var l Lock
	d := json.NewDecoder(bytes.NewReader(data))
	d.DisallowUnknownFields()
	if err := d.Decode(&l); err != nil {
		return l, err
	}
	if err := d.Decode(new(any)); !errors.Is(err, io.EOF) {
		return l, errors.New("extra JSON after lockfile")
	}
	return l, l.Validate()
}
