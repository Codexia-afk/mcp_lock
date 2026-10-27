package wrap

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"mcp-lock/internal/config"
	"mcp-lock/internal/mcpclient"
)

type TargetKind string

const (
	KindNPX    TargetKind = "npx"
	KindUVX    TargetKind = "uvx"
	KindDocker TargetKind = "docker"
)

type TargetSpec struct {
	Kind      TargetKind
	Package   string
	Arguments []string
	BaseImage string
}

// ParseCommandTarget parses CLI command invocations like:
// - ["npx", "-y", "@modelcontextprotocol/server-filesystem@0.6.2", "/data"]
// - ["uvx", "mcp-server-sqlite", "--db", "/data/test.db"]
func ParseCommandTarget(args []string) (*TargetSpec, error) {
	if len(args) == 0 {
		return nil, errors.New("empty command target")
	}

	cmd := args[0]
	if cmd == "npx" {
		spec := &TargetSpec{
			Kind:      KindNPX,
			BaseImage: "node:22-alpine",
		}
		var pkg string
		var pkgArgs []string
		skipNext := false

		for i := 1; i < len(args); i++ {
			if skipNext {
				skipNext = false
				continue
			}
			arg := args[i]
			if arg == "-y" || arg == "--yes" {
				continue
			}
			if arg == "-p" || arg == "--package" {
				if i+1 < len(args) {
					pkg = args[i+1]
					skipNext = true
					continue
				}
			}
			if pkg == "" && !strings.HasPrefix(arg, "-") {
				pkg = arg
				continue
			}
			pkgArgs = append(pkgArgs, arg)
		}

		if pkg == "" {
			return nil, errors.New("could not identify npm package in npx command")
		}
		spec.Package = pkg
		spec.Arguments = pkgArgs
		return spec, nil
	}

	if cmd == "uvx" {
		spec := &TargetSpec{
			Kind:      KindUVX,
			BaseImage: "python:3.12-alpine",
		}
		if len(args) < 2 {
			return nil, errors.New("missing package in uvx command")
		}
		spec.Package = args[1]
		spec.Arguments = args[2:]
		return spec, nil
	}

	return nil, fmt.Errorf("unsupported command wrapper %q; only npx and uvx are supported for auto-wrapping", cmd)
}

// GenerateDockerfile returns the isolated Dockerfile for building the pinned container.
func (s *TargetSpec) GenerateDockerfile() (string, []string, error) {
	// Sanitize package name against command injection during Dockerfile generation
	if strings.ContainsAny(s.Package, "\n\r\t\"'$;`&|><") {
		return "", nil, fmt.Errorf("invalid characters in package name %q", s.Package)
	}

	switch s.Kind {
	case KindNPX:
		// Install package globally in the isolated build container
		df := fmt.Sprintf(`FROM %s
WORKDIR /app
RUN npm install -g %s
USER 65532:65532
ENTRYPOINT ["npx", "-y", "%s"]
`, s.BaseImage, s.Package, s.Package)
		entrypoint := append([]string{"npx", "-y", s.Package}, s.Arguments...)
		return df, entrypoint, nil

	case KindUVX:
		df := fmt.Sprintf(`FROM %s
WORKDIR /app
RUN pip install --no-cache-dir %s
USER 65532:65532
ENTRYPOINT ["%s"]
`, s.BaseImage, s.Package, s.Package)
		entrypoint := append([]string{s.Package}, s.Arguments...)
		return df, entrypoint, nil

	default:
		return "", nil, fmt.Errorf("unsupported target kind %q", s.Kind)
	}
}

// BuildIsolatedTarget builds the Docker image in isolation and inspects its exact sha256 digest.
func BuildIsolatedTarget(ctx context.Context, spec *TargetSpec) (string, []string, error) {
	docker, err := exec.LookPath("docker")
	if err != nil {
		return "", nil, fmt.Errorf("docker CLI required for automated image building: %w", err)
	}

	dockerfile, entrypoint, err := spec.GenerateDockerfile()
	if err != nil {
		return "", nil, err
	}

	buildDir, err := os.MkdirTemp("", "mcp-lock-wrap-*")
	if err != nil {
		return "", nil, err
	}
	defer os.RemoveAll(buildDir)

	dfPath := filepath.Join(buildDir, "Dockerfile")
	if err := os.WriteFile(dfPath, []byte(dockerfile), 0600); err != nil {
		return "", nil, err
	}

	tag := fmt.Sprintf("mcp-lock-auto-%s:latest", sanitizeTag(spec.Package))
	buildCmd := exec.CommandContext(ctx, docker, "build", "-t", tag, "-f", dfPath, buildDir)
	output, err := buildCmd.CombinedOutput()
	if err != nil {
		return "", nil, fmt.Errorf("building isolated target container: %w\n%s", err, string(output))
	}

	inspectCmd := exec.CommandContext(ctx, docker, "image", "inspect", tag, "--format", "{{.Id}}")
	inspectOut, err := inspectCmd.Output()
	if err != nil {
		return "", nil, fmt.Errorf("inspecting built image ID: %w", err)
	}

	imageDigest := strings.TrimSpace(string(inspectOut))
	if !strings.HasPrefix(imageDigest, "sha256:") {
		return "", nil, fmt.Errorf("invalid image digest returned: %q", imageDigest)
	}

	return imageDigest, entrypoint, nil
}

// WrapAndConfig parses a command, builds an isolated pinned image, and produces a complete Config.
func WrapAndConfig(ctx context.Context, args []string, protocolMode string) (config.Config, error) {
	spec, err := ParseCommandTarget(args)
	if err != nil {
		return config.Config{}, err
	}

	digest, entrypoint, err := BuildIsolatedTarget(ctx, spec)
	if err != nil {
		return config.Config{}, err
	}

	if protocolMode == "" {
		protocolMode = "modern"
	}

	return config.Config{
		SchemaVersion: config.SchemaVersion,
		Image:         digest,
		Entrypoint:    entrypoint,
		ProtocolMode:  protocolMode,
		FixtureMounts: []config.FixtureMount{},
		Scenarios:     []mcpclient.Scenario{},
	}, nil
}

func sanitizeTag(s string) string {
	s = strings.ReplaceAll(s, "@", "")
	s = strings.ReplaceAll(s, "/", "-")
	var b strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			b.WriteRune(r)
		} else if r >= 'A' && r <= 'Z' {
			b.WriteRune(r + 32)
		} else {
			b.WriteRune('-')
		}
	}
	return b.String()
}
