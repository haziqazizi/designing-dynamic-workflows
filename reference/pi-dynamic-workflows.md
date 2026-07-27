# pi-dynamic-workflows runtime adapter

Use this adapter for every workflow that creates subagents. The registered `workflow` / `workflow_control` capability is the sole subagent runtime. The design method in `SKILL.md` owns whether and how to orchestrate; the installed runtime package owns executable syntax, helper contracts, lifecycle, and built-in argument shapes. If the capability is absent, stop instead of falling back to Fabric agents.

## Load the runtime-owned contract

The runtime skills may be intentionally absent from Pi's advertised skill catalog. Read them directly from the co-installed pinned package instead of relying on memory or duplicating their content here.

When this skill is installed as `node_modules/@haziqazizi/designing-dynamic-workflows` beside the runtime, resolve these paths relative to this skill directory:

- Custom script authoring, editing, reviewing, or debugging: `../../@quintinshaw/pi-dynamic-workflows/skills/workflow-authoring/SKILL.md`
- Named built-in selection and arguments: `../../@quintinshaw/pi-dynamic-workflows/skills/workflow-patterns/SKILL.md`

If the sibling paths are absent, use the installed package location supplied by the host. If no pinned runtime contract can be read, stop before constructing a workflow call and report the missing integration; do not reconstruct the API from memory.

## Route before authoring

1. **Question, conversation, or direct task:** answer or work directly. Do not call the workflow tool merely because it is available.
2. **Existing saved workflow:** invoke it by name with its declared arguments. Do not redesign or rewrite it unless the user asks.
3. **Curated built-in match:** read `workflow-patterns/SKILL.md`, then invoke the top-level tool with `name` and the exact documented `args`. Do not write an equivalent script.
4. **Custom decomposable work:** complete the relevant design steps and references in this skill, then read `workflow-authoring/SKILL.md` and every branch reference it requires before writing JavaScript. Councils, panels, selection, optimization, and bounded resume are custom Dynamic workflows when no curated built-in fits.
5. **Unavailable former Fabric pattern:** persistent actors/advisors, recursive RLM, trajectory-log judging, retained-branch integration, and mesh-backed field guides have no approved runtime in this profile. Report them unavailable; do not silently approximate them.

## Tool boundary

- When Pi exposes extension tools natively, call `workflow` and `workflow_control` directly.
- In Fabric full-code mode, call the captured tools as `extensions.workflow(...)` and `extensions.workflow_control(...)` inside `fabric_exec`. Inspect the captured wrapper: `isError` is authoritative, `text` is the bounded display result, and `details` carries structured runtime metadata such as the run ID.
- Use `background: false` only when the user needs the result inline in the current turn. Otherwise preserve the runtime's documented background behavior.
- Preserve explicit user limits. Bound fan-out, loops, retries, and concurrency from the designed topology. Do not invent a token or time ceiling when the user did not request one and the runtime contract treats it as opt-in.
- Return and report partial coverage honestly. Never silently drop `null`, failed, or not-started work items.

## Completion check

Before calling the tool, verify all of the following:

- the task justified a workflow;
- every agent has a differentiated assignment or stable partition;
- fan-out and stopping conditions are bounded;
- generation and independent evaluation are isolated;
- the runtime-owned contract was read from the installed pin;
- the tool call uses either a named workflow or a custom script, according to that contract;
- expected coverage and failure reporting are explicit;
- no Fabric agent API or unavailable retired capability is used as a fallback.
