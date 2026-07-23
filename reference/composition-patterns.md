## 6. Composition patterns

How whole workflow phases combine. Each idiom named with the problem it solves.

**The funnel (progressive disclosure).** Order stages by cost-per-item, cheapest first, each stage earning the next: 3 thirty-second probes → 5 full tasks only if probes are interesting → 20 tasks with trials only if you need rigor. Never run an expensive stage on items a cheap stage could have eliminated. The inverse smell: full verification on 40 findings when a dedup + agreement-count would have killed 30 first.

**Diverge → converge (nominal group).** Independent generation strictly *before* any interaction. The ordering is the whole pattern — the group-brainstorming research (Diehl & Stroebe) and the debate-sycophancy research say the same thing: interaction during generation destroys diversity; interaction after generation resolves it. Any workflow where agents can see siblings' in-flight work has quietly broken this.

**Evaluator-optimizer loop.** Generator produces, separate-context grader scores against a rubric, feedback returns, repeat under an iteration cap. This is Anthropic's Managed Outcomes (§8) and the inner loop of prd-build. Three load-bearing details: grader context is isolated (else self-preference), feedback is per-criterion (else the generator can't tell what to fix), the cap is hard (else scratchpad rot). Use when criteria are articulable; useless when you can't say what "better" means.

**Scout → fan-out.** Cheap inline reconnaissance builds the work-list; the fleet spends on the list. You don't need to know the shape before the task — only before the orchestration step. Skipping the scout produces fan-outs over guessed decompositions, which is how you get over-decomposition.

**Measure → invest.** Run a cheap *instrument* before an expensive commitment: replicate (3 identical-spec agents) before ten builders — variance tells you if the spec is broken; constraint-inversion before locking an architecture — which constraints are actually load-bearing; a probe eval before a full benchmark run. Some workflow shapes exist purely to measure whether a later shape is worth running.

**Plan-gate → execute → seam review.** Three stages, two distinct review types. First gate the *decomposition itself* (does the union of work units cover the acceptance criteria? is any unit two reasons-to-change glued together?) — before any build spend. Then per-unit implement+review. Then a seam review over the merged whole, because per-unit review structurally cannot see cross-unit bugs. Most people run stage 2 only; the bugs live at stages 1 and 3.

**Sweep → critic → resweep (completeness loop).** After any coverage-shaped phase, one agent asks: "what's missing — which modality wasn't searched, which claim wasn't verified, which source wasn't read?" Its findings become the next round's work-list; loop until the critic comes up dry. Converts "we did a lot" into "we know what we didn't do."

**Competition → cross-pollination.** After any tournament or prototype fan-out, an explicit grafting stage: winner as base, best individual elements from losers spliced in, with a seam map of where the grafts join (that's where the bugs will be). Skipping this is winner-take-all waste — you paid for N explorations and kept 1/N of the yield.

**Negotiation loop (co-design).** For coupled subsystems that can't be designed independently: one agent per subsystem, isolated at the code level, coupled only through a shared versioned contract; each round agents propose contract changes, a non-implementing coordinator merges by a deterministic priority policy, settled conflicts can't reopen. The only composition where a *shared mutable artifact* is the coordination medium — safe exactly because writes go through one arbiter with a convergence guarantee.

**Canary → rollout.** For applying a change across many targets (repos, services, configs): full pipeline on one strong-gated target first, let *its* gates run, only then fan out the same change to the rest. Composes any build workflow with any fleet-sized fan-out while capping blast radius at one.

**Fail-stop chaining vs. degrade-and-continue.** The meta-decision when chaining phases: does a failed phase halt the pipeline (never feed degraded input forward) or evict-and-continue (one bad unit shouldn't kill nine good ones)? Rule of thumb — fail-stop when phases feed each other's *inputs* (garbage propagates), evict-and-continue when items are independent (isolation contains the damage).

**Two-level black-box.** An outer supervisor runs each inner workflow as an opaque unit — communicating only via exit status and final artifact, never shared context. Buys crash isolation, honest interfaces (the inner run can't lean on the outer's context), and swappability. The cost is you can't steer the inner run mid-flight; that's usually a feature.

### The grammar underneath

Stages alternate between **widening** (generate, fan out, sweep) and **narrowing** (filter, gate, synthesize). Every widening is bounded by a budget. Every narrowing is owned by someone who didn't produce the work. Between major phases there's either a hard gate or an explicit decision to tolerate degradation.

Compositions fail when they: widen twice in a row without a narrowing (cost explosion), narrow twice in a row without new information (premature convergence), or let the same context both widen and narrow (self-review).

