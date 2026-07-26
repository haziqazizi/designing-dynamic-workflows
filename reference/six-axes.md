# Part II — Technical Reference

## 4. The pattern space: six axes

Every workflow is a selection along six axes. This is the whole design space — compose one choice per axis and you have named most published multi-agent patterns and many unnamed ones.

### Axis 1 — Topology (how work splits)

| Shape | Structure | Use when |
|---|---|---|
| Chain | A → B → C, each sees only predecessor | Staged transformation; lossy compression where the drop-log is the output |
| Fan-out/fan-in | N agents at once → one synthesis | Independent perspectives or partitioned items |
| Pipeline | Items flow through stages without barriers | Per-item multi-stage work; the default for scale |
| Layered DAG | Topological layers; parallel within, sequential between | Dependency-ordered builds |
| Sequential loop | One agent per iteration, state decides next | Bisect, negotiation — when step N needs step N−1's answer |
| Meta | Workflows composing workflows | Pipelines of pipelines; a composer choosing the pipeline itself |

### Axis 2 — Differentiation (what varies across agents)

| Mode | Each agent gets | Measures / produces |
|---|---|---|
| Lens | Same input, different fixed perspective | Coverage through diversity |
| Partition | Different slice, same instructions | Coverage through division |
| Strategy | Same goal, different named approach | Competing artifacts to compare |
| Counterfactual | Same context, one variable perturbed | Clean causal attribution |
| Replication | Identical everything | Variance = input ambiguity |
| Role | Same material, opposed stances (advocate/skeptic) | Adversarial pressure |

Prefer *fixed named menus* of lenses/strategies over freeform variation — orthogonality by construction, and an empty lens is itself information.

The strongest differentiation lever is **provider distance**: a model *family* shares training data and blind spots, so two models from one vendor are far more correlated than their names suggest. When multiple providers are available, put at least one cross-provider member in any panel whose miss costs something — field evidence from cross-provider review panels shows bug classes caught *only* by the out-of-family reviewer. Pin the foreign model explicitly; tools that silently fall back to the house model defeat the purpose without telling you.

### Axis 3 — Convergence (how results combine)

- **Synthesis** — a model reads everything and judges. Default. Never replace judgment with a scoring formula; use formulas only for mechanical facts.
- **Agreement counting** — plain code computes cross-agent overlap on structured outputs. Agreement between blind agents = confidence; disagreement = real ambiguity. Never dedupe corroboration away.
- **Three-way adjudication** — confirmed / refuted / *contested*. Contested survives to the report with both readings. Forced consensus destroys the most informative category.
- **Debate** — structured rounds between position-locked advocates, neutral moderator, early exit on consensus, hard round cap. For resolving tradeoffs, not generating options. (Detail in §5.)
- **Tournament / judge panel** — generate N, score with independent judges, synthesize from the winner, graft runners-up's best ideas. (Detail in §5.)
- **Compression chain** — repeatedly halve; what survives every cut is the core. (Detail in §5.)

Beyond these, there is a whole ladder of selection approaches ordered by grounding strength — external verification, behavioral cross-checking, survival-based selection, and more. (See §5b.)

### Axis 4 — Iteration (when to stop)

- **Fixed count** — known size. Weakest form.
- **Until dry** — keep spawning finders until K consecutive rounds surface nothing new (dedup against everything *seen*, not everything *kept*).
- **Until budget** — depth scales to a token target.
- **Until converged** — loop while proposals still change; add a no-relitigation rule (settled issues can't reopen) or it oscillates forever.
- **Bounded retry + eviction** — per-item retry cap; failures evicted *with context* and re-attempted in a later full pass. Never drop failures silently.
- **Statistical iteration (bandits)** — when the same pipeline runs many times, treat high-level strategy choices as bandit arms (UCB1) and let per-run judge scores update them; an LLM warm-start seeds the priors so expensive early pulls aren't wasted. Iteration as learning, not just looping. (See §6b, Co-Director.)

### Axis 5 — Isolation and state

- **Context isolation** (free): agents never see siblings' work. Non-negotiable for any diversity- or variance-based pattern — one leak invalidates the measurement.
- **Worktree isolation** (costs setup): required the moment agents mutate files in parallel. Always tear down.
- **Files as memory**: each stage writes named artifacts the next stage reads. Makes runs resumable, interruptible, auditable.
- **Stigmergic memory (the field guide)**: a shared, agent-curated store the environment injects into every agent at start — coordination through the medium, not through chat (how ant colonies coordinate without a controller). Three rules make it work rather than rot, all from swarm theory (Bonabeau/Dorigo/Theraulaz) and a production instance (Cursor's "Field Guide", 2026): **deposit on surprise** — capture the unexpected encounter, not every event, since weights are frozen and only surprises shorten the next trajectory; **a hard line/entry budget is the evaporation term** — the cap forces the swarm to overwrite weak entries, and without it the store stagnates on early consensus (the formal ACO result: amplification with no evaporation converges the whole colony on one sub-optimal path); and **reality-couple the deposits** — a shared text store that reinforces unverified claims is a memory-poisoning vector, so let deposits be earned by tests passing, builds breaking, or reproduced evidence, not by assertion. Stigmergy is safe exactly when the trace is reality-coupled and dangerous when it's just more model output.
- **Fresh context on retry**: feed a rejected attempt's *rejection reason* to a new agent — never ask the author to defend its own work.
- **The locally-in-distribution (LID) test**: for each call in the design, ask — does this agent see a prompt that looks like something models have seen a million of (one item, one objective, one output contract), or a bloated one-off (forty tool outputs and a running commentary)? Transformers are unreliable compositional generalizers; the workflow's code must carry the composition (loops, dependencies, data flow through artifacts) so every model call stays a familiar atom. This is the mechanistic reason artifacts-beat-summaries, fresh-context-retry, and thin-orchestrator all work — and it applies to the orchestrator itself: an orchestration authored from a long, noisy context inherits that noise (Zhang & Khattab, "LM harnesses are compositional generalizers", 2026).

### Axis 6 — Gates (what blocks bad output)

- **Mechanical** — schema validation, similarity thresholds, tests passing, non-empty/non-placeholder checks. Cheap, run everywhere. Schema checks shape, not substance — add a plausibility check.
- **Model** — a reviewer that did not produce the work. Writer-never-reviews is the single highest-value rule in this document. (How to build the rubric: §7.)
- **Evidence discipline** — every claim tagged with its basis (`observed / inferred / assumed`) and a citation. Claims without evidence grade don't pass gates.
- **Human** — before expensive fan-outs and irreversible actions. Confirm the brief and the roster while it's cheap; don't interrupt mid-run.

### The one-sentence version

**Independence is the instrument, convergence is the measurement, the model is the judge, code is the referee, files are the memory, and the writer never grades their own homework.**

