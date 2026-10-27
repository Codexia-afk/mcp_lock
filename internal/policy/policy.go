package policy

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"

	"mcp-lock/internal/lockfile"
)

const SchemaVersion = "1"

// Policy is separate from observed evidence. A proposal cannot be enforced.
type Policy struct {
	SchemaVersion     string        `json:"schemaVersion"`
	Status            string        `json:"status"`
	ServerImageDigest string        `json:"serverImageDigest"`
	EvidenceDigest    string        `json:"evidenceDigest"`
	Files             []FileRule    `json:"files"`
	Network           []NetworkRule `json:"network"`
	Executables       []ExecRule    `json:"executables"`
	RequiredControls  []string      `json:"requiredControls"`
	ReviewRequired    []string      `json:"reviewRequired,omitempty"`
	ApprovedBy        string        `json:"approvedBy,omitempty"`
}

type FileRule struct {
	Path   string `json:"path"`
	Access string `json:"access"`
}

type NetworkRule struct {
	Host string `json:"host"`
	Port uint16 `json:"port"`
}

type ExecRule struct {
	Path   string `json:"path"`
	Digest string `json:"digest,omitempty"`
}

func Propose(l lockfile.Lock) (Policy, error) {
	var p Policy
	if err := l.Validate(); err != nil {
		return p, err
	}
	if !l.Complete() {
		return p, errors.New("cannot propose a policy from incomplete evidence")
	}
	p = Policy{
		SchemaVersion:     SchemaVersion,
		Status:            "proposed",
		ServerImageDigest: l.Server.ImageDigest,
		EvidenceDigest:    l.EvidenceDigest,
		RequiredControls:  []string{"filesystem", "network", "process"},
		Files:             []FileRule{}, Network: []NetworkRule{}, Executables: []ExecRule{},
	}
	seen := map[string]bool{}
	execDigests := map[string]string{}
	for _, o := range l.Observations {
		if o.Outcome != "allowed" {
			continue
		}
		switch o.Kind {
		case "file.read", "file.write":
			rule := FileRule{Path: o.Target, Access: strings.TrimPrefix(o.Kind, "file.")}
			key := "file:" + rule.Path + ":" + rule.Access
			if !seen[key] {
				p.Files = append(p.Files, rule)
				seen[key] = true
			}
		case "process.exec":
			if previous, exists := execDigests[o.Target]; exists && previous != o.ObjectDigest {
				return Policy{}, fmt.Errorf("executable %q changed digest within one scan", o.Target)
			}
			execDigests[o.Target] = o.ObjectDigest
			key := "exec:" + o.Target
			if !seen[key] {
				p.Executables = append(p.Executables, ExecRule{Path: o.Target, Digest: o.ObjectDigest})
				seen[key] = true
			}
		case "network.connect":
			// A destination cannot be safely inferred as a policy rule without
			// a validated host/port and proxy semantics. Leave it for review.
			p.ReviewRequired = append(p.ReviewRequired, "network destination "+o.Target+" requires manual proxy rule review")
		default:
			return Policy{}, fmt.Errorf("unsupported observation kind %q", o.Kind)
		}
	}
	sort.Slice(p.Files, func(i, j int) bool {
		if p.Files[i].Path == p.Files[j].Path {
			return p.Files[i].Access < p.Files[j].Access
		}
		return p.Files[i].Path < p.Files[j].Path
	})
	sort.Slice(p.Executables, func(i, j int) bool { return p.Executables[i].Path < p.Executables[j].Path })
	sort.Strings(p.ReviewRequired)
	return p, p.Validate()
}

func (p Policy) Validate() error {
	if p.SchemaVersion != SchemaVersion {
		return fmt.Errorf("unsupported policy schemaVersion %q", p.SchemaVersion)
	}
	if p.Status != "proposed" && p.Status != "approved" {
		return errors.New("policy status must be proposed or approved")
	}
	if !validDigest(p.ServerImageDigest) || !validDigest(p.EvidenceDigest) {
		return errors.New("policy needs server and evidence SHA-256 digests")
	}
	if p.Status == "approved" && strings.TrimSpace(p.ApprovedBy) == "" {
		return errors.New("approved policy needs approvedBy")
	}
	if p.Status == "approved" && len(p.ReviewRequired) != 0 {
		return errors.New("approved policy cannot have unresolved reviewRequired entries")
	}
	seenFiles := map[string]bool{}
	for _, f := range p.Files {
		if !safeAbsolute(f.Path) || (f.Access != "read" && f.Access != "write") {
			return fmt.Errorf("invalid file rule for %q", f.Path)
		}
		key := f.Path + "\x00" + f.Access
		if seenFiles[key] {
			return fmt.Errorf("duplicate file rule for %q", f.Path)
		}
		seenFiles[key] = true
	}
	seenExec := map[string]bool{}
	for _, e := range p.Executables {
		if !safeAbsolute(e.Path) || (e.Digest != "" && !validDigest(e.Digest)) {
			return fmt.Errorf("invalid executable rule for %q", e.Path)
		}
		if p.Status == "approved" && e.Digest == "" {
			return fmt.Errorf("approved executable rule for %q needs a digest", e.Path)
		}
		if seenExec[e.Path] {
			return fmt.Errorf("duplicate executable rule for %q", e.Path)
		}
		seenExec[e.Path] = true
	}
	seenNetwork := map[string]bool{}
	for _, n := range p.Network {
		if !validHostname(n.Host) || n.Port == 0 {
			return fmt.Errorf("invalid network rule for %q", n.Host)
		}
		key := fmt.Sprintf("%s:%d", n.Host, n.Port)
		if seenNetwork[key] {
			return fmt.Errorf("duplicate network rule for %q", key)
		}
		seenNetwork[key] = true
	}
	controls := map[string]bool{}
	for _, c := range p.RequiredControls {
		if c != "filesystem" && c != "network" && c != "process" {
			return fmt.Errorf("unknown required control %q", c)
		}
		if controls[c] {
			return fmt.Errorf("duplicate required control %q", c)
		}
		controls[c] = true
	}
	if !controls["filesystem"] || !controls["network"] || !controls["process"] {
		return errors.New("all three required controls must be listed")
	}
	return nil
}

func Load(file string) (Policy, error) {
	var p Policy
	f, err := os.Open(file)
	if err != nil {
		return p, err
	}
	defer f.Close()
	d := json.NewDecoder(f)
	d.DisallowUnknownFields()
	if err := d.Decode(&p); err != nil {
		return p, err
	}
	if err := d.Decode(new(any)); !errors.Is(err, io.EOF) {
		return p, errors.New("extra JSON after policy")
	}
	return p, p.Validate()
}

func (p Policy) Marshal() ([]byte, error) {
	if err := p.Validate(); err != nil {
		return nil, err
	}
	b, err := json.MarshalIndent(p, "", "  ")
	if err != nil {
		return nil, err
	}
	return append(b, '\n'), nil
}

type Assessment struct {
	IdentityChanged bool                   `json:"identityChanged"`
	Unapproved      []lockfile.Observation `json:"unapproved"`
}

// AssessCandidate compares complete observed evidence with a reviewed policy.
// It is an offline review aid, not proof that enforcement was active.
func AssessCandidate(p Policy, l lockfile.Lock) (Assessment, error) {
	var a Assessment
	if err := p.Validate(); err != nil {
		return a, err
	}
	if p.Status != "approved" {
		return a, errors.New("policy must be approved")
	}
	if err := l.Validate(); err != nil {
		return a, err
	}
	if !l.Complete() {
		return a, errors.New("candidate evidence is incomplete")
	}
	a.IdentityChanged = p.ServerImageDigest != l.Server.ImageDigest
	for _, o := range l.Observations {
		if o.Outcome != "allowed" {
			a.Unapproved = append(a.Unapproved, o)
			continue
		}
		permitted := false
		switch o.Kind {
		case "file.read", "file.write":
			for _, r := range p.Files {
				if r.Path == o.Target && "file."+r.Access == o.Kind {
					permitted = true
					break
				}
			}
		case "process.exec":
			for _, r := range p.Executables {
				if r.Path == o.Target && r.Digest == o.ObjectDigest {
					permitted = true
					break
				}
			}
		case "network.connect":
			host, port, err := net.SplitHostPort(o.Target)
			if err != nil {
				return a, fmt.Errorf("invalid network target %q", o.Target)
			}
			for _, r := range p.Network {
				if r.Host == host && fmt.Sprint(r.Port) == port {
					permitted = true
					break
				}
			}
		default:
			return a, fmt.Errorf("unsupported observation kind %q", o.Kind)
		}
		if !permitted {
			a.Unapproved = append(a.Unapproved, o)
		}
	}
	return a, nil
}

func Save(file string, p Policy) error {
	b, err := p.Marshal()
	if err != nil {
		return err
	}
	f, err := os.CreateTemp(filepath.Dir(file), ".mcp-policy-*.tmp")
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
	// A proposal should never silently replace an approved policy file.
	return os.Link(f.Name(), file)
}

func safeAbsolute(s string) bool {
	return strings.HasPrefix(s, "/") && s == path.Clean(s) && !strings.ContainsRune(s, '\x00')
}

func validDigest(s string) bool {
	if len(s) != 71 || !strings.HasPrefix(s, "sha256:") {
		return false
	}
	for _, c := range s[7:] {
		if !strings.ContainsRune("0123456789abcdef", c) {
			return false
		}
	}
	return true
}

func validHostname(host string) bool {
	if len(host) < 1 || len(host) > 253 || net.ParseIP(host) != nil {
		return false
	}
	for _, label := range strings.Split(host, ".") {
		if len(label) < 1 || len(label) > 63 || label[0] == '-' || label[len(label)-1] == '-' {
			return false
		}
		for _, c := range label {
			if !strings.ContainsRune("abcdefghijklmnopqrstuvwxyz0123456789-", c) {
				return false
			}
		}
	}
	return true
}
