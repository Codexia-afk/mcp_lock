package normalize

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	"path"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"mcp-lock/internal/lockfile"
)

// RawTraceEvent represents a captured low-level OS event before normalization.
type RawTraceEvent struct {
	Syscall      string
	Path         string
	Flags        string
	ReturnCode   int
	TargetHost   string
	TargetPort   int
	ExecDigest   string
	ScenarioName string
}

var (
	// strace line regexes
	// e.g. openat(AT_FDCWD, "/fixtures/public.txt", O_RDONLY|O_CLOEXEC) = 3
	openatRe = regexp.MustCompile(`openat\([^,]+,\s*"([^"]+)",\s*([^)]+)\)\s*=\s*(-?\d+)`)
	openRe   = regexp.MustCompile(`open\("([^"]+)",\s*([^)]+)\)\s*=\s*(-?\d+)`)
	// e.g. creat("/tmp/out", 0644) = 4
	creatRe = regexp.MustCompile(`creat\("([^"]+)",\s*[^)]+\)\s*=\s*(-?\d+)`)
	// e.g. connect(3, {sa_family=AF_INET, sin_port=htons(443), sin_addr=inet_addr("1.2.3.4")}, 16) = 0
	connectRe = regexp.MustCompile(`connect\(\d+,\s*\{[^}]*sin_port=htons\((\d+)\)[^}]*sin_addr=inet_addr\("([^"]+)"\)[^}]*\}\s*,\s*\d+\)\s*=\s*(-?\d+)`)
	// e.g. execve("/app/server", ["/app/server"], ...) = 0
	execveRe = regexp.MustCompile(`execve\("([^"]+)",\s*\[[^\]]*\],\s*[^)]+\)\s*=\s*(-?\d+)`)
)

// ParseStraceLine parses a single strace line into a RawTraceEvent if relevant.
func ParseStraceLine(line string, scenario string) (*RawTraceEvent, bool) {
	line = strings.TrimSpace(line)
	// Strip PID prefix if present (e.g. "[pid 1234] " or "1234 ")
	if idx := strings.Index(line, " "); idx > 0 {
		prefix := line[:idx]
		if _, err := strconv.Atoi(prefix); err == nil {
			line = strings.TrimSpace(line[idx:])
		} else if strings.HasPrefix(prefix, "[pid") {
			if endIdx := strings.Index(line, "] "); endIdx > 0 {
				line = strings.TrimSpace(line[endIdx+2:])
			}
		}
	}

	if m := openatRe.FindStringSubmatch(line); len(m) == 4 {
		ret, _ := strconv.Atoi(m[3])
		return &RawTraceEvent{
			Syscall:      "openat",
			Path:         m[1],
			Flags:        m[2],
			ReturnCode:   ret,
			ScenarioName: scenario,
		}, true
	}

	if m := openRe.FindStringSubmatch(line); len(m) == 4 {
		ret, _ := strconv.Atoi(m[3])
		return &RawTraceEvent{
			Syscall:      "open",
			Path:         m[1],
			Flags:        m[2],
			ReturnCode:   ret,
			ScenarioName: scenario,
		}, true
	}

	if m := creatRe.FindStringSubmatch(line); len(m) == 3 {
		ret, _ := strconv.Atoi(m[2])
		return &RawTraceEvent{
			Syscall:      "creat",
			Path:         m[1],
			Flags:        "O_WRONLY",
			ReturnCode:   ret,
			ScenarioName: scenario,
		}, true
	}

	if m := connectRe.FindStringSubmatch(line); len(m) == 4 {
		port, _ := strconv.Atoi(m[1])
		ret, _ := strconv.Atoi(m[3])
		return &RawTraceEvent{
			Syscall:      "connect",
			TargetHost:   m[2],
			TargetPort:   port,
			ReturnCode:   ret,
			ScenarioName: scenario,
		}, true
	}

	if m := execveRe.FindStringSubmatch(line); len(m) == 3 {
		ret, _ := strconv.Atoi(m[2])
		return &RawTraceEvent{
			Syscall:      "execve",
			Path:         m[1],
			ReturnCode:   ret,
			ScenarioName: scenario,
		}, true
	}

	return nil, false
}

// NormalizeEvents converts raw trace events into schema-compliant Observations.
func NormalizeEvents(raw []RawTraceEvent) ([]lockfile.Observation, error) {
	type obsKey struct {
		Kind         string
		Target       string
		ObjectDigest string
		Outcome      string
		Scenario     string
	}
	counts := map[obsKey]int{}

	for _, ev := range raw {
		var kind, target, digest, outcome string
		if ev.ReturnCode >= 0 {
			outcome = "allowed"
		} else {
			outcome = "denied"
		}

		switch ev.Syscall {
		case "openat", "open", "creat":
			cleaned := path.Clean(ev.Path)
			if !strings.HasPrefix(cleaned, "/") {
				cleaned = "/" + cleaned
			}

			// Filter benign Linux internal runtime files that occur in every dynamic exec
			if isBenignRuntimeFile(cleaned) {
				continue
			}

			if strings.Contains(ev.Flags, "O_WRONLY") || strings.Contains(ev.Flags, "O_RDWR") || ev.Syscall == "creat" {
				kind = "file.write"
			} else {
				kind = "file.read"
			}
			target = cleaned

		case "connect":
			if ev.TargetHost == "" || ev.TargetPort <= 0 || ev.TargetPort > 65535 {
				continue
			}
			// Skip internal loopback connections if any
			if ev.TargetHost == "127.0.0.1" || ev.TargetHost == "::1" {
				continue
			}
			kind = "network.connect"
			target = net.JoinHostPort(ev.TargetHost, strconv.Itoa(ev.TargetPort))

		case "execve":
			cleaned := path.Clean(ev.Path)
			if !strings.HasPrefix(cleaned, "/") {
				cleaned = "/" + cleaned
			}
			kind = "process.exec"
			target = cleaned
			if ev.ExecDigest != "" {
				digest = ev.ExecDigest
			} else {
				// Deterministic synthetic digest based on target path if runtime cannot hash binary
				sum := sha256.Sum256([]byte("exec:" + target))
				digest = "sha256:" + hex.EncodeToString(sum[:])
			}

		default:
			continue
		}

		key := obsKey{
			Kind:         kind,
			Target:       target,
			ObjectDigest: digest,
			Outcome:      outcome,
			Scenario:     ev.ScenarioName,
		}
		counts[key]++
	}

	observations := make([]lockfile.Observation, 0, len(counts))
	for k, count := range counts {
		observations = append(observations, lockfile.Observation{
			Kind:         k.Kind,
			Target:       k.Target,
			ObjectDigest: k.ObjectDigest,
			Outcome:      k.Outcome,
			Scenario:     k.Scenario,
			Count:        count,
		})
	}

	sort.Slice(observations, func(i, j int) bool {
		ki := observations[i].Kind + "\x00" + observations[i].Target + "\x00" + observations[i].Scenario
		kj := observations[j].Kind + "\x00" + observations[j].Target + "\x00" + observations[j].Scenario
		return ki < kj
	})

	return observations, nil
}

func isBenignRuntimeFile(p string) bool {
	// Exclude benign dynamic linker and core library lookups
	if strings.HasPrefix(p, "/etc/ld.so.") || strings.HasPrefix(p, "/lib/ld-") || strings.HasPrefix(p, "/lib64/ld-") {
		return true
	}
	if strings.HasPrefix(p, "/dev/null") || strings.HasPrefix(p, "/dev/urandom") {
		return true
	}
	return false
}

// ComputeEvidenceDigest creates a deterministic SHA-256 digest over the canonical normalized evidence.
func ComputeEvidenceDigest(serverImage string, suiteDigest string, observations []lockfile.Observation) string {
	h := sha256.New()
	fmt.Fprintf(h, "server:%s\nsuite:%s\n", serverImage, suiteDigest)

	sorted := append([]lockfile.Observation(nil), observations...)
	sort.Slice(sorted, func(i, j int) bool {
		ki := sorted[i].Kind + "\x00" + sorted[i].Target + "\x00" + sorted[i].Outcome + "\x00" + sorted[i].Scenario
		kj := sorted[j].Kind + "\x00" + sorted[j].Target + "\x00" + sorted[j].Outcome + "\x00" + sorted[j].Scenario
		return ki < kj
	})

	b, _ := json.Marshal(sorted)
	h.Write(b)
	return "sha256:" + hex.EncodeToString(h.Sum(nil))
}
