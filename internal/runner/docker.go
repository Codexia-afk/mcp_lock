// Package runner prepares the isolated Docker invocation. It does not provide
// observation or enforcement yet and must not be used as a security verdict.
package runner

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

// DockerArgs returns a shell-free, bounded, network-denied invocation for a
// disposable runner. Callers must keep the daemon socket outside the target.
func DockerArgs(c config.Config) ([]string, error) {
	if err := c.Validate(); err != nil {
		return nil, err
	}
	args := []string{
		"run", "--rm", "--interactive", "--network", "none", "--read-only",
		"--cap-drop", "ALL", "--security-opt", "no-new-privileges=true",
		"--pids-limit", "64", "--memory", "256m", "--cpus", "1",
		"--user", "65532:65532", "--tmpfs", "/tmp:rw,nosuid,nodev,size=64m",
	}
	for _, m := range c.FixtureMounts {
		if strings.ContainsAny(m.Source, ",\n\r\x00") || strings.ContainsAny(m.Target, ",\n\r\x00") {
			return nil, errors.New("fixture mount contains a Docker option delimiter")
		}
		info, err := os.Lstat(m.Source)
		if err != nil {
			return nil, err
		}
		if info.Mode()&os.ModeSymlink != 0 {
			return nil, fmt.Errorf("fixture source %q cannot be a symlink", m.Source)
		}
		if !info.IsDir() {
			return nil, errors.New("fixture source must be a directory")
		}
		abs, err := filepath.Abs(m.Source)
		if err != nil {
			return nil, err
		}
		resolved, err := filepath.EvalSymlinks(abs)
		if err != nil {
			return nil, err
		}
		if resolved != abs {
			return nil, fmt.Errorf("fixture source %q contains a symlink", m.Source)
		}
		args = append(args, "--mount", "type=bind,source="+abs+",target="+m.Target+",readonly")
	}
	args = append(args, "--entrypoint", c.Entrypoint[0], c.Image)
	args = append(args, c.Entrypoint[1:]...)
	return args, nil
}

// CheckScenario verifies MCP behavior only. It does not observe OS operations
// and must never produce a behavior.lock or security verdict.
func CheckScenario(ctx context.Context, c config.Config, sc mcpclient.Scenario) (mcpclient.Result, error) {
	args, err := DockerArgs(c)
	if err != nil {
		return mcpclient.Result{}, err
	}
	docker, err := exec.LookPath("docker")
	if err != nil {
		return mcpclient.Result{}, err
	}
	info := exec.CommandContext(ctx, docker, "info", "--format", "{{.OSType}}")
	osType, err := info.Output()
	if err != nil {
		return mcpclient.Result{}, fmt.Errorf("Docker daemon unavailable: %w", err)
	}
	if strings.TrimSpace(string(osType)) != "linux" {
		return mcpclient.Result{}, errors.New("Docker daemon must run Linux containers")
	}
	return mcpclient.RunStdioProcess(ctx, docker, args, nil, c.ProtocolMode, sc)
}
