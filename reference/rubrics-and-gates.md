# Part III — Quality Engineering

## 7. Writing good rubrics

Rubrics are how you build the Model gate (Axis 6). The research here is unusually consistent (Autorubric arXiv 2603.00077, RubricBench ACL 2026, CMU human-autorater agreement arXiv 2605.06283, RULERS arXiv 2601.08654, HealthBench).

### The big three (most of the gains live here)

1. **Decompose to atomic binary checks.** The field converged: holistic → analytic → atomic. Each criterion is one constraint, phrased as a yes/no question, independently verifiable. "Does the response state the correct capital?" not "Rate factual quality 1–5." Binary items have the highest inter-rater reliability for humans *and* LLM judges. HealthBench runs 48,562 physician-authored binary criteria this way. RubricBench's standard: 2–10 items per rubric, exactly one constraint per item.
2. **Lowest-precision scale that captures the distinction.** Binary when the question is "violated or not." Three-point (fail/partial/pass) when triage needs degrees. Go to 1–5 only with gold-label data proving the judge can use that resolution — fine-grained scales invite the judge to invent distinctions it can't defend; MT-Bench data shows binary judges align with humans better than 5-point judges on the same task. Never 1–10 or 1–100: LLMs hedge toward the middle on wide scales (central tendency bias).
3. **One criterion per judge call.** Scoring faithfulness + relevance + fluency + format in one pass produces correlated scores — the judge anchors on the first dimension and it bleeds into the rest. Separate calls per criterion, aggregate in code. Prompt caching makes this nearly free.

### Writing the items

- **Write the rubric blind to candidate outputs.** Derive criteria from the task/instruction only, before seeing any responses. Criteria that depend on features of a specific response contaminate neutrality (RubricBench: "semantic objectivity").
- **Capture implicit constraints, not just explicit ones.** "Walking tour for the elderly" implies rest breaks and accessible routes. Good rubrics make the implicit checkable.
- **Examples raise agreement; complexity lowers it.** Quantified by the CMU study: representative examples and context increased human-autorater agreement; higher rubric complexity and conservative aggregation decreased it. For multi-trait analytic scoring, *concise keyword-style* criteria beat long guideline prose.
- **No overlap, no conflicts.** Redundant items double-count; conflicting items make the score incoherent. Prune to atomicity.
- **Penalty criteria are legitimate.** "Response does NOT invent citations" as a weighted negative check is often sharper than a positive quality item.

### Making judgments auditable

- **Require verbatim evidence per check.** Forcing the judge to quote the exact text that satisfies/violates each item both prevents central-tendency hedging (the judge can commit to extreme scores when evidence warrants) and makes every verdict auditable (RULERS). Quote-or-it-didn't-happen.
- **Lock the rubric, then execute.** Compile the rubric into a fixed checklist before judging so criteria can't drift with the judge's internal state mid-run.

### Calibration (the step everyone skips)

- **Validate against a small gold set before trusting.** Same model, same criterion: 0.40 vs 0.75 alignment with human labels depending only on rubric structure. You don't know which you have until you measure.
- **Bias-correct rather than fine-tune.** LLM judges are systematically harsh on surface traits (grammar, formatting) vs human raters, and the offset is stable — detectable with small validation sets and correctable as a constant. Higher-order traits (organization, reasoning) need larger samples.
- **Stress-test against responses of varying quality**, including deliberately bad ones. A rubric that passes everything is a rubber stamp; RubricBench's QC explicitly validates discriminativeness against held-out responses.
- **Give the judge a way out.** An explicit "Unknown / insufficient information" option reduces hallucinated verdicts (Anthropic's evals guidance).

### The one-paragraph recipe

Derive 2–10 atomic yes/no checks from the task alone, before seeing outputs, covering explicit and implicit constraints, no overlaps. One judge call per check, verbatim evidence required, aggregate in code with explicit weights. Validate against ~20–50 human-labeled examples, measure per-check bias, correct it, and stress-test with known-bad outputs to confirm the rubric can actually fail things.

## 8. Reference: Anthropic Managed Outcomes

The Managed Agents API ([Define outcomes](https://platform.claude.com/docs/en/managed-agents/define-outcomes), beta `managed-agents-2026-04-01`) is the evaluator-optimizer loop productized — useful both as a tool and as independent validation of this document's principles:

- A `user.define_outcome` event carries a description plus a **required markdown rubric** (inline or via Files API for reuse across sessions).
- The harness **auto-provisions a grader in a separate context window** — explicitly so it isn't influenced by the main agent's implementation choices. Writer-never-reviews, built into the platform.
- The grader scores **each criterion independently** and returns per-criterion pass/fail with explanation; feedback goes back to the agent for the next iteration.
- **`max_iterations`: default 3, max 20** — a hard bounded loop.

Its rubric tips match §7: explicit gradeable criteria ("The CSV contains a price column with numeric values," not "the data looks good" — vague criteria produce noisy evaluations because criteria are scored independently), and the **example-first trick**: if you don't have a rubric, give Claude a known-good artifact, ask it to analyze what makes it good, and turn that analysis into the rubric. Grounds criteria in a real quality distribution instead of imagined ones.

An independent Anthropic product team converged on separate-context grader + per-criterion independent scoring + bounded iterations — three of the top findings from the rubric literature — as defaults you can't turn off.

