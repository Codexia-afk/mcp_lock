// Package mcpclient contains the small stdio protocol driver used by scenarios.
// Its process launcher is used only for trusted test fixtures until the Linux
// sandbox runner is available.
package mcpclient

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os/exec"
	"slices"
	"strings"
)

const maxMessage = 1 << 20

type Scenario struct {
	Name       string          `json:"name"`
	Tool       string          `json:"tool"`
	Arguments  json.RawMessage `json:"arguments"`
	ExpectText string          `json:"expectText"`
}

type Result struct {
	ProtocolVersion string   `json:"protocolVersion"`
	ToolNames       []string `json:"toolNames"`
	Text            string   `json:"text"`
}

type Session struct {
	in   io.Writer
	out  *bufio.Scanner
	id   int
	mode string
}

type response struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id"`
	Result  json.RawMessage `json:"result"`
	Error   *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func New(in io.Writer, out io.Reader) *Session {
	scan := bufio.NewScanner(out)
	scan.Buffer(make([]byte, 4096), maxMessage)
	return &Session{in: in, out: scan}
}

func (s *Session) Connect(mode string) (string, error) {
	s.mode = mode
	switch mode {
	case "modern":
		var info struct {
			SupportedVersions []string `json:"supportedVersions"`
		}
		if err := s.request("server/discover", map[string]any{}, &info); err != nil {
			return "", err
		}
		if !slices.Contains(info.SupportedVersions, "2026-07-28") {
			return "", errors.New("server does not advertise MCP 2026-07-28")
		}
		return "2026-07-28", nil
	case "legacy":
		params := map[string]any{
			"protocolVersion": "2025-11-25",
			"capabilities":    map[string]any{},
			"clientInfo":      map[string]string{"name": "mcp-lock", "version": "0.1.0"},
		}
		var info struct {
			ProtocolVersion string `json:"protocolVersion"`
		}
		if err := s.request("initialize", params, &info); err != nil {
			return "", err
		}
		if info.ProtocolVersion == "" {
			return "", errors.New("server omitted protocol version")
		}
		if err := s.notify("notifications/initialized", map[string]any{}); err != nil {
			return "", err
		}
		return info.ProtocolVersion, nil
	default:
		return "", fmt.Errorf("unsupported protocol mode %q", mode)
	}
}

func (s *Session) RunScenario(sc Scenario) (Result, error) {
	var result Result
	var arguments map[string]json.RawMessage
	if sc.Name == "" || sc.Tool == "" || json.Unmarshal(sc.Arguments, &arguments) != nil || arguments == nil {
		return result, errors.New("scenario needs a name, tool and valid JSON arguments")
	}
	var listed struct {
		Tools []struct {
			Name string `json:"name"`
		} `json:"tools"`
		NextCursor string `json:"nextCursor"`
	}
	if err := s.request("tools/list", map[string]any{}, &listed); err != nil {
		return result, err
	}
	if listed.NextCursor != "" {
		return result, errors.New("paginated tool lists are not supported yet")
	}
	for _, tool := range listed.Tools {
		result.ToolNames = append(result.ToolNames, tool.Name)
	}
	if !slices.Contains(result.ToolNames, sc.Tool) {
		return result, fmt.Errorf("tool %q was not advertised", sc.Tool)
	}
	var called struct {
		IsError bool `json:"isError"`
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
	}
	params := map[string]any{"name": sc.Tool, "arguments": json.RawMessage(sc.Arguments)}
	if err := s.request("tools/call", params, &called); err != nil {
		return result, err
	}
	if called.IsError {
		return result, errors.New("tool returned isError")
	}
	for _, block := range called.Content {
		if block.Type == "text" {
			result.Text += block.Text
		}
	}
	if result.Text != sc.ExpectText {
		return result, fmt.Errorf("scenario %q: expected %q, got %q", sc.Name, sc.ExpectText, result.Text)
	}
	return result, nil
}

// ListToolsRaw executes tools/list and unmarshals into the given target pointer.
func (s *Session) ListToolsRaw(out any) error {
	return s.request("tools/list", map[string]any{}, out)
}

func (s *Session) request(method string, params map[string]any, out any) error {
	s.id++
	if s.mode == "modern" {
		params["_meta"] = modernMeta()
	}
	msg := map[string]any{"jsonrpc": "2.0", "id": s.id, "method": method, "params": params}
	if err := s.send(msg); err != nil {
		return err
	}
	for s.out.Scan() {
		var resp response
		if err := json.Unmarshal(s.out.Bytes(), &resp); err != nil {
			return fmt.Errorf("invalid server JSON: %w", err)
		}
		if len(resp.ID) == 0 {
			continue
		} // notifications do not answer this request.
		var got int
		if err := json.Unmarshal(resp.ID, &got); err != nil || got != s.id {
			return errors.New("unexpected JSON-RPC response ID")
		}
		if resp.JSONRPC != "2.0" {
			return errors.New("invalid JSON-RPC version")
		}
		if resp.Error != nil {
			return fmt.Errorf("MCP error %d: %q", resp.Error.Code, resp.Error.Message)
		}
		if len(resp.Result) == 0 {
			return errors.New("MCP response omitted result")
		}
		return json.Unmarshal(resp.Result, out)
	}
	if err := s.out.Err(); err != nil {
		return fmt.Errorf("reading MCP response: %w", err)
	}
	return io.EOF
}

func (s *Session) notify(method string, params map[string]any) error {
	if s.mode == "modern" {
		params["_meta"] = modernMeta()
	}
	return s.send(map[string]any{"jsonrpc": "2.0", "method": method, "params": params})
}

func (s *Session) send(value any) error {
	b, err := json.Marshal(value)
	if err != nil {
		return err
	}
	b = append(b, '\n')
	_, err = s.in.Write(b)
	return err
}

func modernMeta() map[string]any {
	return map[string]any{
		"io.modelcontextprotocol/protocolVersion":    "2026-07-28",
		"io.modelcontextprotocol/clientInfo":         map[string]string{"name": "mcp-lock", "version": "0.1.0"},
		"io.modelcontextprotocol/clientCapabilities": map[string]any{},
	}
}

// RunTrustedFixture executes a local binary for protocol integration tests only.
// Production scans must use the isolated runner; this function must not be used
// with downloaded or otherwise untrusted MCP servers.
func RunTrustedFixture(ctx context.Context, executable string, env []string, mode string, sc Scenario) (Result, error) {
	return RunStdioProcess(ctx, executable, nil, env, mode, sc)
}

// RunStdioProcess connects to a process launcher. The caller is responsible
// for ensuring that the launched MCP server is isolated from the host.
func RunStdioProcess(ctx context.Context, executable string, args []string, env []string, mode string, sc Scenario) (Result, error) {
	var result Result
	cmd := exec.CommandContext(ctx, executable, args...)
	if env != nil {
		cmd.Env = env
	}
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return result, err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return result, err
	}
	var stderr strings.Builder
	cmd.Stderr = &limitedWriter{dst: &stderr, left: 4096}
	if err := cmd.Start(); err != nil {
		return result, err
	}
	s := New(stdin, stdout)
	version, runErr := s.Connect(mode)
	if runErr == nil {
		result, runErr = s.RunScenario(sc)
		result.ProtocolVersion = version
	}
	stdin.Close()
	if runErr != nil {
		_ = cmd.Process.Kill()
	}
	waitErr := cmd.Wait()
	if runErr != nil {
		return result, runErr
	}
	if waitErr != nil {
		return result, fmt.Errorf("server process exited: %w: %q", waitErr, stderr.String())
	}
	return result, nil
}

type limitedWriter struct {
	dst  io.Writer
	left int
}

func (w *limitedWriter) Write(p []byte) (int, error) {
	n := len(p)
	if w.left > 0 {
		copyLen := min(n, w.left)
		_, _ = w.dst.Write(p[:copyLen])
		w.left -= copyLen
	}
	return n, nil
}
