package scenariogen

import (
	"encoding/json"
	"testing"
)

func TestSynthesizeStarterScenarios(t *testing.T) {
	schema := json.RawMessage(`{
		"type": "object",
		"properties": {
			"filePath": {"type": "string", "description": "path to file"},
			"count": {"type": "integer", "minimum": 5},
			"verbose": {"type": "boolean"},
			"mode": {"type": "string", "enum": ["read_only", "read_write"]},
			"tags": {"type": "array", "items": {"type": "string"}}
		},
		"required": ["filePath", "mode"]
	}`)

	tools := []ToolDef{
		{
			Name:        "read_data",
			Description: "Read a local dataset",
			InputSchema: schema,
		},
		{
			Name:        "ping",
			Description: "Ping server",
			InputSchema: json.RawMessage(`{}`),
		},
	}

	scenarios, err := SynthesizeStarterScenarios(tools)
	if err != nil {
		t.Fatalf("SynthesizeStarterScenarios failed: %v", err)
	}

	if len(scenarios) != 2 {
		t.Fatalf("expected 2 scenarios, got %d", len(scenarios))
	}

	if scenarios[0].Name != "auto_read_data" || scenarios[0].Tool != "read_data" {
		t.Errorf("unexpected scenario: %+v", scenarios[0])
	}

	var args map[string]any
	if err := json.Unmarshal(scenarios[0].Arguments, &args); err != nil {
		t.Fatalf("invalid synthesized JSON arguments: %v", err)
	}

	if args["filePath"] != "fixture.txt" {
		t.Errorf("expected filePath to be 'fixture.txt', got %v", args["filePath"])
	}
	if args["count"] != float64(5) {
		t.Errorf("expected count to be 5, got %v", args["count"])
	}
	if args["verbose"] != false {
		t.Errorf("expected verbose to be false, got %v", args["verbose"])
	}
	if args["mode"] != "read_only" {
		t.Errorf("expected mode to be 'read_only', got %v", args["mode"])
	}
}

func TestSynthesizeNilSchema(t *testing.T) {
	tools := []ToolDef{
		{
			Name:        "simple",
			Description: "Simple tool",
		},
	}
	scenarios, err := SynthesizeStarterScenarios(tools)
	if err != nil {
		t.Fatalf("expected nil schema to synthesize cleanly, got %v", err)
	}
	if len(scenarios) != 1 || string(scenarios[0].Arguments) != "{}" {
		t.Fatalf("unexpected scenario args: %s", string(scenarios[0].Arguments))
	}
}
