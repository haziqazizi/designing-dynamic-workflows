## 5. Convergence mechanisms in detail

Three mechanisms deserve full mechanics: debate, tournaments, and generate-and-filter. All three are ways of getting one good answer out of many attempts.

### Debate

2–5 agents, each locked to a position, argue in structured rounds while a neutral moderator tracks state:

```
Round 1 — Opening: each agent states its position in a fixed rubric
          (Claim / Evidence / known weaknesses)
Round 2 — Challenge: each agent sees the others' openings and must
          attack the strongest version of each rival position
          (steel-man rule) and concede points it can't defend
Round 3 — Synthesis (optional): agents propose compromises;
          skipped if round 2 already produced consensus
Moderator: never advocates; tracks resolved vs unresolved points;
          hard cap at 3 rounds; preserves dissent in the final output
```

Load-bearing design choices: **position-locking** (an agent can't agree its way out — it must defend its assignment), a **fixed response rubric** so the moderator can mechanically extract what's resolved, **early-exit + hard cap** (returns diminish fast), and **dissent preservation** — an unconvinced agent's objection ships with the verdict instead of being averaged away.

When it works / fails: without position-locking, debate collapses into sycophancy — agents adopt the majority answer at up to 85.5% rates, correct-to-wrong flips outnumber wrong-to-correct, and debate burns 2–3× the tokens of independent sampling for equal or worse accuracy. **Never use debate to find facts or generate options.** Use it only for *resolving tradeoffs between known positions*, where the deliverable isn't a winner but an explicit map of what was conceded, what survived attack, and why.

### Tournaments

Generate N candidates, then select via structured comparison instead of one judge eyeballing all N at once:

```
Generate: N candidates from different angles (strategies, seeds, models)
Bracket:  pairwise comparisons — judge sees exactly 2 candidates,
          picks the better with a stated reason; winners advance
Variant — round-robin: every pair compared, rank by wins
          (better signal, O(N²) cost vs bracket's O(N))
Variant — judge panel: K independent judges score each candidate
          against a rubric; aggregate in code
Synthesis: don't just crown the winner — graft the runners-up's
          best individual ideas into it
```

Why pairwise instead of "score all 10"? Judges are much more reliable at *A vs B* than at absolute scoring — list-wise judging degrades as the list grows, and absolute scores drift with no anchor. Mandatory hygiene from the judge-bias research: **randomize A/B order per comparison** (position bias), **judge against a rubric, not vibes** (style/verbosity bias at 0.76–0.92 is the dominant bias — a wordier candidate wins by default otherwise), and **never let a model judge its own output** (self-preference is perplexity-driven and doesn't shrink with judge capability).

The step most people skip: the winner-take-all framing throws away the tournament's real yield. Candidate 4 lost overall but had the best error handling; graft it. Cost note: a bracket over N is only N−1 comparisons — the expensive part was generating N candidates. If you won't synthesize across them, generate fewer.

### Generate-and-filter (best-of-N)

The simplest of the three — no interaction between candidates at all:

```
Generate: N candidates in parallel, mutually blind
Filter:   a verifier scores/passes each candidate independently
Select:   best survivor (or first survivor, if the verifier is binary)
```

Everything hinges on what the filter is:

- **External verifier** (tests pass, code compiles, output matches known answer, schema + semantic checks): the strong form. Generation is cheap and creative; verification is objective.
- **Model judge as filter**: weaker — you've inherited every judge bias, minus the pairwise structure that mitigates them.
- **Self-consistency** (pick the majority answer): weakest, with the nastiest failure mode.

Two hard limits, both empirical:

1. **Correlated candidates.** N samples from the same model/prompt are ~2 effective independent draws (ρ≈0.4), no matter how large N gets. If the model's prior favors a wrong answer, majority-filtering *sharpens* the wrong answer — self-consistent errors are exactly the ones consistency can't catch. Fix: vary something structural across candidates (strategy, decomposition, model), not just the sampling seed.
2. **Imperfect verifier.** "Sample until it passes" can never lower the false-positive rate — each extra sample is another lottery ticket for a plausible-but-wrong candidate that slips through. With real cost on wrong answers, optimal N is often ≤5–10. More generation only pays when the filter is genuinely reliable.

### How the three compose

They're stages, ordered by what each is good at. **Generate-and-filter** makes candidates exist and kills the obviously broken ones (cheap, objective). **Tournament** ranks the survivors and harvests their best parts (comparative judgment). **Debate** resolves the tradeoffs the tournament couldn't score — the genuinely contested design questions where the output you want is a decision *with its reasoning and dissent attached*.

Generate 8 approaches → filter to the 4 that pass the mechanical bar → tournament to a winner plus grafted ideas → debate the one unresolved tradeoff the judges split on. Each mechanism handles the failure mode of the previous one, and none is asked to do a job the research says it's bad at.

### Distilling (compression chains) in detail

A chain of forced lossy compressions where the *record of what got cut* is the deliverable:

```
Stage 0: original artifact (say, a 4,000-word spec)
Stage 1: agent A compresses to ~50%  → returns compressed text + drop log
Stage 2: agent B gets ONLY A's output (never the original) → cuts to ~25%
Stage 3: agent C gets only B's output → ~12%
Stage 4: agent D gets only C's output → ~6%
Orchestrator: aggregates the four drop logs into a tiered hierarchy
```

Load-bearing mechanics:

- **Each agent sees only its immediate predecessor's output, never the original.** If every agent saw the original, each would independently re-decide what matters and you'd get four opinions. Chained blindness means each cut is a fresh judgment on already-compressed material — no cumulative rationalization; surviving content re-earns its place every round.
- **The drop log is mandatory and structured**: what was cut, why, importance score per cut item, plus hardest cut / easiest cut / what to restore first with 10% more budget. The "hardest cut" field marks the boundary of the core.
- **Lossy-only constraint.** No adding information, no hedging, no paraphrasing content back in.
- **~50% per round with tolerance (40–60%)** so the pressure is real at every stage.

Scoring: **survival count is the priority ranking.** Content surviving all four cuts is Tier 1 — the core someone fighting for every word refused to drop four separate times. Content cut in round 1 is Tier 5 — noise. No agent is ever asked to rank by importance; the ranking *emerges* from four independent kill decisions, which is more honest than asking directly (models are bad at absolute importance scoring — the same reason pairwise beats absolute judging).

Use for: finding what matters in a long artifact (spec, report, legacy README). Outputs: the Tier 1 core, the tier map (what to cut for a short version), and the hardest-cuts list (items on the essence boundary, worth a human look). Blind spot: it measures *centrality*, not *correctness* — a wrong claim central to the document survives every cut.

## 5b. Selection beyond rubrics

Rubric judging is one point on a spectrum. The full menu, ordered from strongest grounding to weakest:

**1. External verification (ground truth).** Don't judge the artifact — *run* it against reality. Tests/execution/compilation; property-based checks when full verification isn't possible (JSON round-trips, migration preserves row counts, public API unchanged); simulation/replay against recorded traffic or a simulated user; oracle-by-construction (generate the problem *from* the answer so grading is exact). The strongest filter that exists — every judge-based method is a fallback for when this isn't available. Caveat: imperfect verifiers get gamed, and resampling against them raises false positives.

**2. Behavioral cross-checking (candidates grade each other, no judge).** Differential testing: run all N candidates on the same inputs and diff *outputs* — agreement is confidence, splits are interesting test cases. CodeT-style mutual selection: generate solutions and test cases independently, pick the solution passing the most generated tests; neither side is trusted alone, the cross-product is the signal. Reconstruction checks: can a fresh agent, given only the candidate, reconstruct the behavior? Round-trip fidelity as quality proxy.

**3. Relative preference (comparison without absolute criteria).** Pairwise A/B (the anchor is the other candidate — far more reliable than absolute scores); Elo/arena for candidates arriving over time; ranking by *worst*-elimination — judges are better at spotting clear defects than fine quality distinctions, so iterated "which is worst and why" can beat best-picking.

**4. Survival-based selection.** Adversarial survival: don't score candidates — attack them; select whatever survives the most red-team attacks. Selects for robustness rather than average quality. Constraint survival: perturb the requirements slightly and keep the candidate that degrades gracefully — selects designs not overfit to today's spec. Compression survival: the distill chain (§5) — selects the essential *parts* rather than a whole candidate.

**5. Agreement / consensus signals.** Cross-agent convergence counting — valid as *confidence*, dangerous as sole *selection* on hard problems (the ~32-point oracle-vs-voted gap: right answers are often minority positions). Surprisingly Popular (select answers more popular than agents predicted) is the only voting scheme even aimed at correlated errors; empirically shaky for LLMs.

**6. Learned and proxy signals.** Reward models / learned rankers — scale infinitely, Goodhart under pressure; selection plateaus after a few hundred samples while true coverage keeps growing. Process reward: grade the *trajectory*, not the artifact — did the agent verify claims, read the files it cites, test before declaring done? Catches fabricated-evidence cases artifact grading misses. Mechanical priors (diff size, complexity, dependency count) as tiebreakers only — "smallest diff that passes" is a genuinely good rule among candidates that pass real gates.

**7. Deferred / real-world selection.** Ship-and-measure: select with a cheap gate now, let production metrics (A/B, bandits) make the final call — zero proxy gap, at the cost of exposing users to losers. Human preference at the end: present 2–3 finalists with an explicit tradeoff map — the right move when criteria are genuinely values-based (tone, risk, taste).

**The ladder:** can reality check it? → can candidates check each other? → can it survive attack? → only then judge it (pairwise before rubric before absolute) → agreement and learned signals as confidence modifiers, never sole selectors → human for the values calls.

**The standing alternative: don't select — synthesize.** When candidates have complementary strengths, grafting beats any picker, because picking assumes the best whole candidate contains the best of everything, which is usually false.

**Decorrelated lenses stack (the self-driving argument for review).** No single reviewer catches everything, but *decorrelated* reviewers compound the way a self-driving stack reaches above-human reliability with no single perfect component. Decorrelate the **lens**, not just the model: give one reviewer the worker's full transcript (catches process failures — unread files, fabricated steps), another only the output (catches artifact defects without process anchoring), another only the codebase with no context (catches integration/seam bugs), and vary the model or provider across them (catches family-correlated blind spots). Each lens is blind to a different failure class, so their union covers more than any one deepened. Two consequences: this is why cross-*provider* panels beat deepened same-model ones (Axis 2), and why review is worth heavy spend — **review is far cheaper than the work it audits**, so a stacked review pass is high-return even at several reviewers per finding. The failure to avoid is redundant lenses (three reviewers all reading the diff the same way) — that's the correlated-panel antipattern, not a stack.

### The decision procedure (recommended default)

When actually picking between options, run this six-step procedure in order:

**1. First question: can anything external check it?**
If tests, execution, compilation, a known answer, or a simulation can grade the options — use that and stop. Every judge-based method is a fallback. Even a partial external check (property invariants, schema + semantic plausibility) beats a full model judge for what it covers. Caveat: with an imperfect verifier, don't generate-until-pass; cap N at ~5–10 or false positives dominate.

**2. If not: pairwise, never absolute.**
Judges are far more reliable at "A vs B" than "score this 1–10" — the anchor is the other candidate. Non-negotiable hygiene:
- Swap order and compare both directions; disagreement after the swap = tie.
- Judge against explicit criteria, not vibes — style/verbosity bias (0.76–0.92) is the largest measured judge bias; the wordier option wins by default without a rubric.
- Analyze before comparing — the judge critiques each option independently first, then compares. Prevents shallow judging.
- Never let the generator's model family judge its own output if avoidable; self-preference doesn't shrink with judge capability.

**3. Score with atomic criteria, decide with a veto structure.**
If you need more than a winner (pass/fail, ranking): decompose into binary checks (§7), one judge call per check, aggregate in code. Prefer **minority-veto over majority-vote** for anything risk-shaped — the rubber-stamp result (validators approve >96% of valid outputs, catch <25% of invalid ones) means one dissenting judge is more informative than three agreeing ones. VISTA's version: win requires majority criteria *and* no loss on the single most critical criterion.

**4. Don't trust agreement as the decider.**
Convergence across independent agents is a *confidence signal*, not a selection rule — the correct answer is often the minority position (oracle-vs-voted gap up to 32 points), and model panels have ~2 effective independent votes anyway. Use agreement to rank confidence, not to pick.

**5. Before finalizing: try not to pick at all.**
Check whether runner-ups have components the winner lacks. Grafting the best elements usually beats pure selection. Cheap to check: one agent, "what does each loser do better than the winner?"

**6. Reserve the human for values, not quality.**
If the remaining choice is genuinely taste/risk/tone — a values call — present 2–3 finalists with an explicit tradeoff map and stop. That's the one selection problem no verifier or judge owns, and it's where a human gate is small enough to actually function (rubber-stamping sets in when a person reviews forty outputs).

One-line version: **verify if reality can, pairwise-with-rubric if it can't, veto over vote for risk, agreement as confidence not choice, graft before you crown, and hand the values call to the human.**

Practical default pipeline: generate options with structural diversity (different strategies, not different seeds) → kill broken ones with mechanical checks → bidirectional pairwise tournament with a criteria rubric → graft check on runners-up → done.

### Which axis is this?

Axis 3 is the *n-ary* question (N candidates → one output); Axis 6 is the *unary* question (one artifact → pass/fail). The verification methods above are **shared vocabulary**: a test suite is a gate when it blocks one candidate and a selector when it ranks N. Purely n-ary items (pairwise, Elo, differential testing, agreement counting, synthesis) are pure Axis 3. Some items aren't Axis 3 at all: compression survival is a chain topology (Axis 1) whose output happens to be a ranking; adversarial survival is Role differentiation (Axis 2) + an attack loop (Axis 4) with only the final survival count being Axis 3; ship-and-measure defers convergence outside the workflow entirely.

The general lesson: **the axes classify decisions, not tools.** Any named technique bundles several axis choices — decompose it and you can swap one part without breaking the others. Practical consequence of the gate/selector split: cheap gates first (Axis 6 kills broken candidates), expensive convergence after (Axis 3 ranks survivors). That's the funnel, and why generate-and-filter precedes tournaments.

