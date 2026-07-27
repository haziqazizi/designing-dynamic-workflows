# pi-fabric host-tool adapter

Use this adapter when `fabric_exec` is the model-visible host tool. Fabric owns deterministic Pi, MCP, captured-extension, approval, audit, Schema, compaction, and memory calls. It does **not** own subagents. Every subagent workflow must use the registered pi-dynamic-workflows runtime through `extensions.workflow`.

## Load the core contract

Read the installed `fabric-exec` skill before the first Fabric call or after an argument-shape error. It owns exact `pi.*`, `mcp.*`, `extensions.*`, discovery, return-shape, and error-recovery syntax. Do not load or invoke advanced `fabric-*` agent skills.

## Routing boundary

- Direct file, command, MCP, captured-extension, Schema, compaction, or memory work: use one ordinary `fabric_exec` program.
- Any call that creates a model subagent: read `reference/pi-dynamic-workflows.md`, then launch the captured Dynamic tool.
- If `extensions.workflow` is unavailable, report the missing integration. Never fall back to `agents.run`, `agents.spawn`, `agents.handoff`, `agent()`, councils, RLM, actors, or mesh-based swarms.
- Persistent advisors, supervisors, recursive decomposition, trajectory-log judging, retained-branch integration, and mesh-backed field guides are unavailable unless a separately approved runtime owns them. Do not emulate them silently.

## Captured Dynamic calls

In Fabric full-code mode, Dynamic tools return the captured-extension wrapper. Preserve the runtime's background default unless the user needs the result inline.

```ts
const launched = await extensions.workflow({
  name: "multi-perspective",
  args: { topic: "..." },
  background: true,
});
if (launched.isError) throw new Error(launched.text || "workflow launch failed");
return { text: launched.text, runId: launched.details?.runId };
```

Use `extensions.workflow_control(...)` for list, status, pause, resume, and stop after reading the installed runtime contract. Treat its wrapper `isError` as authoritative.

## Tool boundary

- Keep deterministic transforms in Fabric code rather than paying an agent.
- Only the compact return value re-enters the conversation.
- Preserve explicit user limits.
- Return partial coverage and failures visibly.
- Fabric agent APIs being present in type declarations is not permission to use them.

## Completion check

Before a call, verify that direct work stays in Fabric, every subagent is delegated through Dynamic Workflows, the relevant installed contract was read, fan-out and stopping are bounded, and unavailable retired capabilities were not silently substituted.
