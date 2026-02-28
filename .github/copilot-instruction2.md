# WAF Rule Simulator — Context & Plan

## 1) Context

Teams using Azure Front Door (AFD) and Application Gateway (AppGW) Web Application Firewall often struggle to predict the impact of rule sets and custom exclusions before deploying to live traffic. Production rollouts cause false positives/negatives, support noise, and emergency rollbacks. There’s no lightweight way to safely “dry‑run” policies against representative requests/responses, share test packs, and export compliant policies + docs.

**Product idea:** A browser‑based simulator that lets you **design, test, and document** AFD/AppGW WAF policies. Paste or craft requests, run them through a local rules engine that approximates Microsoft’s behavior (OWASP CRS‑inspired + Azure policy model), see what would be blocked, and export policy JSON, documentation, and CI fixtures.

## 2) Goals & Non‑Goals

**Goals**

* Rapidly iterate on WAF policies for AFD/AppGW via a visual editor and JSON.
* Simulate requests to understand rule hits, actions (Allow/Block/Log), and matched evidence.
* Provide **explainability**: show ordering, precedence, and which clause matched.
* Export **Azure‑shaped** policy JSON (AFD/AppGW) and a Markdown “Policy Doc”.
* Support **test packs** (collections of requests + expected outcomes) and a CLI/CI harness.

**Non‑Goals (MVP)**

* 1:1 parity with proprietary managed rule internals.
* Real‑time integration with live WAF telemetry.
* Full coverage of all AFD/AppGW features on day one (start with core custom rules + OWASP categories).

## 3) Personas & JTBD

* **Cloud Security Engineer** — “I need to verify a rule won’t break production before rollout.”
* **Platform Engineer** — “I want consistent, reusable policy presets across workloads.”
* **Dev/QA** — “I want a test I can run in CI that proves requests I care about stay allowed.”
* **Consultant/Architect** — “I need to show clients what changed and why.”

## 4) Key Use Cases

1. Design a new block rule (e.g., block admin paths) and run sample payloads.
2. Import existing WAF policy JSON → tweak → re‑test → export.
3. Attach **exclusions** (headers/cookies/args) and confirm FP rate drops.
4. Build a **test pack** for a specific app (login, checkout, API calls) and baseline.
5. Compare two policy versions and show diffs + rule coverage.

## 5) Functional Requirements (MVP)

* **Policy Editor**: Visual + JSON side‑by‑side. Supports:

  * Policy metadata (name, mode), rule ordering, rule groups.
  * Rule types: Match (operators: equals, contains, regex, wildcard), GeoIP (stubbed), IP lists, Method, Size limits (body/header), Rate limit (simulated window), Bot signatures (basic UA patterns), OWASP category toggles (coarse).
  * **Targets**: AFD vs AppGW schema selector (output shapes differ).
  * **Exclusions**: name, location (header/cookie/query/body), operator.
* **Request Lab**: Craft requests (method, URL, path, headers, cookies, query/body). Import HAR/cURL.
* **Simulator**: Deterministic evaluation engine with rule hit trace (order, match evidence, short‑circuit points). Actions: Allow, Block, Log, Redirect (302 w/Location).
* **Results View**: Verdict, matched rules, evidence (field/value), suggested exclusions.
* **Export**: Azure‑shaped policy JSON + Markdown documentation (policy overview, rules table, exclusions, test pack summary).
* **Test Packs**: Save a suite of requests with expected outcomes; run in UI; export as JSON fixtures and a Node CLI for CI.

## 6) Nice‑to‑Have / Pro (post‑MVP)

* **Team Library**: Shared presets, versioned policy bundles, approvals.
* **History & Diffs**: Timeline of changes with semantic diffs and coverage metrics.
* **Live Validate**: Import sample traffic logs (e.g., App Insights) → replay in simulator (PII‑safe sampling).
* **Policy Linter**: Duplicate/conflicting rules, unreachable clauses, shadowed rules.
* **Coverage Heatmap**: Which test pack endpoints are protected by which rule groups.
* **Signed Exports**: Policy artifact signing, provenance.

## 7) Architecture (MVP)

* **Frontend only** (Next.js App Router, TypeScript, Tailwind, shadcn/ui). No backend required. All data stays client‑side (LocalStorage/IndexedDB). Optional file import/export.
* **Rules Engine**: TS module (pure functions) or Rust→WASM for performance later.
* **Parsers**: cURL/HAR → Request objects. Lightweight Geo/IP and UA parsers (stubbed).
* **Exporters**: Map internal PolicyModel → AFD/AppGW JSON shapes; generate Markdown docs.
* **CLI (optional)**: Node script that reuses the same rules engine for CI (npm package).

## 8) Data Model (sketch)

```ts
// Internal normalized model
interface PolicyModel {
  target: 'AFD' | 'AppGW';
  name: string;
  mode: 'Prevention' | 'Detection';
  rules: Rule[];            // ordered
  exclusions: Exclusion[];  // global
  managedSets?: ManagedSet[]; // OWASP categories toggle + threshold
}

type RuleType = 'match'|'ip'|'geo'|'method'|'size'|'rate'|'bot';
interface Rule {
  id: string; action: 'Allow'|'Block'|'Log'|'Redirect';
  type: RuleType; disabled?: boolean; order: number;
  when: Condition[]; // all must match (AND); groupings allow OR blocks
  redirectUrl?: string; // if action == Redirect
}

interface Condition {
  field: 'path'|'query'|'header'|'cookie'|'body'|'ip'|'country'|'method'|'ua'|'size_body'|'size_header'|'rate';
  key?: string; // e.g., header name
  op: 'equals'|'contains'|'startsWith'|'endsWith'|'wildcard'|'regex'|'in'|'gt'|'lt';
  value?: string | string[] | number;
}

interface Exclusion { location: 'header'|'cookie'|'query'|'body'; key: string; op: 'equals'|'contains'|'regex'; value: string; }
```

## 9) Evaluation Semantics

* **Ordering**: Evaluate rules by ascending `order`. Stop at first terminal action (Block/Allow/Redirect). `Log` is non‑terminal.
* **AND/OR**: Conditions in a rule default AND; add **groups** for OR (UI: “Add OR group”).
* **Exclusions**: Applied before evaluation; excluded fields removed/normalized.
* **Managed Sets**: Coarse category switches (e.g., SQLi, XSS) modeled as pre‑rules with known signatures/regex stubs.
* **Rate Limit**: For simulation, accept a sequence of requests/time; show when threshold triggers.

## 10) Mapping to Azure Exports

* **AFD**: `policySettings`, `managedRules`, `customRules` (priority, action, matchConditions, transforms, exclusions).
* **AppGW**: `policySettings`, `managedRules` (ruleSetType/Version), `customRules` (ruleType, matchVariables, operator, negation, transforms, action), `exclusions`.
* **Strategy**: Keep `PolicyModel` provider‑agnostic; write `toAFD(model)` and `toAppGW(model)` mappers that translate fields and operators to each provider’s expected JSON (including priority/order).

## 11) UI/UX Outline

* **Left**: Policy Editor (visual + JSON tab), Rule list with drag‑sort, Exclusions.
* **Right**: Request Lab (builder + HAR/cURL import), Run button, Results panel with a trace timeline and evidence chips.
* **Top Tabs**: Designer | Simulator | Test Packs | Export.
* **Badges**: Target = AFD/AppGW, Mode, Managed sets on/off.

## 12) Example Policy (internal JSON)

```json
{
  "target": "AFD",
  "name": "cp-main",
  "mode": "Prevention",
  "rules": [
    {"id":"r1","order":10,"action":"Block","type":"match","when":[
      {"field":"path","op":"startsWith","value":"/admin"}
    ]},
    {"id":"r2","order":20,"action":"Block","type":"bot","when":[
      {"field":"ua","op":"regex","value":"(sqlmap|nikto|curl/\d+)"}
    ]},
    {"id":"r3","order":30,"action":"Log","type":"size","when":[
      {"field":"size_body","op":"gt","value": 1048576}
    ]}
  ],
  "exclusions":[{"location":"query","key":"returnUrl","op":"regex","value":"^/safe/.*$"}],
  "managedSets":[{"name":"OWASP-3.2","categories":["SQLI","XSS"],"paranoia":1}]
}
```

## 13) Example Export (AppGateway‑shaped custom rule excerpt)

```json
{
  "properties": {
    "customRules": [
      {
        "name": "r1",
        "priority": 10,
        "ruleType": "MatchRule",
        "action": "Block",
        "matchConditions": [
          {"matchVariables":[{"variableName":"RequestUri"}],"operator":"BeginsWith","matchValues":["/admin"]}
        ]
      }
    ]
  }
}
```

## 14) Test Packs

* Structure: folder with `pack.json` (metadata), `requests/*.json` (method, url, headers, body), `expectations.json` (rule hits, final action).
* UI: run all, see pass/fail, export JUnit for CI.
* CLI: `waf-sim run --policy policy.json --pack packs/login --report junit.xml`.

## 15) Documentation Export (Markdown)

* Overview: name, target, mode, managed sets.
* Rules Table: priority/order, action, conditions, notes.
* Exclusions Table.
* Test Pack Summary: endpoints covered, pass rate.
* Change Log (Pro): versions, diffs.

## 16) Security & Privacy

* Default **client‑side only**. No network calls unless user opts in (e.g., Geo lookup). Warn on PII in requests.
* Provide a "Clear All" button that wipes LocalStorage/IndexedDB.

## 17) Roadmap & Phases

**Phase 1 (2–3 weeks):**

* PolicyModel, Designer, core conditions (path/query/header/method/ip), actions (Allow/Block/Log/Redirect), AFD export, basic simulator.
* Request Lab with cURL import, JSON export.
* Docs export (Markdown).

**Phase 2:**

* AppGW export, exclusions, managed set stubs, test packs + CLI.
* Policy linter (duplicates, unreachable rules).

**Phase 3 (Pro):**

* Team library, history/diff, coverage heatmap, signed exports.

## 18) Project Structure (app)

```
apps/web
  ├─ app/(routes)
  │   ├─ page.tsx               # Landing
  │   ├─ designer/page.tsx      # Editor (visual + JSON)
  │   ├─ simulator/page.tsx     # Request lab
  │   ├─ packs/page.tsx         # Test packs
  │   └─ export/page.tsx        # Exporters
  ├─ components/*               # UI components
  ├─ lib/
  │   ├─ model.ts               # PolicyModel types
  │   ├─ engine.ts              # evaluate(policy, request[]) => trace
  │   ├─ exporters/
  │   │   ├─ afd.ts             # toAFD(policy)
  │   │   └─ appgw.ts           # toAppGW(policy)
  │   ├─ parsers/
  │   │   ├─ curl.ts            # curl → Request
  │   │   └─ har.ts             # HAR → Request[]
  │   └─ cli/ (later)           # shared logic for Node CLI
  └─ store/*                    # Zustand/Redux state
packages/cli (later)
  └─ src/index.ts
```

## 19) Success Metrics

* Time to first policy export (< 5 min).
* Simulator adoption: # of requests run per session.
* FP reduction proxy: users adding exclusions before export.
* CI adoption: # of test packs exported/run.

## 20) Risks & Mitigations

* **Rule parity gaps** → Document known differences; provide mapping table; prioritize high‑value operators first.
* **Complexity creep** → Start with custom rules + core managed categories.
* **User data sensitivity** → Default local‑only; explicit warnings; no telemetry by default.

## 21) Open Questions

* Which managed rule set versions to surface first? (OWASP 3.2/3.3 UX labels)
* Do we include sample policy presets (API, e‑comm, CMS)?
* Should rate limiting simulate per IP or per key? (likely per IP for MVP)

---

**TL;DR:** A focused, client‑side WAF policy workbench: design → simulate → export. Start with core matching + AFD export; grow to AppGW, test packs, and team features.
