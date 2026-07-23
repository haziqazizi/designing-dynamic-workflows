# Part IV — Implementation Survey

## 10. Code-mode implementations in the wild

"Code mode" = the LLM writes executable code to orchestrate work instead of emitting one tool call at a time. Lineage:

```
CodeAct (ICML 2024)                "emit Python instead of JSON tool calls" (+20%)
  → smolagents CodeAgent (HF)      code-as-action, pluggable sandboxes
  → Cloudflare Code Mode           code-as-tool-composition, real isolates
  → Anthropic dynamic workflows    code-as-AGENT-orchestration
    → Michael Livs pi port         minimal prototype
      → Quintin Shaw pi port       production fork (routing, journal, worktrees, TUI)
        → six-ddc CLI              same API, backend-agnostic (Codex/Gemini/pi)
```

**Two species.** Code-orchestrates-*tools* (CodeAct, smolagents, Cloudflare): one LLM writes code calling deterministic functions. Code-orchestrates-*agents* (the pi ports, Claude Code's Workflow tool): the code spawns other LLM sessions. Same founding insight, different cost/failure profiles.

**Security spectrum** (weak → strong): in-process exec (CodeAct) → AST-allowlist interpreter (smolagents local, honestly documented as not a boundary) → Node vm realm "for determinism, not security" (both pi ports) → separate Worker isolate with runtime-enforced network block (Cloudflare) → containers (CodeAct docker, smolagents remote). The agent-orchestrating implementations sit mid-spectrum deliberately: their threat model is accidental nondeterminism breaking replay, not malicious code — the orchestrator model authors the script.

**Durability spectrum**: none (CodeAct, smolagents, Michaelliv — disclaimed) → positional-callSeq journal with longest-unchanged-prefix edit-and-resume (Quintin Shaw, Claude Code) → SQLite-in-Durable-Object with explicit `step()` side-effect boundaries, whole-code replay, divergence detection, and an approval/rollback state machine (Cloudflare's durable runtime — a mini-Temporal).

**Steal-worthy engineering details:**
- *Control-marker-not-throw RPC* (Cloudflare): cross-sandbox calls never reject — they resolve to sentinel objects re-thrown locally, because rejected RPC promises surface as unhandled host rejections.
- *`withGlobalsHint`* (Cloudflare): a sandbox ReferenceError is enriched with the actual list of available globals before the model sees it — the retry gets ground truth, not a bare stack trace.
- *Empty-cache-is-miss* (Quintin Shaw): a journaled result that is empty text is treated as a cache miss on replay, so a failed-empty output can't perpetually replay as success.
- *Journaled human checkpoints* (Quintin Shaw): `checkpoint()` hashes the prompt/choices and journals the human's answer — a resumed run replays the answer instead of re-asking; headless runs take a default or abort.
- *Per-agent delta-journaled shared store with surgical rollback* (Quintin Shaw): failed retry's writes rolled back per-key with `Object.is` guards so a concurrent sibling's legitimate overwrite isn't clobbered; deltas replayed additively in callSeq order.
- *Terminating structured-output tool* (Michaelliv): the schema tool returns `{terminate: true}` so the subagent's turn ends on the call — no wasted final turn.
- *`FinalAnswerException extends BaseException`* (smolagents): the completion signal can't be swallowed by LLM-written `except Exception:`.
- *Model-actionable size errors* (Cloudflare): oversized durable values fail with "write it to a file and pass a reference," not silent truncation.

## 11. Case study: extending a real implementation (Quintin Shaw's package)

**Coupling points to its host (Pi), in decreasing depth:** (1) subagent spawning (`WorkflowAgent.run()` → Pi in-memory sessions with Pi's tool loop); (2) usage accounting (`usage.total` from the Pi session, chars/4 fallback); (3) tool/extension registration + `/reload` lifecycle; (4) TUI (soft — headless fallbacks exist); (5) model routing/auth via Pi providers. Everything else — vm realm, journal/resume, limiter, SharedStore, persistence, budgets, worktrees, quality helpers — is already harness-independent, and the helpers are implemented purely in terms of `agent()`, so they inherit agnosticism from whatever `agent()` becomes.

**Agnosticism verdict:** extract an `AgentBackend` interface (`spawn(prompt, {model, schema, cwd, tools, signal}) → {result, usage}`) and the runtime ports anywhere — six-ddc proves the shape (same script API; backends = Codex thread / Gemini process / pi process). The hard parts are usage accounting (backends report tokens differently or not at all, silently breaking budgets) and schema enforcement (the terminating-tool trick has no Codex/Gemini equivalent; fallback to response-format or repair-parse weakens bounded repair).

**Ranked additions (research-backed, from this guide's findings):**
1. Three-way verdicts in `verify()` — `confirmed | refuted | contested` instead of default-refute binary; contested survives with both readings (fixes the kill-by-majority antipattern).
2. `pairwise()` tournament helper — bidirectional comparison, tie-on-disagreement, probing-critique-before-comparison; demote absolute-scoring `judgePanel()` to second choice.
3. `corroborate()` — agreement counting across blind agents' keyed findings; 2+-flag findings skip verification (convergence-as-signal, currently absent).
4. Judge-lineage-aware routing — verify/judge calls default to a different model family than the work they judge (the ~2-effective-votes result makes same-family panels theater).
5. Champion tracking in `gate()`/`retry()` — best-so-far retention; a later worse attempt must not be what returns.
6. Eviction instead of null — `parallel()`/`pipeline()` failures carry `{item, error, context}` for a bounded second pass, instead of silent nulls.
7. Placeholder gate behind schema validation — reject "test"/"TODO"/all-identical-fields results (schema-valid garbage is a live failure mode).
8. `withGlobalsHint` for vm script errors.
9. `seamReview()` — packaged cross-unit review after any worktree fan-out lands.
10. The `AgentBackend` interface itself — biggest effort, biggest strategic payoff; every helper above benefits every backend the day it exists.

Deliberately excluded: bandit-guided saved workflows (pays only at dozens of runs), validation-gated skill evolution (a whole subsystem), true security sandboxing (their honest vm stance is correct for the threat model).

## 12. Case study: autoresearch — when reality is the judge

Karpathy's `autoresearch` (March 2026, ~1,000 lines, 3 files) is the opposite end of the spectrum from judge-heavy creative loops: an agent autonomously runs ML experiments overnight, and the evaluator is a real training run, not a model.

**The mechanism:**
- `prepare.py` — immutable: data, evaluation, constants. The agent cannot touch it.
- `train.py` — the agent's sandbox: model, optimizer, training loop, all fair game.
- `program.md` — the only file the human edits: research directions, constraints, the experiment loop. "A super lightweight skill" — 114 lines of markdown as the entire management layer.
- Loop: propose hypothesis → edit `train.py` → commit → train exactly 5 minutes wall-clock → evaluate `val_bpb` → improved: commit stays; didn't: `git reset HEAD~1` → repeat. ~12 experiments/hour, ~100 overnight. Karpathy's run: 700 experiments in 2 days, 20 kept optimizations, 11% training-speed gain transferred to a larger model.

**Mapping to this guide:**
- *`prepare.py` is the external verifier made immutable* — selection-ladder rung 1 plus the reward-hacking defense ("restrict write access to test files") in one design move. The agent can't game the judge because it physically can't edit the judge.
- *Git as champion tracking* — keep-if-improved / revert-if-not is M3's monotonic ratchet and VISTA's elitism, implemented as `git reset`. HEAD is the champion.
- *Fixed 5-minute budget* — hold the measurement constant so the variable is the change; the time-boxed twin of a locked rubric.
- *`program.md` is the charter* — human writes spec and constraints, not code; the same division of labor as Managed Outcomes and PRD-as-contract.
- Karpathy's own limit statement matches the ladder's: it works only where a scalar metric is a reliable proxy — "anything that feels softer is, like, worse."

**What it deliberately lacks (per this guide's axes):** it's greedy and sequential. One agent, one experiment at a time, no fan-out over hypotheses, no eviction-with-context (near-misses are discarded without memory), no bandit over research directions, and a greedy ratchet that can't cross a valley — a change that only pays combined with a second change is reverted before the second is tried.

**The fork ecosystem is independently rediscovering this guide's additions, in order:** `hwchase17/autoresearch-agents` (multi-agent — the fan-out upgrade), `sebasmos/autoresearch-dj` (adversarial testing — the adversarial gate), `ajzhanghk/autoresearch-glm` (tabular GLM feature discovery — proof the loop generalizes: editable asset + scalar metric + time-boxed cycle works in any domain with those three), a Gemini-CLI skill adding search-grounding verification inside the loop, and `dimitreOliveira`'s Colab/TPU port that auto-opens a PR per kept improvement (a review artifact added to the ratchet). Plus a dozen platform ports (macOS/MLX, Windows, ROCm, WebGPU-in-browser, C++, Rust).

**The distilled lesson:** autoresearch is evaluator-optimizer where the evaluator is reality — and it's the existence proof that when you have selection-ladder rung 1 (an external, ungameable, scalar verifier), nearly everything else in the convergence toolbox becomes unnecessary. The judge machinery in §5–§7 exists for domains that *don't* have a `val_bpb`. Before building a judge, check whether you can build a `prepare.py` instead.

---

## Appendix: sourcing caveat

The strongest citations are peer-reviewed: MAST (arXiv 2503.13657), correlated judge panels (arXiv 2605.29800), self-bias amplification in self-refinement (ACL 2024), self-consistent errors (EMNLP 2025, arXiv 2505.17656), diversity collapse (ACL 2026, arXiv 2604.18005), Autorubric (arXiv 2603.00077), RubricBench (ACL 2026), rubric-modification agreement study (arXiv 2605.06283), RULERS (arXiv 2601.08654). Several items are engineering-blog grade (tianpan.co, usewire.io, agent pattern catalogs) — mechanisms plausible, numbers unaudited. One source domain (`clawrxiv.io`) is unrecognized and its figures (the 71%-coordination-tokens study) should be verified before formal citation. The mechanisms, though, recur across independent sources — which, per this very document, is the signal that counts.

§6b's creative-generation case study is built on deep-reads of nine papers (VISTA, Co-Director, MAViS, CREA, ComfyClaw, M3, Sorted, coDrawAgents, Image-POSER); a tenth (Instruct-MR, Springer 2026) is paywalled with no preprint and is reported only to abstract level. The X practitioner check covers only the last 7 days of posts (July 2026) and survived heavy promo-noise filtering — directional, not exhaustive.

*Compiled July 2026. Pattern taxonomy informed by Anthropic's Workflow orchestration primitives, Anthropic's Managed Agents outcome/rubric docs and "Demystifying evals for AI agents," Stephanie Jarmak's agent-workflows / coding-agent-workflows repos (github.com/sjarmak), and the creative-generation literature cited in §6b.*
