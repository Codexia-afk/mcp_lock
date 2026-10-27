package wrap

import (
	"strings"
	"testing"
)

func TestParseCommandTarget(t *testing.T) {
	tests := []struct {
		name      string
		args      []string
		wantKind  TargetKind
		wantPkg   string
		wantArgs  int
		wantError bool
	}{
		{
			name:      "npx with -y and args",
			args:      []string{"npx", "-y", "@modelcontextprotocol/server-filesystem@0.6.2", "/allowed"},
			wantKind:  KindNPX,
			wantPkg:   "@modelcontextprotocol/server-filesystem@0.6.2",
			wantArgs:  1,
			wantError: false,
		},
		{
			name:      "npx simple package",
			args:      []string{"npx", "mcp-simple"},
			wantKind:  KindNPX,
			wantPkg:   "mcp-simple",
			wantArgs:  0,
			wantError: false,
		},
		{
			name:      "uvx with package and flag",
			args:      []string{"uvx", "mcp-server-git", "--repository", "/repo"},
			wantKind:  KindUVX,
			wantPkg:   "mcp-server-git",
			wantArgs:  2,
			wantError: false,
		},
		{
			name:      "unsupported command",
			args:      []string{"cargo", "run"},
			wantError: true,
		},
		{
			name:      "empty args",
			args:      []string{},
			wantError: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			spec, err := ParseCommandTarget(tc.args)
			if tc.wantError {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if spec.Kind != tc.wantKind {
				t.Errorf("expected kind %v, got %v", tc.wantKind, spec.Kind)
			}
			if spec.Package != tc.wantPkg {
				t.Errorf("expected package %q, got %q", tc.wantPkg, spec.Package)
			}
			if len(spec.Arguments) != tc.wantArgs {
				t.Errorf("expected %d args, got %d", tc.wantArgs, len(spec.Arguments))
			}
		})
	}
}

func TestGenerateDockerfile(t *testing.T) {
	spec := &TargetSpec{
		Kind:      KindNPX,
		Package:   "@modelcontextprotocol/server-filesystem",
		Arguments: []string{"/data"},
		BaseImage: "node:22-alpine",
	}

	df, entrypoint, err := spec.GenerateDockerfile()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !strings.Contains(df, "FROM node:22-alpine") {
		t.Errorf("expected FROM node:22-alpine in Dockerfile")
	}
	if !strings.Contains(df, "npm install -g @modelcontextprotocol/server-filesystem") {
		t.Errorf("expected npm install in Dockerfile")
	}
	if len(entrypoint) != 4 || entrypoint[3] != "/data" {
		t.Errorf("unexpected entrypoint: %v", entrypoint)
	}
}

func TestGenerateDockerfileRejectsUnsafePackageNames(t *testing.T) {
	spec := &TargetSpec{
		Kind:      KindNPX,
		Package:   "pkg; rm -rf /",
		BaseImage: "node:22-alpine",
	}

	_, _, err := spec.GenerateDockerfile()
	if err == nil {
		t.Fatal("expected error on command injection in package name")
	}
}
