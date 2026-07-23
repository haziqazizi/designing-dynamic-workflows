## 6b. Case study: creative image & video generation

The creative-generation research community independently reinvented most of Part II — evaluator-optimizer loops, binary-checklist judges, tournaments, lens critics, funnels — with the twist that the artifact is stochastic pixels and the closest thing to an external verifier is a VLM. Deep-read sources: VISTA (Google, CVPR 2026), Co-Director (Google, arXiv 2604.24842), MAViS (EACL 2026), CREA (NeurIPS 2025), ComfyClaw (arXiv 2607.01709), M3 (arXiv 2602.06166), "See it. Say it. Sorted." (arXiv 2508.15222), coDrawAgents (CVPR 2026), Image-POSER (arXiv 2511.11780).

### Domain-specific ground rules

1. **Optimize the input, not the artifact.** You can't edit a video; you edit the prompt/graph/layout that produces it and regenerate. This makes regression protection mandatory, because a "refined" input can yield a worse sample.
2. **The VLM checklist-judge is the external check.** No test suite exists for "does this look right"; a VLM decomposing the prompt into binary observable requirements (ComfyClaw, M3) is the strongest available verifier — and needs its *perception* calibrated, not just its rubric (VLMs miscount, miss spatial relations; Sorted's Critic is explicitly its admitted bottleneck).
3. **Cost-asymmetry funnels are extreme.** Stills-vs-video costs differ ~100×; practitioner discipline is "iterate on images, spend video credits only on locked frames." The funnel isn't an optimization here — it's the business model.
4. **Orchestration beats bigger models.** M3 (training-free wrapper) pushed open-source Qwen-Image past Imagen4 and doubled spatial accuracy; ComfyClaw added +10 points over no-refinement; practitioners report harnessed small models matching unharnessed big ones.

### Patterns worth stealing (not previously in this guide)

**Regression protection (Axis 4 extensions):**
- *Champion retention / elitism* (VISTA): the current best prompt always re-enters the next selection round, so the selected output can never regress even while exploration fluctuates.
- *Best-so-far buffer* (ComfyClaw): tolerate non-monotonic exploration mid-loop; always ship the highest-scoring iterate seen.
- *Revert-on-no-improvement* (Sorted, M3): a pairwise "better/worse/same" verdict gates every acceptance; if no candidate beats the incumbent, revert and re-critique.
- *Escape hatch* (M3): after K failed repair attempts, mark the constraint *skipped* and permanently exclude it — bounded retry per item, no infinite loops on unfixable constraints.

**Judging refinements (Axis 3 / §5 extensions):**
- *Probing-critique-before-comparison* (VISTA): the judge writes an independent critique of each candidate *before* the pairwise comparison — splitting analysis from comparison to prevent shallow judging.
- *Bidirectional pairwise* (VISTA): every pair compared twice with order swapped; residual disagreement counts as a tie.
- *Select-then-critique* (VISTA): tournament first, deep critique only of the champion — don't spend critique on losers.
- *Hybrid reward* (ComfyClaw): 0.6 × binary-checklist pass-rate + 0.4 × holistic 0–10 score — checklist for correctness, scalar for quality.
- *Tiered/cascaded judging* (M3-Hybrid): cheap mechanical proxy (CLIP score) where it suffices, full VLM judge only where needed.
- *Sequence-level joint judging* (Co-Director): judge the keyframe *set* together, not per-frame — cross-item failures (identity drift, continuity) are invisible to isolated judging. The judging-side twin of the seam review.
- *Adversarial judge in the jury* (VISTA): per dimension, a Normal judge + an Adversarial judge (attacks the artifact) + a Meta judge that consolidates.

**Feedback design (Axis 6 / §7 extensions):**
- *Repair feedback in actuator vocabulary* (ComfyClaw): the verifier returns failing criteria + localized descriptions ("leftmost figure has three arms") + edit suggestions phrased in the actuator's terms ("apply regional prompting to isolate the throwing arm"). Converges far faster than pass/fail verdicts alone.
- *Relational feedback, not coordinates* (Sorted): "the blue rectangle should just touch the red circle on its left" — VLMs are unreliable at numbers, and element IDs go stale as the artifact evolves. Applies to any loop editing an evolving structured artifact.
- *Capped critique* (Sorted): the critic names at most 1–3 discrepancies per step — small-step optimization by design; large multi-edit batches cause oscillation.
- *Diagnose-before-edit* (VISTA's DTPA): the rewriter must first classify the failure (model limitation vs input deficiency vs internal conflict) before proposing changes — naive rewrite-from-critique measurably overcomplicates prompts.
- *Criteria baked into generation* (CREA): generate one contrastive prompt per judging criterion, then fuse — produce against the rubric you'll be graded on, instead of only filtering by it afterward.

**Structure (Axes 1–2 / §6 extensions):**
- *Backward repair* (coDrawAgents): each round, the checker re-audits *all previously accepted* work for conflicts the new additions revealed, and retro-edits it. Forward-monotonic with backward repair.
- *Canvas as working memory* (coDrawAgents): condition each planning round on the partially-rendered artifact, not on imagined state.
- *Adaptive routing* (coDrawAgents): a one-shot complexity classifier sends simple inputs straight to the generator and reserves the multi-agent loop for hard ones.
- *Validation-gated memory promotion* (ComfyClaw): distilled skills/lessons are committed to the library only if reward on synthesized held-out tasks doesn't regress — compounding memory with a non-regression gate, not append-only notes.
- *Factored bandit reward* (Co-Director): the judge scores each strategic dimension separately and each score updates its own bandit arm — credit assignment across a non-differentiable pipeline. Ablation: collapsing to one scalar costs 5 points.
- *Cost-risk-tuned iteration caps* (MAViS): caps per stage set by (cost per iteration × downstream blast radius) — subtitle fixing gets cap 5 (cheap, breaks everything downstream), image-to-video gets cap 1 (36 min/shot).
- *RL over tool selection* (Image-POSER): a small DQN learns which expert model to invoke per sub-task, with a per-step penalty in the reward biasing toward shorter pipelines.

### Relation to Anthropic Managed Outcomes (§8)

Managed Outcomes covers the loop skeleton, grader isolation, per-criterion scoring, and bounded iterations. Building a creative loop on it requires adding four things it lacks: (1) champion/best-so-far tracking — its loop has no revert, fine for cumulative text edits, unsafe for stochastic generation; (2) repair feedback in actuator vocabulary, not just per-criterion pass/fail; (3) select-then-critique when generating multiple candidates per iteration; (4) calibration of the grader's *perception* (stress-test the VLM on known-good/known-bad images), not just its rubric.

### Judge models and lineage

No consensus judge: VISTA = Gemini 2.5 Flash, Co-Director = Gemini 3 Pro, MAViS & CREA = GPT-4o, Sorted = Gemini 2.5 Pro, coDrawAgents = GPT-5, Image-POSER = GPT-o3, ComfyClaw = self-verifying (cross-checked with Qwen3-VL-8B). Three of nine have same-family or self-judging setups (VISTA's Gemini judges Veo; Image-POSER's critic and task-decomposer are the same model, admitted as a bias; ComfyClaw self-verifies) — the correlated-lineage risk from §9 Axis 3, live in published work. The two most rigorous papers are the ones that addressed it: VISTA replicated results under a cross-family judge (Qwen2.5-VL-32B) plus 66.4% human preference; Co-Director calibrated its judge against 5 human raters and reported where correlation is weak (Visual Quality: the MLLM penalizes per-frame artifacts humans never notice at playback speed). **Rule: state your judge's lineage relative to your generator, and validate with either a cross-family judge or humans before trusting win rates.**

### Practitioner check (X, July 2026)

Practitioner discourse confirms a *subset*: harnesses elevating small models, recipe libraries (fixed strategy menus as product), persistent "project brains" (files-as-memory with locked character sheets), image-first credit discipline, and "verification is the most important part of closed-loop development" (Boris Cherny, widely shared). Nobody talks about tournaments, jury critique, or monotonic gates — the formal selection machinery is ~6–12 months ahead of practice, and/or practitioners get most of the value from the cheap patterns with human eyeballs as the judge. The formal loops likely only pay at automation scale, where a human can't look at every frame.

---

