# 10-Maintainer Outreach Kit & Interview Protocol (Weeks 5–6)

**Purpose:** Validate maintainer demand for `mcp-lock`, test adoption friction, and measure whether maintainers will install the GitHub Action and display the trust badge in their repositories.

---

## 1. Candidate Selection Matrix (10 Maintainers)

Target 10 maintainers across diverse ecosystems and hosting topologies by week 5–6:

| # | Maintainer Category | Ecosystem | Target Package Archetype | Key Hypothesis to Test |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Official / Reference | TypeScript | Core tools (`server-filesystem`, `server-everything`) | Will the core ecosystem adopt `action.yml` to set the standard? |
| 2 | Python Community | Python/uv | Database / system tools (`mcp-server-git`, `sqlite`) | Does `npx`/`uvx` auto-wrapping remove the Docker friction barrier? |
| 3 | SaaS Integrator | TypeScript | Cloud API servers (`server-slack`, `server-github`) | Do maintainers value cryptographic proof that API keys aren't leaked? |
| 4 | Enterprise Internal | Go | Internal corporate gateway servers | Is offline policy assessment and air-gapped CI compliance a requirement? |
| 5 | Indie / Solo Dev | TypeScript | Notes & personal search (`server-brave`, `obsidian`) | Will solo developers accept auto-generated scenarios without manual tuning? |
| 6 | Browser Automation | Node/TS | Headless browser (`server-puppeteer`) | How do maintainers react to heavy subprocess/socket footprints in evidence? |
| 7 | Data Engineering | Python | Database connectors (`server-postgres`, `server-redis`) | Are port-level network rules sufficient for external database egress? |
| 8 | DevOps & Cloud | Go/Python | Infrastructure tools (`server-docker`, `cloudflare`) | Does the maintainer want the badge to signal enterprise safety? |
| 9 | AI Agent Framework | TypeScript | Multi-tool orchestrators (e.g. LangChain, Cursor plugins) | Will host platforms verify `behavior.lock` before starting untrusted servers? |
| 10 | Security Researcher | Any | High-privilege toolkits | Can they bypass observation with symlinks, dirfd, or signal tampering? |

---

## 2. 30-Minute Interview Protocol

### Introduction (5 mins)
- Brief overview: "We built `mcp-lock` to give MCP maintainers a way to prove what their servers touch, prevent malicious dependency takeover, and display a verified badge to users."
- Confirm consent to record and take notes.

### Problem Exploration (5 mins)
1. "When users or enterprise teams install your MCP server, what security questions do they ask you?"
2. "How do you currently verify that an updated npm/pip dependency doesn't secretly phone home or read local SSH keys?"
3. "Have you had users express hesitation about running local `stdio` servers with full filesystem access?"

### Live Demo: The Two-Version Fixture Walkthrough (10 mins)
Run `./scripts/demo-two-version-gate.sh` live on screen:
1. Show two server versions with identical `tools/list` interfaces and identical responses.
2. Run `mcp-lock observe` on both.
3. Show `mcp-lock diff`: immediately highlighting `+ "file.read" "/fixtures/secret.txt"`.
4. Show how the GitHub Action automatically comments on PRs and blocks unauthorized capability expansions.
5. Show the generated Trust Badge: `[![mcp-lock verified]](behavior.lock)`.

### Reaction & Friction Diagnosis (7 mins)
1. **Scenario Writing Friction:** "In earlier designs, users had to hand-write test scenarios in JSON. We added `mcp-lock init --generate` to infer starter tests directly from your `tools/list` schema. Does that eliminate the friction?"
2. **Digest Bump Fatigue:** "If every version bump required manual re-approval, it would slow down CI. We added `--auto-approve-narrower` so code bumps with identical or narrower permissions pass automatically. Would you enable that in your repository?"
3. **Badge Value:** "Would you paste the verified behavior badge and permissions summary table into your project's README?"
4. **Action Integration:** "Would you merge a PR adding `.github/workflows/audit.yml` using `modelcontextprotocol/mcp-lock@v1`?"

### Wrap-Up & Beta Cohort Invitation (3 mins)
- Offer early onboarding: "Can we submit a PR to your repo adding `mcp-lock.json`, generating your first `behavior.lock`, and adding the badge?"
- Log next steps.

---

## 3. Scorecard & Success Criteria

| Metric | Target Goal | Meaning |
| :--- | :--- | :--- |
| **Value Proposition Resonance** | ≥ 8 of 10 | Agrees that proving runtime innocence is valuable for adoption. |
| **Willingness to Add Badge** | ≥ 7 of 10 | Would display `[![mcp-lock verified]]` in README. |
| **Action Adoption Commitment** | ≥ 6 of 10 | Agree to merge or test the GitHub Action in their repository. |
| **Auto-Scenario Acceptability** | ≥ 8 of 10 | Believes auto-generated starter scenarios are sufficient for initial locks. |
| **Report Impact** | ≥ 9 of 10 | Surprised by what popular servers actually touch in `POPULAR_MCP_SERVERS_REPORT.md`. |
