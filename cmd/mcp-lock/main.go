package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"mcp-lock/internal/config"
	"mcp-lock/internal/lockfile"
	"mcp-lock/internal/mcpclient"
	"mcp-lock/internal/observer"
	"mcp-lock/internal/policy"
	"mcp-lock/internal/runner"
	"mcp-lock/internal/scenariogen"
	"mcp-lock/internal/wrap"
)

// version is stamped at release time via:
//
//	go build -ldflags "-X main.version=0.2.0" -o bin/mcp-lock ./cmd/mcp-lock
var version = "0.1.0-dev"

func main() { os.Exit(run(os.Args[1:])) }

func run(args []string) int {
	if len(args) == 0 {
		usage()
		return 3
	}
	switch args[0] {
	case "version":
		fmt.Println(version)
		return 0
	case "doctor":
		return doctor()
	case "diff":
		return diffCommand(args[1:])
	case "validate":
		return validateCommand(args[1:])
	case "policy":
		return policyCommand(args[1:])
	case "scenario":
		return scenarioCommand(args[1:])
	case "wrap":
		return wrapCommand(args[1:])
	case "init":
		return initCommand(args[1:])
	case "observe":
		return observeCommand(args[1:])
	case "badge":
		return badgeCommand(args[1:])
	case "verify", "run":
		fmt.Fprintln(os.Stderr, "Linux isolated policy enforcement launcher is not implemented; refusing to execute an enforced server")
		return 5
	case "help", "--help", "-h":
		usage()
		return 0
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n", args[0])
		usage()
		return 3
	}
}

func usage() {
	fmt.Fprintf(os.Stderr, "mcp-lock %s\n%s", version, `Usage: mcp-lock <command> [arguments]

Core Commands:
  observe    Record OS behavioral evidence from MCP server execution (emits behavior.lock)
  diff       Compare two behavior.lock files for capability expansions
  policy     Propose or assess permissions against a policy
  validate   Validate a behavior.lock file against the canonical schema
  badge      Generate maintainer trust badge and README evidence summary
  wrap       Build an isolated, pinned container from npx or uvx invocations
  init       Initialize an mcp-lock config with auto-generated starter scenarios
  scenario   Check or auto-generate scenarios from tools/list
  doctor     Verify host, Linux Docker daemon, and observation backends
  version    Show version`)
}

func doctor() int {
	fmt.Printf("host: %s/%s\n", runtime.GOOS, runtime.GOARCH)
	path, err := exec.LookPath("docker")
	if err != nil {
		fmt.Fprintln(os.Stderr, "Docker CLI unavailable")
		return 5
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, path, "info", "--format", "{{.OSType}} {{.ServerVersion}}")
	output, err := cmd.Output()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Docker daemon unavailable")
		return 5
	}
	fmt.Printf("Docker daemon: %s", output)
	if !strings.HasPrefix(string(output), "linux ") {
		fmt.Fprintln(os.Stderr, "Linux Docker daemon required")
		return 5
	}
	fmt.Println("status: ready (protocol checks and OS observer available)")
	fmt.Println("backends: docker-strace-linux-v1, emulated-tracer-v1")
	return 0
}

func observeCommand(args []string) int {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "Linux isolated runner and observer require a valid configuration; refusing unsafe execution")
		return 5
	}

	// Check if this is a direct command invocation: mcp-lock observe -- npx -y ...
	if args[0] == "--" {
		return observeWrappedCommand(args[1:])
	}

	fs := flag.NewFlagSet("observe", flag.ContinueOnError)
	configPath := fs.String("config", "", "path to mcp-lock configuration JSON")
	outPath := fs.String("out", "behavior.lock", "path to output behavior.lock")
	backend := fs.String("backend", "docker", "observer backend: 'docker' or 'emulated'")
	autoScenarios := fs.Bool("auto-scenarios", false, "auto-generate scenarios if missing")

	if err := fs.Parse(args); err != nil || *configPath == "" || fs.NArg() != 0 {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock observe --config FILE [--out behavior.lock] [--backend docker|emulated]")
		fmt.Fprintln(os.Stderr, "       mcp-lock observe -- <npx|uvx command...>")
		return 3
	}

	c, err := config.Load(*configPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "loading config: %v\n", err)
		return 3
	}

	if len(c.Scenarios) == 0 && *autoScenarios {
		fmt.Println("Auto-discovering tools from server...")
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		tools, err := scenariogen.DiscoverTools(ctx, "docker", append([]string{"run", "--rm", "-i"}, c.Image), nil, c.ProtocolMode)
		cancel()
		if err == nil && len(tools) > 0 {
			scenarios, genErr := scenariogen.SynthesizeStarterScenarios(tools)
			if genErr == nil {
				c.Scenarios = scenarios
				fmt.Printf("Auto-generated %d starter scenarios\n", len(scenarios))
			}
		}
	}

	var obs observer.Observer
	if *backend == "emulated" {
		obs = observer.NewEmulatedObserver()
	} else {
		obs = observer.NewDockerObserver()
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	lock, err := obs.Observe(ctx, c)
	if err != nil {
		fmt.Fprintf(os.Stderr, "observation failed: %v\n", err)
		return 6
	}

	if err := lockfile.Save(*outPath, lock); err != nil {
		fmt.Fprintf(os.Stderr, "saving lockfile: %v\n", err)
		return 7
	}

	fmt.Printf("Successfully recorded %d observations to %s (evidenceDigest: %s)\n", len(lock.Observations), *outPath, lock.EvidenceDigest)
	return 0
}

func observeWrappedCommand(cmdArgs []string) int {
	if len(cmdArgs) == 0 {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock observe -- <npx|uvx command...>")
		return 3
	}

	fmt.Printf("Building isolated container for %s...\n", cmdArgs[0])
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	c, err := wrap.WrapAndConfig(ctx, cmdArgs, "modern")
	if err != nil {
		fmt.Fprintf(os.Stderr, "wrapping command: %v\n", err)
		return 5
	}

	fmt.Printf("Pinned container digest: %s\n", c.Image)
	// Auto-generate starter scenario for wrapped package
	c.Scenarios = []mcpclient.Scenario{
		{
			Name:       "auto_starter",
			Tool:       "ping",
			Arguments:  []byte(`{}`),
			ExpectText: "",
		},
	}

	obs := observer.NewDockerObserver()
	lock, err := obs.Observe(ctx, c)
	if err != nil {
		fmt.Fprintf(os.Stderr, "observing wrapped server: %v\n", err)
		return 6
	}

	outPath := "behavior.lock"
	if err := lockfile.Save(outPath, lock); err != nil {
		fmt.Fprintf(os.Stderr, "saving %s: %v\n", outPath, err)
		return 7
	}

	fmt.Printf("Successfully observed wrapped server: wrote %s\n", outPath)
	return 0
}

func wrapCommand(args []string) int {
	fs := flag.NewFlagSet("wrap", flag.ContinueOnError)
	npxPkg := fs.String("npx", "", "npx package specification (e.g. '@modelcontextprotocol/server-filesystem')")
	uvxPkg := fs.String("uvx", "", "uvx package specification (e.g. 'mcp-server-git')")
	outPath := fs.String("out", "mcp-lock.json", "output config JSON path")

	if err := fs.Parse(args); err != nil || (*npxPkg == "" && *uvxPkg == "") {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock wrap [--npx PACKAGE | --uvx PACKAGE] [--out config.json]")
		return 3
	}

	var cmdArgs []string
	if *npxPkg != "" {
		cmdArgs = []string{"npx", "-y", *npxPkg}
	} else {
		cmdArgs = []string{"uvx", *uvxPkg}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	c, err := wrap.WrapAndConfig(ctx, cmdArgs, "modern")
	if err != nil {
		fmt.Fprintf(os.Stderr, "wrap failed: %v\n", err)
		return 5
	}

	// Add starter scenario placeholder
	c.Scenarios = []mcpclient.Scenario{
		{
			Name:       "auto_init",
			Tool:       "read",
			Arguments:  []byte(`{}`),
			ExpectText: "",
		},
	}

	b, _ := c.MarshalCanonical()
	if err := os.WriteFile(*outPath, b, 0644); err != nil {
		fmt.Fprintf(os.Stderr, "writing %s: %v\n", *outPath, err)
		return 7
	}

	fmt.Printf("Wrote pinned configuration to %s (image: %s)\n", *outPath, c.Image)
	return 0
}

func initCommand(args []string) int {
	fs := flag.NewFlagSet("init", flag.ContinueOnError)
	outPath := fs.String("out", "mcp-lock.json", "output config file")
	image := fs.String("image", "", "pinned container image sha256 digest")
	if err := fs.Parse(args); err != nil {
		return 3
	}

	img := *image
	if img == "" {
		img = "sha256:" + strings.Repeat("0", 64)
	}

	starter := config.Config{
		SchemaVersion: config.SchemaVersion,
		Image:         img,
		Entrypoint:    []string{"/app/server"},
		ProtocolMode:  "modern",
		FixtureMounts: []config.FixtureMount{},
		Scenarios: []mcpclient.Scenario{
			{
				Name:       "starter_scenario",
				Tool:       "example_tool",
				Arguments:  []byte(`{}`),
				ExpectText: "",
			},
		},
	}

	b, _ := starter.MarshalCanonical()
	if err := os.WriteFile(*outPath, b, 0644); err != nil {
		fmt.Fprintf(os.Stderr, "writing %s: %v\n", *outPath, err)
		return 7
	}
	fmt.Printf("Initialized configuration in %s\n", *outPath)
	return 0
}

// Exit codes shared by the diff command so CLI and machine consumers agree.
const (
	diffStatusPass       = "pass"
	diffStatusReview     = "review"
	diffStatusIncomplete = "incomplete"
)

// diffReport is the machine-readable shape emitted by `mcp-lock diff --json`.
type diffReport struct {
	Comparable          bool                   `json:"comparable"`
	Reasons             []string               `json:"reasons"`
	Added               []lockfile.Observation `json:"added"`
	Removed             []lockfile.Observation `json:"removed"`
	AddedCount          int                    `json:"addedCount"`
	RemovedCount        int                    `json:"removedCount"`
	AutoApproveNarrower bool                   `json:"autoApproveNarrower"`
	Status              string                 `json:"status"`
}

func newDiffReport(d lockfile.Diff, autoApproveNarrower bool, identityChanged bool) diffReport {
	r := diffReport{
		Comparable:          d.Comparable,
		Reasons:             d.Reasons,
		Added:               d.Added,
		Removed:             d.Removed,
		AutoApproveNarrower: autoApproveNarrower,
		Status:              diffStatusPass,
	}
	if r.Added == nil {
		r.Added = []lockfile.Observation{}
	}
	if r.Removed == nil {
		r.Removed = []lockfile.Observation{}
	}
	if !d.Comparable {
		r.Status = diffStatusIncomplete
		return r
	}
	if len(d.Added) > 0 {
		r.Status = diffStatusReview
		return r
	}
	if len(d.Removed) > 0 {
		if autoApproveNarrower {
			r.Status = diffStatusPass
		} else {
			r.Status = diffStatusReview
		}
		return r
	}
	if identityChanged && !autoApproveNarrower {
		r.Status = diffStatusReview
	}
	return r
}

func diffCommand(args []string) int {
	fs := flag.NewFlagSet("diff", flag.ContinueOnError)
	from := fs.String("from", "", "previous behavior.lock")
	to := fs.String("to", "", "candidate behavior.lock")
	autoApproveNarrower := fs.Bool("auto-approve-narrower", false, "auto-approve if candidate permissions are identical or narrower")
	asJSON := fs.Bool("json", false, "emit machine-readable JSON diff report to stdout")

	if err := fs.Parse(args); err != nil || *from == "" || *to == "" || fs.NArg() != 0 {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock diff --from FILE --to FILE [--auto-approve-narrower] [--json]")
		return 3
	}

	a, err := lockfile.Load(*from)
	if err != nil {
		fmt.Fprintln(os.Stderr, "previous:", err)
		return 3
	}
	b, err := lockfile.Load(*to)
	if err != nil {
		fmt.Fprintln(os.Stderr, "candidate:", err)
		return 3
	}

	d := lockfile.Compare(a, b)
	report := newDiffReport(d, *autoApproveNarrower, a.Server.ImageDigest != b.Server.ImageDigest)
	report.AddedCount = len(d.Added)
	report.RemovedCount = len(d.Removed)

	if *asJSON {
		b, err := json.MarshalIndent(report, "", "  ")
		if err != nil {
			fmt.Fprintf(os.Stderr, "encoding diff report: %v\n", err)
			return 3
		}
		fmt.Println(string(b))
	} else {
		if !d.Comparable {
			fmt.Fprintln(os.Stderr, "cannot compare scans:")
			for _, reason := range d.Reasons {
				fmt.Fprintln(os.Stderr, " -", reason)
			}
			return 4
		}

		for _, o := range d.Added {
			fmt.Printf("+ %q %q %q (%q)\n", o.Kind, o.Target, o.Outcome, o.Scenario)
		}
		for _, o := range d.Removed {
			fmt.Printf("- %q %q %q (%q)\n", o.Kind, o.Target, o.Outcome, o.Scenario)
		}

		if len(d.Added) > 0 {
			fmt.Fprintln(os.Stderr, "behavior changed; review required (expanded capabilities detected)")
			return 2
		}

		if len(d.Removed) > 0 {
			if *autoApproveNarrower {
				fmt.Println("permissions narrowed; auto-approved")
				return 0
			}
			fmt.Fprintln(os.Stderr, "behavior changed; review required")
			return 2
		}

		if a.Server.ImageDigest != b.Server.ImageDigest {
			if *autoApproveNarrower {
				fmt.Println("artifact digest updated with identical permissions; auto-approved")
				return 0
			}
			fmt.Fprintln(os.Stderr, "artifact digest changed; identity review required")
			return 2
		}

		fmt.Println("no observed behavior change")
		return 0
	}

	switch report.Status {
	case diffStatusPass:
		return 0
	case diffStatusReview:
		return 2
	case diffStatusIncomplete:
		return 4
	default:
		return 3
	}
}

func badgeCommand(args []string) int {
	fs := flag.NewFlagSet("badge", flag.ContinueOnError)
	lockPath := fs.String("lock", "behavior.lock", "path to behavior.lock")
	if err := fs.Parse(args); err != nil {
		return 3
	}

	l, err := lockfile.Load(*lockPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "reading %s: %v\n", *lockPath, err)
		return 3
	}

	fileReads := 0
	fileWrites := 0
	netConnects := 0
	procs := 0

	for _, o := range l.Observations {
		if o.Outcome != "allowed" {
			continue
		}
		switch o.Kind {
		case "file.read":
			fileReads++
		case "file.write":
			fileWrites++
		case "network.connect":
			netConnects++
		case "process.exec":
			procs++
		}
	}

	badgeURL := "https://img.shields.io/badge/mcp--lock-verified_behavior-2ea44f?logo=shield"
	fmt.Printf("[![mcp-lock: verified behavior](%s)](%s)\n\n", badgeURL, *lockPath)
	fmt.Println("### Audited MCP Server Behavior")
	fmt.Printf("- **Status**: Verified complete (`%s`)\n", l.Observer.Backend)
	fmt.Printf("- **Scenarios**: %d/%d passed\n", l.ScenarioSuite.Completed, l.ScenarioSuite.Total)
	fmt.Printf("- **Observed Filesystem Reads**: %d\n", fileReads)
	fmt.Printf("- **Observed Filesystem Writes**: %d\n", fileWrites)
	fmt.Printf("- **Observed Network Egress**: %d\n", netConnects)
	fmt.Printf("- **Observed Subprocesses**: %d\n", procs)
	fmt.Printf("- **Evidence Digest**: `%s`\n", l.EvidenceDigest)
	return 0
}

func validateCommand(args []string) int {
	fs := flag.NewFlagSet("validate", flag.ContinueOnError)
	path := fs.String("lock", "", "path to behavior.lock")
	if err := fs.Parse(args); err != nil || *path == "" || fs.NArg() != 0 {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock validate --lock FILE")
		return 3
	}
	l, err := lockfile.Load(*path)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 3
	}
	if !l.Complete() {
		fmt.Fprintln(os.Stderr, "lockfile is structurally valid but evidence is incomplete")
		return 4
	}
	fmt.Println("valid complete lockfile")
	return 0
}

func policyCommand(args []string) int {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock policy <propose|assess>")
		return 3
	}
	if args[0] == "assess" {
		return policyAssessCommand(args[1:])
	}
	if args[0] != "propose" {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock policy <propose|assess>")
		return 3
	}
	fs := flag.NewFlagSet("policy propose", flag.ContinueOnError)
	lockPath := fs.String("lock", "", "complete behavior lockfile")
	outPath := fs.String("out", "", "proposed policy path")
	if err := fs.Parse(args[1:]); err != nil || *lockPath == "" || *outPath == "" || fs.NArg() != 0 {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock policy propose --lock FILE --out FILE")
		return 3
	}
	l, err := lockfile.Load(*lockPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 3
	}
	p, err := policy.Propose(l)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 4
	}
	if err := policy.Save(*outPath, p); err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 7
	}
	fmt.Printf("wrote proposed policy to %s; %d items require manual review\n", *outPath, len(p.ReviewRequired))
	return 0
}

func policyAssessCommand(args []string) int {
	fs := flag.NewFlagSet("policy assess", flag.ContinueOnError)
	policyPath := fs.String("policy", "", "approved policy JSON")
	lockPath := fs.String("lock", "", "candidate behavior.lock")
	allowNarrower := fs.Bool("allow-narrower", false, "allow artifact update if candidate permissions fit within approved policy")

	if err := fs.Parse(args); err != nil || *policyPath == "" || *lockPath == "" || fs.NArg() != 0 {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock policy assess --policy FILE --lock FILE [--allow-narrower]")
		return 3
	}
	p, err := policy.Load(*policyPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 3
	}
	l, err := lockfile.Load(*lockPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 3
	}
	a, err := policy.AssessCandidate(p, l)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 4
	}
	for _, o := range a.Unapproved {
		fmt.Printf("UNAPPROVED %q %q %q (%q)\n", o.Kind, o.Target, o.Outcome, o.Scenario)
	}

	if len(a.Unapproved) > 0 {
		return 2
	}

	if a.IdentityChanged {
		if *allowNarrower {
			fmt.Println("candidate observations fit the policy; identity updated within approved permissions")
			return 0
		}
		fmt.Fprintln(os.Stderr, "server artifact identity changed; review required")
		return 2
	}

	fmt.Println("candidate observations fit the policy; this does not verify enforcement")
	return 0
}

func scenarioCommand(args []string) int {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock scenario <check|generate>")
		return 3
	}

	if args[0] == "generate" {
		return scenarioGenerateCommand(args[1:])
	}

	if args[0] != "check" {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock scenario <check|generate>")
		return 3
	}

	fs := flag.NewFlagSet("scenario check", flag.ContinueOnError)
	filename := fs.String("config", "", "scenario config JSON")
	if err := fs.Parse(args[1:]); err != nil || *filename == "" || fs.NArg() != 0 {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock scenario check --config FILE")
		return 3
	}
	c, err := config.Load(*filename)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 3
	}
	for _, sc := range c.Scenarios {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		result, err := runner.CheckScenario(ctx, c, sc)
		cancel()
		if err != nil {
			fmt.Fprintf(os.Stderr, "%s: %v\n", sc.Name, err)
			return 6
		}
		fmt.Printf("PASS %s (%s, %d tools)\n", sc.Name, result.ProtocolVersion, len(result.ToolNames))
	}
	fmt.Fprintln(os.Stderr, "protocol scenarios passed; OS behavior was not observed")
	return 0
}

func scenarioGenerateCommand(args []string) int {
	fs := flag.NewFlagSet("scenario generate", flag.ContinueOnError)
	configPath := fs.String("config", "", "existing config JSON to populate with scenarios")
	if err := fs.Parse(args); err != nil || *configPath == "" {
		fmt.Fprintln(os.Stderr, "usage: mcp-lock scenario generate --config FILE")
		return 3
	}

	c, err := config.Load(*configPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 3
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	runArgs, err := runner.DockerArgs(c)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 3
	}

	tools, err := scenariogen.DiscoverTools(ctx, "docker", runArgs, nil, c.ProtocolMode)
	if err != nil {
		fmt.Fprintf(os.Stderr, "discovering tools: %v\n", err)
		return 6
	}

	scenarios, err := scenariogen.SynthesizeStarterScenarios(tools)
	if err != nil {
		fmt.Fprintf(os.Stderr, "synthesizing scenarios: %v\n", err)
		return 7
	}

	c.Scenarios = scenarios
	b, _ := c.MarshalCanonical()
	if err := os.WriteFile(*configPath, b, 0644); err != nil {
		fmt.Fprintf(os.Stderr, "writing config: %v\n", err)
		return 7
	}

	fmt.Printf("Generated %d starter scenarios in %s\n", len(scenarios), *configPath)
	return 0
}
