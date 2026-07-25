---
name: designing-dynamic-workflows
description: "Designs and implements multi-agent dynamic workflows: picks topology, agent differentiation, convergence, stopping rules, isolation, and quality gates, then applies the installed runtime contract. Use when orchestrating fleets of agents or subagents, including pi-dynamic-workflows scripts, fan-outs, tournaments, debates, review pipelines, evaluator-optimizer loops, generate-and-filter, or any 'spawn N agents and combine results' design."
---

# Designing Dynamic Workflows

A dynamic workflow is a small deterministic program orchestrating a fleet of agents. The program is dumb and reliable (loops, fan-outs, gates in real code); the agents are smart and unreliable. One line: **a single agent has one perspective and stops at its first plausible answer; a workflow buys many independent perspectives and refuses to stop early.**

The one-sentence design law: **independence is the instrument, convergence is the measurement, the model is the judge, code is the referee, files are the memory, and the writer never grades their own homework.**

This file is an index, not a substitute for the reference material. Full detail, examples, case studies, and citations live in `reference/` — one file per topic. **Reading the reference file named at each step is required before making that step's decision.** The summaries below only tell you which file to read and what decision it governs.

## Step 0 — Should this be a workflow at all?

Use a workflow when: the task is too wide for one context (60 files, 8 subsystems); confidence matters more than speed (3 blind agents agreeing = evidence); the first answer is a trap (design/architecture choices); or you're producing competing artifacts.

Do NOT use one when: you know the file and the fix (just do it); steps depend on each other's judgment at every turn (that's a conversation); or the work is inherently sequential (bisect).

Rule of thumb: **workflow when you can name the items or perspectives in advance.** If you can't write the list, scout first (cheap, inline), then fan out over what you found. Read `reference/concepts-and-examples.md` before deciding — it holds the four worked examples (code review, premortem, spec replication, PRD-to-code) that calibrate what a good workflow looks like.

## Step 1 — Design along the six axes

Read `reference/six-axes.md` before choosing. Every workflow is one choice per axis:

1. **Topology** — chain / fan-out+fan-in / pipeline / layered DAG / sequential loop / meta. Keep chains short (accuracy cliffs past ~8–10 hops); hand off artifacts, not summaries of summaries. More agents is a cost you pay, not a feature.
2. **Differentiation** — lens / partition / strategy / counterfactual / replication / role. Prefer fixed named menus of lenses over freeform variation. Persona labels are cosmetic (0.888 cosine similarity across "different" personas); real diversity needs semantically distant assignments — different data, framing, tools, or models.
3. **Convergence** — synthesis / agreement counting / three-way adjudication (confirmed–refuted–**contested**; never force consensus) / debate / tournament / compression chain. See Step 2.
4. **Iteration** — fixed count / until-dry (K empty rounds) / until-budget / until-converged (with a no-relitigation rule) / bounded retry + eviction-with-context. Every loop needs a hard cap; refinement past sufficiency degrades output.
5. **Isolation & state** — context isolation is non-negotiable for any diversity/variance pattern (one leak invalidates the measurement); worktree isolation once agents mutate files in parallel; files as memory; fresh context on retry (feed the rejection reason to a new agent, never ask the author to defend its own work).
6. **Gates** — mechanical (schema + a semantic plausibility check; schema-valid garbage is a live failure mode) / model (writer-never-reviews — the single highest-value rule) / evidence discipline (tag claims `observed / inferred / assumed`; require verbatim quotes) / human (rare, early, small — confirm the brief before the expensive spawn).

## Step 2 — Picking among candidates (the decision procedure)

Read `reference/convergence-and-selection.md` before picking — it holds the full selection ladder and the debate/tournament/distill mechanics this procedure compresses. When N candidates must become one output, run this in order:

1. **Can anything external check it?** Tests, execution, compilation, known answer, simulation. If yes, use it and stop — every judge is a fallback. With an imperfect verifier, cap N at ~5–10 (resampling raises false positives).
2. **If not: pairwise, never absolute.** Compare both directions (order-swapped; disagreement = tie), judge against explicit criteria (style/verbosity bias 0.76–0.92 is the largest judge bias), critique each candidate independently before comparing, and never let the generator's model family judge its own output.
3. **Score with atomic binary criteria, decide with minority-veto** for anything risk-shaped — validators approve >96% of valid outputs but catch <25% of invalid ones; one dissenting judge beats three agreeing ones.
4. **Agreement is confidence, not choice.** The right answer is often the minority position (oracle-vs-voted gap up to 32 points); model panels have ~2 effective independent votes.
5. **Try not to pick at all — graft.** Ask what each loser does better than the winner and splice it in. Winner-take-all throws away most of what you paid for.
6. **Reserve the human for values calls** (taste, risk, tone): present 2–3 finalists with a tradeoff map.

Debate is only for resolving tradeoffs between known positions (position-locked, moderated, hard 3-round cap, dissent preserved) — never for finding facts or generating options.

## Step 3 — Compose phases

Read `reference/composition-patterns.md` before chaining phases. Alternate **widening** (generate, fan out, sweep) and **narrowing** (filter, gate, synthesize). Every widening bounded by a budget; every narrowing owned by a context that didn't produce the work. Key idioms:

- **Funnel**: cheapest stage first; never run an expensive stage on items a cheap one could kill.
- **Diverge → converge**: independent generation strictly before any interaction — interaction during generation destroys diversity.
- **Evaluator-optimizer loop**: isolated grader, per-criterion feedback, hard iteration cap. Add champion/best-so-far tracking so a later worse attempt can't be what ships.
- **Scout → fan-out**, **measure → invest** (replicate 3× on an identical spec first: variance = spec ambiguity), **plan-gate → execute → seam review** (per-unit review can't see cross-unit bugs), **sweep → critic → resweep**, **competition → cross-pollination** (graft after every tournament), **canary → rollout**.
- Fail-stop when phases feed each other's inputs; evict-and-continue (with context) when items are independent.

## Step 4 — Build the gates (rubrics)

Read `reference/rubrics-and-gates.md` before writing any rubric — it holds the full recipe and the calibration steps everyone skips. The big three: decompose to **atomic binary yes/no checks** (2–10 items, one constraint each); use the **lowest-precision scale** that captures the distinction (never 1–10); **one criterion per judge call**, aggregate in code. Write the rubric blind to candidate outputs; require verbatim evidence per check; validate against a small gold set and stress-test with known-bad outputs — a rubric that passes everything is a rubber stamp.

## Step 5 — Check against the antipatterns

Before finalizing, read `reference/antipatterns.md` in full and check the design against every axis's failure modes. The meta-failure behind most of them: **correlated errors wearing an independence costume** — personas, panels, replicas, retries, and votes all look like independent evidence and are all draws from nearly the same distribution. Everything that works pushes against correlation (structural isolation, distant assignments, external verifiers, cross-family judges) or prices it in (contested verdicts, minority veto).

Quick smells: fan-out over a guessed decomposition (no scout); agents seeing siblings' in-flight work; same model generating and stop-judging its own loop; majority vote as the decider; "sample until tests pass"; a human "reviewing" 40 outputs at the end; no termination predicate; silent dropping of failed items.

## Step 6 — Bind the design to the installed runtime

When the registered `workflow` / `workflow_control` capability is available, read `reference/pi-dynamic-workflows.md` before choosing a built-in workflow, authoring JavaScript, or constructing tool arguments. That adapter requires the runtime-owned `workflow-patterns` contract for named built-ins and `workflow-authoring` contract for custom scripts. Keep those implementation contracts hidden from automatic skill routing; this skill is the single visible entrypoint.

## Reference map

Required reading per step (Steps 0–5 above each name their file). Two files are domain-gated rather than step-gated, but equally required when their domain is in play: `creative-generation.md` is mandatory for any workflow producing images or video, and `implementations.md` is mandatory when implementing or choosing a code-mode orchestration runtime.

- `reference/concepts-and-examples.md` — what workflows are, when to use one, four worked examples (code review, premortem, spec replication, PRD-to-code)
- `reference/six-axes.md` — full tables for topology, differentiation, convergence, iteration, isolation, gates
- `reference/convergence-and-selection.md` — debate/tournament/generate-and-filter/distill mechanics, the selection ladder, the six-step decision procedure
- `reference/composition-patterns.md` — funnel, diverge→converge, evaluator-optimizer, scout→fan-out, seam review, canary→rollout, and the widening/narrowing grammar
- `reference/creative-generation.md` — image/video generation case study: regression protection, VLM checklist judges, feedback design, judge lineage
- `reference/rubrics-and-gates.md` — rubric writing recipe, calibration, Anthropic Managed Outcomes
- `reference/antipatterns.md` — research-backed failure modes per axis, with the correlated-errors meta-pattern
- `reference/implementations.md` — code-mode implementations survey, extension case study, autoresearch (reality-as-judge), sourcing caveats
- `reference/pi-dynamic-workflows.md` — required adapter for the registered Pi workflow and workflow-control tools
