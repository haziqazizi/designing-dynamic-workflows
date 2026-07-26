# pi-fabric runtime adapter

Use this adapter when the `fabric_exec` tool is available. The design method in `SKILL.md` owns *whether and how* to orchestrate; the installed `pi-fabric` package owns executable syntax, the capability surface, lifecycle, and the advanced-pattern contracts. Read only the adapter whose runtime is actually present.

## Load the runtime-owned contract

`fabric_exec` runs one type-checked TypeScript program against Pi's capabilities. Read the runtime-owned authoring contract rather than reconstructing the API from memory:

- **Core authoring** — the `fabric_exec` API (`pi.*`, `agent()`, `parallel()`, `pipeline()`, `mesh`, discovery, structured outputs, error recovery): the **`fabric-exec`** skill. It is model-invoked, so it sits in Pi's advertised catalog; read it directly.
- **Advanced multi-agent patterns** — invoke **`/skill:fabric-guide`**. It recommends the smallest sufficient pattern (fan-out→verify, council, cross-provider fusion, selection ladder, evaluator-optimizer, trajectory audit, resumable fan-out, postmortem field guide, recursive orchestration, neutral integration) and never runs it.

When this skill is installed as `node_modules/@haziqazizi/designing-dynamic-workflows` beside the runtime, the pattern skills resolve as `../../pi-fabric/skills/<name>/SKILL.md`. If no runtime contract can be read, stop before writing a `fabric_exec` program and report the missing integration; do not reconstruct the API from memory.

## Route before authoring

1. **Question, conversation, or direct task:** answer or work directly. Do not reach for `fabric_exec` merely because it is available — a single agent working directly is often the right answer (`reference/efficient-execution.md`).
2. **A named advanced pattern matches:** invoke `/skill:fabric-guide`, follow the recommended `/skill:fabric-*`, and pass the task through its documented `strings`. Do not hand-write an equivalent program.
3. **Custom decomposable work, no matching pattern:** complete the relevant design steps and references in this skill, then read the `fabric-exec` skill and author the `fabric_exec` program directly.

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
