# pi-fabric runtime adapter

Use this adapter when the `fabric_exec` tool is available. The design method in `SKILL.md` owns *whether and how* to orchestrate; the installed `pi-fabric` package owns executable syntax, the capability surface, lifecycle, and the advanced-pattern contracts. Read only the adapter whose runtime is actually present.

## Load the runtime-owned contract

`fabric_exec` runs one type-checked TypeScript program against Pi's capabilities. Read the runtime-owned contract rather than reconstructing the API from memory:

- **Core authoring** — the `fabric_exec` API (`pi.*`, `agent()`, `parallel()`, `pipeline()`, `mesh`, discovery, structured outputs, error recovery): the **`fabric-exec`** skill. It is model-invoked, so it sits in Pi's advertised catalog; read it directly.
- **Advanced patterns** — each is a runnable `fabric_exec` template packaged as a `fabric-*` skill. They are deliberately kept *out* of the model's always-on catalog so their descriptions don't crowd context — but you reach any of them on demand: pick one from the routing table below and **read its `SKILL.md`**, then follow it. `disable-model-invocation` only hides a skill from automatic catalog selection; the file is still yours to read. When this skill is installed as `node_modules/@haziqazizi/designing-dynamic-workflows` beside the runtime, they resolve at `../../pi-fabric/skills/<name>/SKILL.md`; otherwise use the installed package location the host supplies. (Users can also invoke any directly with `/skill:fabric-<name>`, and `/skill:fabric-guide` routes for them.)

## Route to the smallest sufficient pattern

Before authoring anything: a direct answer or a single `agent()` beats any pattern — do not reach for a fleet by default (`reference/efficient-execution.md`). When a pattern does fit, read its `SKILL.md` and follow it; do not hand-write an equivalent.

| Need | Pattern to read (`pi-fabric/skills/<name>/`) |
|---|---|
| Discover → fan-out → verify a bounded work set | `fabric-workflow` |
| Independent same-model reviewer roles + synthesis | `fabric-council` |
| Cross-provider model panel compared by a judge | `fabric-fusion` |
| Pick one winner from competing artifacts | `fabric-select` |
| Refine one artifact against an explicit rubric | `fabric-optimize` |
| Audit a delegated run's "done" claims against its transcript | `fabric-trajectory-judge` |
| Long fan-out that must survive interruption and resume cheaply | `fabric-resume` |
| Merge competing branches from a worktree fan-out | `fabric-integrate` |
| Turn a run's failures into durable steering (a field guide) | `fabric-postmortem` |
| Late-session campaign a clean-context child should orchestrate | `fabric-orchestrate` |
| Work too large for one context window | `fabric-rlm` |
| Evidence-gated / transactional local-file mutation | `fabric-schema` |
| Persistent peer advice, goal-watching, or a durable actor team | `fabric-advisor` · `fabric-supervisor` · `fabric-ambient` · `fabric-swarm` |

If no pattern matches, complete the relevant design steps in this skill, then read the `fabric-exec` skill and author the `fabric_exec` program directly. If no runtime contract can be read, stop and report the missing integration.

## Map the design onto Fabric primitives

This is the bridge — the six axes and the selection ladder decide the shape; these are the primitives that build it.

- **Topology** → the program's control flow: fan-out = `parallel(thunks)`; pipeline = `pipeline(items, ...stages)`; a single call = one `agent()`; recursion for context overflow = `rlm.query`.
- **Differentiation** → per-call `agent()` options: different prompts / `tools` / `model` / `tier` / `thinking`. Cross-provider panels via the `runner` (pi vs claude) — the strongest decorrelation lever.
- **Convergence / selection** → the `fabric-select`, `fabric-fusion`, `fabric-council` skills, or the `verify` / `judgePanel` guest helpers. Three-way verdicts, never forced consensus.
- **Iteration** → `loopUntilDry`, `gate`, the evaluator-optimizer (`fabric-optimize`); every loop hard-bounded.
- **Isolation & state** → `isolation: "worktree"` once agents mutate files in parallel; the mesh for shared state (compare-and-swap via `ifVersion`); `journalKey` / `fabric-resume` for durable replay; `fabric-integrate` to merge worktree branches with a neutral resolver.
- **Gates** → the verify phases and `fabric-trajectory-judge` (audit the process against the run transcript, not the self-report). Push checks toward reality-coupled leaves.
- **Budgets** → `agentBudget` / `tokenBudget`, per-role effort and `tier` (cheap tiers for scouts, frontier for verification). Preserve explicit user limits; never invent a token or time ceiling the user did not request.

## Tool boundary

- `fabric_exec` takes a deliberately flat schema — one large `code` string plus scalar options. Write ordinary TypeScript objects inside; a wrong property returns a line-numbered compiler diagnostic to fix, not a rejected envelope.
- Only the program's `return` value re-enters the conversation. Keep intermediate work in variables and files; hand off artifacts, not prose recaps of prose.
- Return and report partial coverage honestly. Never silently drop `null`, failed, or not-started work items; a `partial` result is usable evidence with named gaps, not grounds for an automatic whole-run rerun.

## Completion check

Before running the program, verify: the task justified a workflow; every agent has a differentiated assignment or stable partition; fan-out and stopping conditions are bounded; generation and independent evaluation are isolated; the `fabric-exec` authoring contract was read (or a named `fabric-*` pattern used per its own contract); expected coverage and failure reporting are explicit.
