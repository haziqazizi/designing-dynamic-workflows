# Part IV — Efficient Execution

Source: Anthropic's "Prompting Claude Fable 5" guide (platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5) plus the effort-parameter docs. The doctrine below is model-agnostic; the alignment notes in §14 are specific to frontier models with effort controls (Fable 5, Opus 4.7+, Sonnet 5).

## 12. The cheapest-sufficient-path doctrine

A workflow buys confidence with redundancy. Efficiency is not the opposite of that — it is refusing to pay for redundancy that doesn't buy confidence. At every point in a design, take the cheapest configuration that still passes the quality gate, and escalate only when the gate fails.

**1. Single agent first — the fan-out threshold has moved up.** Frontier models show first-shot correctness on complex, *well-specified* problems that previously took days of iteration. Spec quality substitutes for fan-out: before buying a fleet, spend effort on the spec, then run the replicate-3× probe (see `composition-patterns.md`, measure → invest) — if 3 replicas on an identical spec agree, the spec was good and one agent would have sufficed; variance means spec ambiguity, and *that* is what the fleet is for. Fan out for independence (confidence), width (context), or competition (selection) — never as a default posture.

The planner-worker economics are now measured, not asserted. In a production swarm rebuilding SQLite from its manual (Cursor 2026), a frontier planner paired with a cheap worker matched a frontier-solo run's quality at **~1/8 the cost** ($1,339 vs $10,565); workers carried 69–90% of *tokens* but the frontier planner carried ~2/3 of the *dollars*. The principle it proves: "few moments genuinely require frontier intelligence — the decomposition, the design decisions, certain trade-offs. Once a frontier planner collapses the ambiguity into an explicit instruction, cheaper models just follow it." That is the tiering rule below, with a receipt. (One nuance from the same runs: a stronger planner can produce fewer planning tokens but a spec that induces *more* worker tokens — so grade the pairing on end-to-end cost, not planner cost alone.)

**2. Effort is the primary cost lever — route it per stage role.** Every agent call carries an effort setting (`low`/`medium`/`high`/`xhigh`/`max`). Low effort on a frontier model still often exceeds the `xhigh` performance of prior models, so mechanical stages no longer need a capable-model tax:

| Stage role | Effort | Why |
|---|---|---|
| Scout / inventory / extraction | `low`–`medium` | Bounded, mechanical; schema output catches failures |
| Generation (competing candidates) | `high` | The work product; quality-sensitive |
| Verification / judging | `high`–`xhigh` | The gate everything else depends on; a cheap judge invalidates the whole spend |
| Synthesis / grafting | `high` | Needs the full picture, not maximal depth |
| Deterministic transforms (dedup, filter, count, aggregate) | none | This is code, not an agent. An agent doing arithmetic is the most expensive failure of this table |

Never set the whole fleet to one effort level. The single most common inefficiency is `xhigh` scouts; the single most dangerous economy is `low` judges.

**3. Funnel ordering is the topology-level version of the same rule.** Cheapest gate first; never run an expensive stage on items a cheap one could kill (see `composition-patterns.md`). Mechanical/schema gates before model gates, single-judge screens before panel adjudication, panels before humans.

**4. Staged escalation, never silent escalation.** Start each stage at the cheapest configuration you believe sufficient. When a gate fails, escalate one notch — higher effort, a second verifier, a stronger model — and *log the escalation*. A workflow that silently retries at higher cost until something passes is "sample until tests pass" wearing an efficiency costume. Symmetrically, a bound that silently drops work (top-N, sampling, no-retry) must log what was dropped — silent truncation reads as coverage.

**5. Reuse beats respawn.** Frontier orchestrators dependably sustain communication with long-running subagents. A long-lived subagent that keeps its context across subtasks is cheaper (cache reads instead of context re-establishment) and faster than spawn-per-subtask. Prefer asynchronous communication — dispatch, keep working, collect — over spawn-and-block; a barrier is justified only when the next stage genuinely needs all prior results together (dedup, early-exit, cross-candidate comparison). Wall-clock under a barrier is the slowest item; wall-clock in a pipeline is the slowest *chain*.

**6. Measure → invest.** Before committing a large fleet to a model/effort configuration, run 2–3 representative items through the candidate configurations, grade them with the workflow's own gate, and pick empirically. Minutes-long turns at high effort are normal on frontier models; the calibration run also tells you the wall-clock and budget per item, which sizes the fleet honestly.

**7. Budgets are ceilings, not vibes.** Every widening phase carries a hard budget (agent count, token target, wall-clock) fixed before spawning. Escalation happens *within* the budget or goes back to the user as a scope decision — never by quietly exceeding it.

## 13. Executing under uncertainty — fast, cheap, robust at once

Fast, cheap, and robust look like a pick-two triangle; they aren't, because they respond to the same variable: **where you place irreversibility**. Keep everything reversible wide and cheap; make the one irreversible step narrow and verified. The sequencing:

**Triage the uncertainty before spending anything.** Name which kind is binding, because each has a different cheapest reducer:

| Uncertainty | Cheapest reducer |
|---|---|
| Spec ambiguity ("what do they actually want?") | Replicate 2–3× on the identical spec — variance *is* the ambiguity measurement. Or one clarifying question; a sentence of intent beats a thousand tokens of guessing |
| Knowledge uncertainty ("is this claim true?") | Corroboration gates (≥2 independent sources or one authoritative), adversarial refuters, contested verdicts — never force a binary |
| Execution risk ("will this run survive?") | Durable per-item checkpoints, partial-status envelopes with explicit failure ledgers, evict-and-continue for independent items |
| Environment volatility ("will this mutation break things?") | Worktree isolation, canary-first (run 1–3 items end-to-end and gate before the fleet), external checks before any judge |

**Fast** comes from parallelism over items (wall-clock = slowest chain, not the sum), async dispatch instead of spawn-and-block, and low-effort scouts that clear the runway for the expensive stages. **Cheap** comes from effort/model routing per stage role, the funnel, code doing every deterministic transform, and content-keyed journals so a restart pays only for what changed — resumability converts "robust" from re-run-everything insurance into a near-free property. **Robust** comes from the failure ledger discipline: every fan-out returns success/partial/failed with named gaps, partial results are usable evidence and never trigger whole-run reruns, retries are surgical (failed items only, fresh context, with the failure reason), and semantic exhaustion is returned visibly — never presented as success, never silently dropped.

The barbell that ties it together: **many cheap reversible options, few expensive verified commitments.** Fan out at `low` effort across everything uncertain; verify at `xhigh` on the narrow set that survived; commit (merge, mutate, publish) only what passed, one canary before the fleet. When tiering models by cost, price is the robust capability signal — rank by output price with name hints only as tiebreakers, and never let tiers collapse onto one model.

The barbell also selects your *reasoning style*, and the two ends want opposite ones. Where actions are cheap and reversible, reason **act-first**: don't model the causal structure upfront, perturb it — spawn cheap attempts, let reality reinforce what works and let the unverified decay (the swarm/adaptive mode this whole doctrine is built around). Where the action is expensive and irreversible — the one-shot migration, the destructive change, the thing you can't unspill — you can't afford to learn by failing, so reason **reason-first**: map the causal consequences forward *before* acting (what does this change break? — the Future-Reality-Tree "negative branch" check), and audit that reasoning with a causal rubric (CLR, `rubrics-and-gates.md`) before you commit once. Top-down causal reasoning isn't the opposite of adaptive reasoning; it's what adaptive reasoning turns into at the irreversible end of its own barbell. The failure is using the wrong one for the regime: reasoning out a giant plan for cheap reversible work (over-planning, the thing frontier models already over-do), or acting-and-seeing on the irreversible commit (learning by failing where failing is the thing you can't undo).

## 14. Aligning workflow prompts with the frontier prompting guide

These are the points where Anthropic's Fable 5 prompting guidance intersects this skill's doctrine. Some confirm it; two require changes to how you write worker and judge prompts.

**De-prescribe worker prompts — but keep the gates prescriptive.** The guide is explicit: "skills developed for prior models are often too prescriptive and can degrade output quality — state the goal and constraints rather than enumerating the steps." Apply this to *worker* prompts: give the objective, the boundaries, and the output contract; drop step-by-step scaffolding, forced-progress-update instructions, and enumerated behavior lists. Do **not** apply it to the *structural* rules — isolation, blind judging, writer-never-grades, budget caps. Those aren't hand-holding the model needs less of; they're policy the orchestrating code enforces regardless of model capability. The line: prescribe the contract, not the method.

**Never ask an agent to transcribe its reasoning.** Prompts that tell a model to echo, reproduce, or explain its internal reasoning as response text can trigger the `reasoning_extraction` refusal category on Fable 5 — the request 200s with `stop_reason: "refusal"` and the workflow silently loses the item or falls back to another model. This lands directly on rubric and evidence design: judge prompts like "show your full reasoning before the verdict" and evidence rules phrased as "explain your thinking" are the failure mode. The compliant framing — which is also the better epistemics this skill already teaches — asks for **externalized evidence, not internal narrative**: verbatim quotes from tool output, per-criterion verdicts, confidence, `observed / inferred / assumed` tags. If a harness needs reasoning visibility, read the summarized `thinking` blocks from the API; don't prompt for reasoning in the response body.

**Ground progress claims against tool results.** The guide's snippet — *"Before reporting progress, audit each claim against a tool result from this session. Only report work you can point to evidence for; if something is not yet verified, say so explicitly."* — nearly eliminated fabricated status reports in Anthropic's testing. Embed it in every long-running worker prompt. This is the prompt-side half of the fabricated-evidence antipattern (`antipatterns.md` Axis 6); the system-side half remains capturing evidence at the tool boundary, outside the agent's control.

**Fresh-context verifiers beat self-critique — now official.** The guide: "separate, fresh-context verifier subagents tend to outperform self-critique." This is the writer-never-grades rule and fresh-context-retry rule stated by the model vendor; cite it when a design is tempted to let a generator judge its own loop.

**Workers must not stall.** Deep in long runs, models can end a turn with a statement of intent instead of the tool call, or ask permission they don't need — in an unattended workflow that item hangs until timeout. Include the autonomy snippet in worker prompts: proceed without asking for reversible actions within the assignment; end the turn only when the assignment is complete or blocked on input only the orchestrator can provide. Pair with the checkpoint rule: pause only for destructive/irreversible actions, genuine scope changes, or missing inputs.

**Pass intent downstream, not just the task.** Models perform better knowing *why* — "I'm working on [larger task] for [audience]; they need [what the output enables]; with that in mind: [request]." Orchestrators should propagate a one-line intent statement into every subagent prompt instead of a bare item assignment. This costs a sentence and measurably improves how workers resolve the ambiguities the spec didn't cover.

**Assessment vs. action boundaries.** Frontier models occasionally take unrequested adjacent actions. In a workflow this corrupts the referee's ledger: a "review" worker that also fixes what it found breaks writer-never-grades and produces unaccounted mutations. State it: workers whose role is find/verify/judge produce findings only; mutation is a separate stage owned by code or a dedicated worker with worktree isolation.

**Don't show workers a token countdown.** Surfacing remaining-context counts triggers premature wrap-up (self-summarizing, offering to hand off). Budgets live in the orchestrating code as enforced ceilings; if a count must be visible, add the reassurance that ample context remains.

**Verbatim delivery over summarized relay.** The guide's `send_to_user` pattern — tool inputs are never summarized, so route must-arrive-intact content through a tool call — generalizes to workflows as: hand off **artifacts, not summaries of summaries** (Axis 1). Inter-stage handoffs should be files or schema-validated structured outputs, never a worker's prose recap of another worker's prose.
