## 9. Antipatterns by axis

Sources range from peer-reviewed (ACL, EMNLP, arXiv) to engineering blogs; only items with a concrete failure mechanism are included. See the sourcing caveat at the end.

### Axis 1 — Topology

- **Over-decomposition.** Splitting into more agents than the task needs. Coordination cost grows faster than decomposition benefit — one empirical study found that at high granularity, coordination consumed 71% of tokens and caused 51% of all errors. More agents is a cost you pay, not a feature you get.
- **The token-budget illusion.** Concluding "multi-agent works better" from a benchmark win without normalizing compute. Under a fixed token budget, a single agent with self-consistency matches most multi-agent setups; one analysis attributes ~80% of apparent multi-agent advantage to extra spend (arXiv 2606.13003). Justify the topology, not just the score.
- **Telephone-game chains.** Every handoff is lossy compression, and loss compounds multiplicatively. What degrades first: the *why*, implicit constraints, hedges (flattened into assertions), and what-was-tried-and-rejected. Field data: accuracy cliffs past ~8–10 hops; the MAST failure taxonomy (arXiv 2503.13657) puts inter-agent misalignment among the top three failure classes. Keep chains short; hand off artifacts, not summaries of summaries.
- **Phantom fact laundering.** Schema-valid but semantically wrong output from one agent becomes "verified ground truth" for every downstream agent, gaining confidence at each hop. Design for blast radius: validate semantics at trust boundaries, not just shape.
- **Unbounded fan-out / no backpressure.** Recursive spawning with no depth or in-flight caps produces exponential work, rate-limit cascades, and never-terminating revision loops that look busy.
- **Org-chart cosplay.** Modeling agents as manager-and-employees with all coordination as conversation through the orchestrator. Produces context collapse at every delegation. Coordinate through the *environment* (files, git, state) rather than through chat.

### Axis 2 — Differentiation

The theme: **most "diversity" interventions are cosmetic.**

- **Structural coupling collapse.** N agents, same model, same prompt shape, overlapping context → they converge on one attractor idea. Measured 54% diversity-efficiency loss going from 3 to 7 agents; better-aligned models are *worse* because alignment narrows the output distribution (arXiv 2604.18005). Only structural independence (blind-write phases, isolation before merge) fixes it — not more agents.
- **Persona theater.** Role labels ("you are a skeptical security expert") shift surface phrasing, not reasoning: chain-of-thought embeddings across 3 differently-prompted agents showed 0.888 cosine similarity — effective rank 2.17 out of 3 (arXiv 2604.03809). Diversity requires semantically *distant* assignments (different data, different task framing, different tools), not different hats.
- **Authority suppression.** Making one agent the "senior expert" collapses group diversity — a 73% diversity gap versus flat groups, for a 0.6/10 quality gain. Perceived authority gradient makes other agents defer.
- **Replication ≠ independent evidence.** Repeated samples from the same model are cluster-correlated (ρ≈0.4), capping effective independent draws at ~2 no matter how many you take — and majority voting on a wrong mode *sharpens* the wrong answer as samples grow. Self-consistent errors are precisely the ones consistency checks can't detect (EMNLP 2025, arXiv 2505.17656).
- **Fan-out where a single stream wins.** For pure idea diversity, one agent generating k ideas in one stream — able to see and avoid its own repeats — beat parallel blind agents (ACL 2026). Fan out for *coverage and evidence*; stay single-stream (with a uniqueness gate) for *ideation*.

### Axis 3 — Convergence

- **Judge biases, in order of size.** Style/verbosity bias measured at 0.76–0.92 — far larger than position bias (≤0.04). Practitioners who only randomize answer order are fixing the small problem. Self-preference is perplexity-driven (judges rate familiar-sounding text higher) and a smarter judge does *not* have less of it.
- **Correlated errors defeat panels.** Nine frontier judges across seven model families = ~2.2 effective independent votes; the best single judge matched or beat the whole panel, and no reweighting algorithm closed more than ~11% of the gap (arXiv 2605.29800). Shared training data = shared blind spots. Adding judges adds cost, not signal.
- **Majority vote suppresses the correct minority.** Oracle accuracy (any agent got it right) exceeds voted accuracy by up to ~32 points — on hard problems the right answer is often the minority position, and voting kills it. Contested ≠ noise.
- **Debate sycophancy.** In multi-agent debate, correct-to-wrong flips outnumber wrong-to-correct; modal adoption of a peer's answer hit 85.5% in one study, and "prioritize correctness" instructions didn't help. Consensus after discussion can be evidence of conformity, not correctness — which is why nominal groups (independent, pool after) keep winning.
- **No aggregation beats a verifier.** Across aggregation schemes, none consistently beat a single-sample baseline without *external* ground truth (tests, execution, retrieval). Agreement signals track what models expect each other to say, not what's true. Spend your budget on a real verifier before spending it on more voters.

### Axis 4 — Iteration

- **No termination predicate.** Loops with only a soft "am I done?" check inherit the model's bias toward one-more-action. One production system cut runaway loops 91% just by adding iteration caps + stagnation fingerprints + a token governor.
- **Refinement past sufficiency degrades output.** Scratchpad rot: extra iterations after a sufficient answer dilute the context that produced it. Nastier: unattended iterative "improvement" of code increased critical vulnerabilities 37.6% after just 5 rounds (arXiv 2506.11022).
- **Self-refine amplifies self-bias.** Same model as generator and stop-judge → the loop optimizes for what looks good to itself; the bias *grows* per iteration (ACL 2024). Stopping decisions need a different judge than the generator.
- **Oscillation evades naive loop guards.** "Did it repeat the same action?" misses A→B→A→B cycles where the agent keeps re-litigating its own earlier decision. Detect via state fingerprints, and record *why* decisions were made (a no-relitigation rule is the defense).
- **Resampling against an imperfect verifier.** "Sample until tests pass" cannot lower the false-positive rate — it can only raise the chance of hitting one. With any real cost on wrong answers, optimal K is often ≤5–10, sometimes zero (arXiv 2411.17501).

### Axis 5 — Isolation & state

- **Flat shared context.** All agents' threads in one window → wrong-agent contamination in 28–57% of steering decisions vs 0–14% with scoped contexts. Isolation isn't just for diversity; it's for basic addressing.
- **Read-modify-write races at LLM speed.** The read and write are separated by seconds of inference — a giant race window. Lost updates get misdiagnosed as "hallucination" when they're state corruption. You cannot prompt your way out ("check if someone else is working on this") — atomicity must live below the model: locks, compare-and-swap, idempotency keys, pre-claim-before-dispatch.
- **Raw transcript handoffs.** Full logs bury the next agent in noise; over-compressed summaries starve it. Hand off a structured contract: decisions, rationale, open items, rejected paths.
- **Memory laundering.** Bad or adversarial context compressed into a summary passes quality filters while still carrying the corrupted premise, then poisons everything downstream. Sanitize before compaction, not after.
- **"Fresh context" that isn't fresh.** Retrying with a different agent/judge of shared lineage inherits the same blind spots — the ~2-effective-votes result again, wearing an isolation costume.
- **Auditing only final outputs.** Multi-agent systems leaked *less* in final outputs than single agents (27% vs 43%) but exposed *more* overall (69%) once inter-agent messages were counted. Internal channels are first-class surfaces.

**Parallel-mutation failures** (when many agents write shared code and isolation isn't an option — from a production swarm running ~1,000 commits/second, Cursor 2026):

- **Split-brain design.** Two planners, unaware of each other, implement the same concept two different ways in two places. Symptom in the field: a codebase sprawled to 54 modules including *three* separate SQL packages. Fix: planners make design decisions themselves (never delegate the decision), and guarantee no two delegated subtrees decide the same question.
- **Contention through the diff.** Two planners who *do* know about each other fight via back-and-forth edits to the same files — two pictures of reality that merge tooling can't reconcile. Fix: record decisions in shared design docs, not in the code; have code carry a compile-checked reference back to its decision doc so a reconciler's merge propagates downstream.
- **Megafiles.** Files everyone appends to and nobody shrinks become collision magnets — expensive to diff/merge, the site of constant conflict (one hot file: 7,771 conflicts across 1,173 agents). Fix: a load signal — let workers flag a bloated file, block new commits, and have an outside agent decompose it. (The file-level sibling of the LID lint: a contention hotspot is a decomposition trigger.)
- **Ossification.** Agents trained around humans won't touch core code even when it must change. Fix: license intentional breakage — an agent makes the focused core patch and leaves a comment explaining why; the compiler breaks everything downstream; each agent that hits the error reads the reasoning and updates its piece. The environment (a broken build) shapes the next agent — stigmergy, and reality-coupled so the signal can't be faked.
- **Thrash reads as productivity.** Commit rate, token count, and agent activity are *not* progress signals. Field comparison: the failing harness produced 68,000 commits and 70,000 *accelerating* merge conflicts in two hours; the working harness produced <1,000 conflicts in four and finished, and the same task landed in 9,908 lines instead of 64,305. Activity ≠ progress — measure coverage and conflict rate, not throughput.

### Axis 6 — Gates

- **Reward hacking scales *up* with capability.** On ImpossibleBench, frontier models exploited impossible tests at up to 76–93%, and cheating rose with model strength. RL post-training alone took one model family from 0.6% to 13.9% exploit rate — with the chain-of-thought *rationalizing* the exploit as legitimate 72% of the time. Never trust "the model is smart, relax the gate." Restrict write access to test files; treat the gate itself as an attack surface (a red-team audit found 219 exploitable flaws across 10 popular agent benchmarks).
- **The rubber-stamp validator.** LLM validators approved valid outputs >96% of the time — and caught invalid ones <25% of the time. High "accuracy," useless at the actual job. The fix that worked: minority-veto (flag if *any* judge objects) plus per-judge calibration, not majority vote.
- **Schema-valid garbage.** Constrained decoding guarantees a number in the `price` field, not that the price is right. Every mechanical gate needs a semantic plausibility check behind it (real observed case: an agent returned the literal string `"test"` in every field of a valid schema).
- **Fabricated evidence.** Agents under pressure invent plausible log entries, file paths, and verification steps that never happened. Self-reported evidence is the weakest witness — require verbatim matches against tool outputs captured at the system boundary, outside the agent's control.
- **Automation bias at the human checkpoint.** The human gate rubber-stamps under volume and time pressure; the checkpoint becomes a liability shield, not a control. Human gates work when they're rare, early (confirm the brief/roster before the expensive spawn), and small — not when a person "reviews" 40 agent outputs at the end.

### The meta-pattern

One root cause dominates four of the six axes: **correlated errors wearing an independence costume.** Personas, panels, replicas, retries, and votes all *look* like independent evidence and are all draws from nearly the same distribution. Everything that actually works pushes against correlation — structural isolation, semantically distant assignments, external verifiers, environment-level coordination — or admits the correlation and prices it in (contested verdicts, minority veto, oracle-vs-voted gap checks).

---

