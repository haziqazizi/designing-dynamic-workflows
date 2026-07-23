# Dynamic Workflows: An Onboarding Guide

*What they are, when to use them, the full pattern space, the mechanisms in detail, how patterns compose, how to build the gates — and the antipatterns that break all of it.*

---

# Part I — Concepts

## 1. What they are

A dynamic workflow is a small JavaScript program that orchestrates a fleet of AI agents deterministically. The program is dumb and reliable — loops, conditionals, fan-outs written in real code. The agents are smart and unreliable — they read, judge, write. The workflow's job is to arrange many unreliable smart things into one reliable smart thing.

The core insight, in one line: **a single agent has one perspective and stops at its first plausible answer; a workflow buys you many independent perspectives and refuses to stop early.**

Three primitives do all the work:

- `agent(prompt, {schema})` — spawn one agent, get back validated JSON. The schema is the contract; no parsing, no "hopefully it returned a list."
- `parallel([...])` — run N agents at once, wait for all (a barrier).
- `pipeline(items, stage1, stage2, ...)` — each item flows through stages independently, no waiting. Item A can be in review while item B is still being built.

Everything else — debates, tournaments, retry loops — is these three plus plain JavaScript.

## 2. When to use one

Use a workflow when the task has one of these shapes:

- **Too wide for one context.** Audit 60 files, migrate 40 call sites, read 8 subsystems. One agent's context fills up; ten agents' don't.
- **Confidence matters more than speed.** One agent saying "this is a bug" is a guess. Three mutually-blind agents flagging the same line is evidence.
- **The first answer is a trap.** Design decisions, architecture choices, "how should we approach X." A single agent anchors on its first idea. Fan-out forces genuinely different answers to exist before anyone picks.
- **You're producing competing artifacts.** Three prototype implementations in isolated worktrees, compared, best ideas grafted.

Do **not** use one when:

- You know the file and the fix. Just do it. A workflow to change one constant is a forklift for a teaspoon.
- The steps depend on each other's judgment at every turn (debugging an unknown failure). That's a conversation, not a fan-out.
- The work is inherently sequential — a bisect can't be parallelized; each step needs the last step's answer.

Rule of thumb: **workflow when you can name the items or the perspectives in advance.** If you can write the list, you can fan out over it. If you can't, scout first (cheap, inline), then fan out over what you found.

## 3. Specific examples

### Code review that doesn't cry wolf

Five finders, each locked to one lens: correctness, security, concurrency, performance, API contracts. Their findings (structured: file, line, claim, evidence) flow through per-finding verification — three skeptics each, verdict `confirmed / refuted / contested`. Findings two lenses independently flagged skip verification entirely: agreement between blind agents already is verification. Output: confirmed bugs ranked by independent-flag count, contested items listed with both interpretations.

### Premortem before a risky build

Six agents each write a narrative from the future: "It's three months out and this project failed — here's the story." Each gets a different assigned cause: scaling, a dependency, human error, security, scope, data integrity. A synthesizer merges them into a risk registry. Risks that appear in multiple independent narratives go to the top. Costs a few minutes; the failure modes it surfaces are precisely the bugs you'd otherwise debug at 2am.

### Spec quality check via replication

Before spawning ten builders against a spec, spawn three agents with the *identical* spec, isolated worktrees, zero hints. Diff the results. Where all three made the same choice, the spec is clear. Where they diverged, the spec is ambiguous — fix the words before paying for ten builds. Variance is the measurement; the orchestrator must not pre-answer ambiguities it noticed, or the instrument reads falsely clean.

### PRD to working code

Decompose the PRD into 5–10 work units with machine-checkable acceptance criteria, sorted into dependency layers. Within a layer, units build in parallel, one worktree each, scoped context only. Every unit is reviewed by a *different* agent with fresh eyes — the writer never reviews its own work. Rejected units retry up to 3 times with the rejection reason fed to a fresh implementer; still-failing units are evicted with context and retried in a later pass. After everything lands: one seam review over the merged diff, hunting the bug class parallel isolation creates — interface mismatches, duplicated logic, criteria that fell between two units.

---

