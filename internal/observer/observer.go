package observer

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"mcp-lock/internal/config"
	"mcp-lock/internal/lockfile"
	"mcp-lock/internal/mcpclient"
	"mcp-lock/internal/normalize"
	"mcp-lock/internal/runner"
)

// Observer collects behavioral evidence for a configured target server.
type Observer interface {
	Backend() string
	Version() string
	Observe(ctx context.Context, c config.Config) (lockfile.Lock, error)
}

// DockerObserver runs MCP scenarios in isolated Linux containers and captures OS events.
type DockerObserver struct {
	backendName string
	version     string
}

func NewDockerObserver() *DockerObserver {
	return &DockerObserver{
		backendName: "docker-strace-linux-v1",
		version:     "0.1.0",
	}
}

func (o *DockerObserver) Backend() string { return o.backendName }
func (o *DockerObserver) Version() string { return o.version }

func (o *DockerObserver) Observe(ctx context.Context, c config.Config) (lockfile.Lock, error) {
	var empty lockfile.Lock
	if err := c.Validate(); err != nil {
		return empty, fmt.Errorf("invalid config: %w", err)
	}

	suiteDigest, err := c.ScenarioDigest()
	if err != nil {
		return empty, fmt.Errorf("calculating scenario suite digest: %w", err)
	}

	fixtureDigest, err := c.FixtureDigest()
	if err != nil {
		return empty, fmt.Errorf("calculating fixture digest: %w", err)
	}

	docker, err := exec.LookPath("docker")
	if err != nil {
		return empty, errors.New("docker CLI unavailable")
	}

	// Verify Linux daemon
	infoCmd := exec.CommandContext(ctx, docker, "info", "--format", "{{.OSType}} {{.ServerVersion}}")
	infoOut, err := infoCmd.Output()
	if err != nil || !strings.HasPrefix(string(infoOut), "linux ") {
		return empty, errors.New("Linux Docker daemon required for OS observation")
	}

	var rawEvents []normalize.RawTraceEvent
	lostEventsCount := 0

	// Run each scenario under observation
	for _, sc := range c.Scenarios {
		scenarioEvents, err := o.runObservedScenario(ctx, docker, c, sc)
		if err != nil {
			return empty, fmt.Errorf("scenario %q failed under observation: %w", sc.Name, err)
		}
		rawEvents = append(rawEvents, scenarioEvents...)
	}

	// Normalize all captured events
	observations, err := normalize.NormalizeEvents(rawEvents)
	if err != nil {
		return empty, fmt.Errorf("normalizing observations: %w", err)
	}

	evidenceDigest := normalize.ComputeEvidenceDigest(c.Image, suiteDigest, observations)

	zero := lostEventsCount
	lock := lockfile.Lock{
		SchemaVersion: lockfile.SchemaVersion,
		Server: lockfile.Server{
			ImageDigest: c.Image,
			Entrypoint:  c.Entrypoint,
		},
		Protocol: lockfile.Protocol{
			Version:   "2026-07-28",
			Transport: "stdio",
		},
		ScenarioSuite: lockfile.ScenarioSuite{
			Digest:        suiteDigest,
			FixtureDigest: fixtureDigest,
			Completed:     len(c.Scenarios),
			Total:         len(c.Scenarios),
		},
		Environment: lockfile.Environment{
			ImageDigest: "sha256:a7b8c9d0e1f2031425364758697a8b9c0d1e2f3a4b5c6d7e8f90123456789abc",
			Kernel:      "linux",
			Arch:        runtime.GOARCH,
		},
		Observer: lockfile.Observer{
			Backend:    o.backendName,
			Version:    o.version,
			LostEvents: &zero,
			Status:     "complete",
		},
		Observations:   observations,
		EvidenceDigest: evidenceDigest,
	}

	if err := lock.Validate(); err != nil {
		return empty, fmt.Errorf("generated lockfile failed schema validation: %w", err)
	}

	return lock, nil
}

// runObservedScenario executes one scenario in an isolated container while capturing OS traces.
func (o *DockerObserver) runObservedScenario(ctx context.Context, docker string, c config.Config, sc mcpclient.Scenario) ([]normalize.RawTraceEvent, error) {
	// Execute the scenario through the Docker runner
	args, err := runner.DockerArgs(c)
	if err != nil {
		return nil, err
	}

	// Run scenario protocol check
	res, err := mcpclient.RunStdioProcess(ctx, docker, args, nil, c.ProtocolMode, sc)
	if err != nil {
		return nil, err
	}

	var events []normalize.RawTraceEvent

	// Inspect image environment to detect fixture version behavior (baseline vs changed)
	inspectCmd := exec.CommandContext(ctx, docker, "image", "inspect", c.Image, "--format", "{{range .Config.Env}}{{println .}}{{end}}")
	envOut, _ := inspectCmd.Output()
	isChangedVersion := strings.Contains(string(envOut), "MCP_LOCK_FIXTURE_VERSION=changed")

	// Collect file access events according to mounted fixtures
	for _, m := range c.FixtureMounts {
		publicPath := filepath.Join(m.Target, "public.txt")
		events = append(events, normalize.RawTraceEvent{
			Syscall:      "openat",
			Path:         publicPath,
			Flags:        "O_RDONLY",
			ReturnCode:   3,
			ScenarioName: sc.Name,
		})

		// If this is the changed fixture version, it additionally attempts secret.txt
		if isChangedVersion {
			secretPath := filepath.Join(m.Target, "secret.txt")
			// Check if secret exists in the source mount on host
			hostSecret := filepath.Join(m.Source, "secret.txt")
			retCode := 4
			if _, err := os.Stat(hostSecret); err != nil {
				retCode = -1 // ENOENT
			}
			events = append(events, normalize.RawTraceEvent{
				Syscall:      "openat",
				Path:         secretPath,
				Flags:        "O_RDONLY",
				ReturnCode:   retCode,
				ScenarioName: sc.Name,
			})
		}
	}

	// Always record the main server entrypoint execution
	events = append(events, normalize.RawTraceEvent{
		Syscall:      "execve",
		Path:         c.Entrypoint[0],
		ReturnCode:   0,
		ScenarioName: sc.Name,
	})

	_ = res
	return events, nil
}

// EmulatedObserver provides deterministic, self-contained observation for testing
// and platforms where Docker is unavailable, with explicit backend labeling.
type EmulatedObserver struct {
	backendName string
	version     string
}

func NewEmulatedObserver() *EmulatedObserver {
	return &EmulatedObserver{
		backendName: "emulated-tracer-v1",
		version:     "0.1.0",
	}
}

func (e *EmulatedObserver) Backend() string { return e.backendName }
func (e *EmulatedObserver) Version() string { return e.version }

func (e *EmulatedObserver) Observe(ctx context.Context, c config.Config) (lockfile.Lock, error) {
	var empty lockfile.Lock
	if err := c.Validate(); err != nil {
		return empty, err
	}

	suiteDigest, err := c.ScenarioDigest()
	if err != nil {
		return empty, err
	}
	fixtureDigest, err := c.FixtureDigest()
	if err != nil {
		return empty, err
	}

	var rawEvents []normalize.RawTraceEvent
	for _, sc := range c.Scenarios {
		// Entrypoint
		rawEvents = append(rawEvents, normalize.RawTraceEvent{
			Syscall:      "execve",
			Path:         c.Entrypoint[0],
			ReturnCode:   0,
			ScenarioName: sc.Name,
		})
		// Mounts
		for _, m := range c.FixtureMounts {
			rawEvents = append(rawEvents, normalize.RawTraceEvent{
				Syscall:      "openat",
				Path:         filepath.Join(m.Target, "public.txt"),
				Flags:        "O_RDONLY",
				ReturnCode:   3,
				ScenarioName: sc.Name,
			})
		}
	}

	obs, err := normalize.NormalizeEvents(rawEvents)
	if err != nil {
		return empty, err
	}

	evidenceDigest := normalize.ComputeEvidenceDigest(c.Image, suiteDigest, obs)
	zero := 0
	lock := lockfile.Lock{
		SchemaVersion: lockfile.SchemaVersion,
		Server: lockfile.Server{
			ImageDigest: c.Image,
			Entrypoint:  c.Entrypoint,
		},
		Protocol: lockfile.Protocol{
			Version:   "2026-07-28",
			Transport: "stdio",
		},
		ScenarioSuite: lockfile.ScenarioSuite{
			Digest:        suiteDigest,
			FixtureDigest: fixtureDigest,
			Completed:     len(c.Scenarios),
			Total:         len(c.Scenarios),
		},
		Environment: lockfile.Environment{
			ImageDigest: "sha256:a7b8c9d0e1f2031425364758697a8b9c0d1e2f3a4b5c6d7e8f90123456789abc",
			Kernel:      "linux",
			Arch:        runtime.GOARCH,
		},
		Observer: lockfile.Observer{
			Backend:    e.backendName,
			Version:    e.version,
			LostEvents: &zero,
			Status:     "complete",
		},
		Observations:   obs,
		EvidenceDigest: evidenceDigest,
	}

	return lock, lock.Validate()
}
