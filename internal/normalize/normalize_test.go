package normalize

import (
	"strings"
	"testing"
)

func TestParseStraceLine(t *testing.T) {
	tests := []struct {
		line        string
		wantSyscall string
		wantPath    string
		wantRet     int
	}{
		{
			line:        `openat(AT_FDCWD, "/fixtures/public.txt", O_RDONLY|O_CLOEXEC) = 3`,
			wantSyscall: "openat",
			wantPath:    "/fixtures/public.txt",
			wantRet:     3,
		},
		{
			line:        `[pid 45] openat(AT_FDCWD, "/fixtures/secret.txt", O_RDONLY) = -1 ENOENT (No such file or directory)`,
			wantSyscall: "openat",
			wantPath:    "/fixtures/secret.txt",
			wantRet:     -1,
		},
		{
			line:        `creat("/tmp/output.dat", 0644) = 4`,
			wantSyscall: "creat",
			wantPath:    "/tmp/output.dat",
			wantRet:     4,
		},
		{
			line:        `connect(3, {sa_family=AF_INET, sin_port=htons(443), sin_addr=inet_addr("93.184.216.34")}, 16) = 0`,
			wantSyscall: "connect",
			wantRet:     0,
		},
		{
			line:        `execve("/bin/busybox", ["ls", "/"], 0x7fff) = 0`,
			wantSyscall: "execve",
			wantPath:    "/bin/busybox",
			wantRet:     0,
		},
	}

	for _, tc := range tests {
		ev, ok := ParseStraceLine(tc.line, "scenario-1")
		if !ok {
			t.Fatalf("failed to parse: %s", tc.line)
		}
		if ev.Syscall != tc.wantSyscall {
			t.Errorf("expected syscall %s, got %s", tc.wantSyscall, ev.Syscall)
		}
		if tc.wantPath != "" && ev.Path != tc.wantPath {
			t.Errorf("expected path %s, got %s", tc.wantPath, ev.Path)
		}
		if ev.ReturnCode != tc.wantRet {
			t.Errorf("expected return code %d, got %d", tc.wantRet, ev.ReturnCode)
		}
	}
}

func TestNormalizeEvents(t *testing.T) {
	raw := []RawTraceEvent{
		{
			Syscall:      "openat",
			Path:         "/fixtures/public.txt",
			Flags:        "O_RDONLY",
			ReturnCode:   3,
			ScenarioName: "read",
		},
		{
			Syscall:      "openat",
			Path:         "/fixtures/public.txt",
			Flags:        "O_RDONLY",
			ReturnCode:   4,
			ScenarioName: "read",
		},
		{
			Syscall:      "openat",
			Path:         "/fixtures/secret.txt",
			Flags:        "O_RDONLY",
			ReturnCode:   -1,
			ScenarioName: "read",
		},
		{
			Syscall:      "connect",
			TargetHost:   "93.184.216.34",
			TargetPort:   443,
			ReturnCode:   0,
			ScenarioName: "network-test",
		},
	}

	obs, err := NormalizeEvents(raw)
	if err != nil {
		t.Fatalf("NormalizeEvents failed: %v", err)
	}

	if len(obs) != 3 {
		t.Fatalf("expected 3 distinct observations, got %d", len(obs))
	}

	for _, o := range obs {
		if o.Target == "/fixtures/public.txt" {
			if o.Kind != "file.read" || o.Outcome != "allowed" || o.Count != 2 {
				t.Errorf("unexpected public.txt obs: %+v", o)
			}
		}
		if o.Target == "/fixtures/secret.txt" {
			if o.Kind != "file.read" || o.Outcome != "denied" || o.Count != 1 {
				t.Errorf("unexpected secret.txt obs: %+v", o)
			}
		}
		if o.Target == "93.184.216.34:443" {
			if o.Kind != "network.connect" || o.Outcome != "allowed" || o.Count != 1 {
				t.Errorf("unexpected network obs: %+v", o)
			}
		}
	}
}

func TestComputeEvidenceDigest(t *testing.T) {
	digest := ComputeEvidenceDigest("sha256:"+strings.Repeat("a", 64), "sha256:"+strings.Repeat("b", 64), nil)
	if !strings.HasPrefix(digest, "sha256:") || len(digest) != 71 {
		t.Fatalf("invalid evidence digest %q", digest)
	}
}
