package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"strings"

	"mcp-lock/internal/mcpclient"
)

const SchemaVersion = "1"

// Config pins a target image and declares deterministic MCP scenarios.
type Config struct {
	SchemaVersion string               `json:"schemaVersion"`
	Image         string               `json:"image"`
	Entrypoint    []string             `json:"entrypoint"`
	ProtocolMode  string               `json:"protocolMode"`
	FixtureMounts []FixtureMount       `json:"fixtureMounts"`
	Scenarios     []mcpclient.Scenario `json:"scenarios"`
}

type FixtureMount struct {
	Source string `json:"source"`
	Target string `json:"target"`
}

func Load(filename string) (Config, error) {
	var c Config
	f, err := os.Open(filename)
	if err != nil {
		return c, err
	}
	defer f.Close()
	d := json.NewDecoder(f)
	d.DisallowUnknownFields()
	if err := d.Decode(&c); err != nil {
		return c, err
	}
	if err := d.Decode(new(any)); !errors.Is(err, io.EOF) {
		return c, errors.New("extra JSON after config")
	}
	return c, c.Validate()
}

func (c Config) Validate() error {
	if c.SchemaVersion != SchemaVersion {
		return fmt.Errorf("unsupported config schemaVersion %q", c.SchemaVersion)
	}
	if !pinnedImage(c.Image) {
		return errors.New("image must be pinned by sha256 digest")
	}
	if len(c.Entrypoint) == 0 || !safeContainerPath(c.Entrypoint[0]) {
		return errors.New("entrypoint must start with an absolute container path")
	}
	if c.ProtocolMode != "modern" && c.ProtocolMode != "legacy" {
		return errors.New("protocolMode must be modern or legacy")
	}
	if len(c.Scenarios) == 0 {
		return errors.New("at least one scenario is required")
	}
	seenScenarios := map[string]bool{}
	for _, s := range c.Scenarios {
		var arguments map[string]json.RawMessage
		if s.Name == "" || s.Tool == "" || json.Unmarshal(s.Arguments, &arguments) != nil || arguments == nil {
			return fmt.Errorf("invalid scenario %q", s.Name)
		}
		if seenScenarios[s.Name] {
			return fmt.Errorf("duplicate scenario %q", s.Name)
		}
		seenScenarios[s.Name] = true
	}
	seenTargets := map[string]bool{}
	for _, m := range c.FixtureMounts {
		if !filepath.IsAbs(m.Source) || !safeContainerPath(m.Target) || m.Target == "/" {
			return fmt.Errorf("invalid fixture mount %q -> %q", m.Source, m.Target)
		}
		for _, blocked := range []string{"/proc", "/sys", "/dev", "/run"} {
			if m.Target == blocked || strings.HasPrefix(m.Target, blocked+"/") {
				return fmt.Errorf("fixture mount target %q is reserved", m.Target)
			}
		}
		if seenTargets[m.Target] {
			return fmt.Errorf("duplicate fixture mount target %q", m.Target)
		}
		seenTargets[m.Target] = true
	}
	return nil
}

func safeContainerPath(s string) bool {
	return strings.HasPrefix(s, "/") && s == path.Clean(s) && !strings.ContainsRune(s, '\x00')
}

func pinnedImage(s string) bool {
	digest := ""
	if strings.HasPrefix(s, "sha256:") {
		digest = strings.TrimPrefix(s, "sha256:")
	} else if i := strings.LastIndex(s, "@sha256:"); i > 0 {
		ref := s[:i]
		if len(ref) == 0 || !isASCIIAlphaNumeric(rune(ref[0])) {
			return false
		}
		for _, r := range ref {
			if !isASCIIAlphaNumeric(r) && !strings.ContainsRune("._/:-", r) {
				return false
			}
		}
		digest = s[i+8:]
	}
	if len(digest) != 64 {
		return false
	}
	for _, r := range digest {
		if !strings.ContainsRune("0123456789abcdef", r) {
			return false
		}
	}
	return true
}

func isASCIIAlphaNumeric(r rune) bool {
	return (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9')
}

// MarshalCanonical formats the configuration as standard indented JSON.
func (c Config) MarshalCanonical() ([]byte, error) {
	b, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return nil, err
	}
	return append(b, '\n'), nil
}
