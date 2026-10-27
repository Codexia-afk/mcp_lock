package scenariogen

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os/exec"
	"strings"

	"mcp-lock/internal/config"
	"mcp-lock/internal/mcpclient"
)

// ToolDef represents a tool advertised by an MCP server during tools/list.
type ToolDef struct {
	Name        string          `json:"name"`
	Description string          `json:"description,omitempty"`
	InputSchema json.RawMessage `json:"inputSchema,omitempty"`
}

// SynthesizeStarterScenarios generates safe, reproducible test scenarios from
// advertised MCP tools and their JSON schemas. This removes the primary
// adoption barrier: maintainers having to hand-write scenario JSON files.
func SynthesizeStarterScenarios(tools []ToolDef) ([]mcpclient.Scenario, error) {
	if len(tools) == 0 {
		return nil, errors.New("cannot generate scenarios: no tools advertised by server")
	}

	scenarios := make([]mcpclient.Scenario, 0, len(tools))
	for _, tool := range tools {
		args, err := SynthesizeArguments(tool.InputSchema)
		if err != nil {
			// Fallback to empty JSON object if schema synthesis fails
			args = json.RawMessage(`{}`)
		}

		scenarios = append(scenarios, mcpclient.Scenario{
			Name:       "auto_" + sanitizeName(tool.Name),
			Tool:       tool.Name,
			Arguments:  args,
			ExpectText: "", // By default in auto-mode, any non-error response or completed call is accepted
		})
	}
	return scenarios, nil
}

// SynthesizeArguments inspects a JSON Schema object and synthesizes safe sample arguments.
func SynthesizeArguments(schemaRaw json.RawMessage) (json.RawMessage, error) {
	if len(schemaRaw) == 0 || string(schemaRaw) == "null" {
		return json.RawMessage(`{}`), nil
	}

	var schema map[string]any
	if err := json.Unmarshal(schemaRaw, &schema); err != nil {
		return json.RawMessage(`{}`), err
	}

	synthesized := synthesizeValue("", schema)
	b, err := json.Marshal(synthesized)
	if err != nil {
		return json.RawMessage(`{}`), err
	}
	return json.RawMessage(b), nil
}

// synthesizeValue recursively generates safe dummy values matching the JSON schema.
func synthesizeValue(propName string, schema map[string]any) any {
	if schema == nil {
		return map[string]any{}
	}

	// 1. Check for explicit default
	if def, ok := schema["default"]; ok && def != nil {
		return def
	}

	// 2. Check for enum
	if rawEnum, ok := schema["enum"]; ok {
		if enumList, ok := rawEnum.([]any); ok && len(enumList) > 0 {
			return enumList[0]
		}
	}

	// 3. Inspect type
	rawType, ok := schema["type"]
	if !ok {
		// If properties are present without explicit type, treat as object
		if _, hasProps := schema["properties"]; hasProps {
			rawType = "object"
		} else {
			return "test"
		}
	}

	typeName, _ := rawType.(string)
	switch typeName {
	case "string":
		return synthesizeSafeString(propName, schema)
	case "integer", "number":
		if minVal, ok := schema["minimum"].(float64); ok {
			return int(minVal)
		}
		return 1
	case "boolean":
		return false
	case "array":
		if itemsRaw, ok := schema["items"].(map[string]any); ok {
			return []any{synthesizeValue(propName+"_item", itemsRaw)}
		}
		return []any{}
	case "object":
		result := map[string]any{}
		if propsRaw, ok := schema["properties"].(map[string]any); ok {
			for name, subProp := range propsRaw {
				if subSchema, ok := subProp.(map[string]any); ok {
					result[name] = synthesizeValue(name, subSchema)
				} else {
					result[name] = "test"
				}
			}
		}
		return result
	default:
		return "test"
	}
}

// synthesizeSafeString provides context-aware safe values to avoid triggering accidental host mutations.
func synthesizeSafeString(propName string, schema map[string]any) string {
	lower := strings.ToLower(propName)
	if strings.Contains(lower, "path") || strings.Contains(lower, "file") {
		return "fixture.txt"
	}
	if strings.Contains(lower, "dir") || strings.Contains(lower, "folder") {
		return "/tmp"
	}
	if strings.Contains(lower, "url") || strings.Contains(lower, "uri") {
		return "https://example.com/test"
	}
	if strings.Contains(lower, "email") {
		return "test@example.com"
	}
	if strings.Contains(lower, "query") || strings.Contains(lower, "search") {
		return "test search query"
	}
	if strings.Contains(lower, "id") {
		return "1"
	}
	if strings.Contains(lower, "format") {
		return "text"
	}
	return "test"
}

func sanitizeName(s string) string {
	var b strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '-' {
			b.WriteRune(r)
		} else {
			b.WriteRune('_')
		}
	}
	return b.String()
}

// DiscoverTools connects to an MCP server using stdio and queries tools/list with full schema details.
func DiscoverTools(ctx context.Context, executable string, args []string, env []string, mode string) ([]ToolDef, error) {
	cmd := exec.CommandContext(ctx, executable, args...)
	if env != nil {
		cmd.Env = env
	}
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	defer func() {
		_ = cmd.Process.Kill()
		_ = cmd.Wait()
	}()

	session := mcpclient.New(stdin, stdout)
	if _, err := session.Connect(mode); err != nil {
		return nil, fmt.Errorf("connecting to MCP server: %w", err)
	}

	type listResponse struct {
		Tools []ToolDef `json:"tools"`
	}
	var resp listResponse
	// Query tools/list using internal session request
	if err := queryToolsList(session, &resp); err != nil {
		return nil, fmt.Errorf("querying tools/list: %w", err)
	}
	return resp.Tools, nil
}

// queryToolsList invokes tools/list on the session and returns advertised tools with schemas.
func queryToolsList(s *mcpclient.Session, out any) error {
	// Call tools/list with modern or legacy fallback
	type toolQueryReq struct {
		JSONRPC string         `json:"jsonrpc"`
		ID      int            `json:"id"`
		Method  string         `json:"method"`
		Params  map[string]any `json:"params"`
	}
	// We can use session's tools list logic or custom query
	return s.ListToolsRaw(out)
}

// GenerateStarterConfig constructs a complete Config object with auto-generated scenarios.
func GenerateStarterConfig(image string, entrypoint []string, tools []ToolDef, mode string) (config.Config, error) {
	scenarios, err := SynthesizeStarterScenarios(tools)
	if err != nil {
		return config.Config{}, err
	}

	return config.Config{
		SchemaVersion: config.SchemaVersion,
		Image:         image,
		Entrypoint:    entrypoint,
		ProtocolMode:  mode,
		FixtureMounts: []config.FixtureMount{},
		Scenarios:     scenarios,
	}, nil
}
