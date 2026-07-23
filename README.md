# designing-dynamic-workflows

Design skill for multi-agent dynamic workflows: topology, agent differentiation, convergence and selection, stopping rules, isolation, quality gates, and judge rubrics - without the research-backed antipatterns.

This is a **design guide the agent follows**, not a runtime that executes workflows.

## When to use

You are about to orchestrate a fleet of agents or subagents:

- Fan-outs and fan-ins
- Tournaments, debates, generate-and-filter
- Review pipelines, evaluator-optimizer loops
- Any "spawn N agents and combine results" design

## When not to use

- You already know the file and the fix - just do it
- Every step depends on the previous step's judgment (that's a conversation)
- The work is inherently sequential (bisect, single-path debug)

Rule of thumb: **use a workflow when you can name the items or perspectives in advance.** If you can't write the list, scout first, then fan out.

## One-sentence design law

> Independence is the instrument, convergence is the measurement, the model is the judge, code is the referee, files are the memory, and the writer never grades their own homework.

A single agent has one perspective and stops at its first plausible answer. A workflow buys many independent perspectives and refuses to stop early. The program is dumb and reliable (loops, fan-outs, gates in real code); the agents are smart and unreliable.

## Install

### Claude Code / Amp / agents that read `SKILL.md`

```bash
mkdir -p ~/.agents/skills
git clone https://github.com/haziqazizi/designing-dynamic-workflows.git ~/.agents/skills/designing-dynamic-workflows
```

Legacy hosts using `.claude/skills`:

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/haziqazizi/designing-dynamic-workflows.git ~/.claude/skills/designing-dynamic-workflows
```

No API keys or runtime deps. The skill is markdown: `SKILL.md` plus `reference/`.

## How to use

Ask your agent to design (or redesign) a multi-agent workflow. Examples:

```
design a workflow for blind code review of this PR across security, perf, and API lenses
design a diverge-converge workflow that produces 5 PRD options then picks one
review this fan-out plan against the antipatterns
```

The agent should treat `SKILL.md` as an **index** and read the named `reference/` file before each design decision.

## Design steps (index)

| Step | Decision | Read first |
|---|---|---|
| 0 | Should this be a workflow at all? | `reference/concepts-and-examples.md` |
| 1 | Six axes (topology, differentiation, convergence, iteration, isolation, gates) | `reference/six-axes.md` |
| 2 | How to pick among candidates | `reference/convergence-and-selection.md` |
| 3 | How to compose phases (widen / narrow) | `reference/composition-patterns.md` |
| 4 | Rubrics and quality gates | `reference/rubrics-and-gates.md` |
| 5 | Antipattern check | `reference/antipatterns.md` |

Domain-gated (required when that domain is in play):

| Domain | Read |
|---|---|
| Image / video generation workflows | `reference/creative-generation.md` |
| Choosing or implementing a code-mode orchestration runtime | `reference/implementations.md` |

## Layout

```
designing-dynamic-workflows/
├── README.md                          # you are here (human-facing)
├── SKILL.md                           # agent index + step summaries
└── reference/
    ├── concepts-and-examples.md       # what workflows are; 4 worked examples
    ├── six-axes.md                    # full design tables
    ├── convergence-and-selection.md   # selection ladder; debate/tournament
    ├── composition-patterns.md        # funnel, diverge→converge, loops
    ├── rubrics-and-gates.md           # rubric recipe and calibration
    ├── antipatterns.md                # research-backed failure modes
    ├── creative-generation.md         # image/video case study
    └── implementations.md            # code-mode runtimes survey
```

## Quick smells (before you ship a design)

- Fan-out over a guessed decomposition (no scout)
- Agents seeing siblings' in-flight work
- Same model generating and stop-judging its own loop
- Majority vote as the decider
- "Sample until tests pass"
- Human "reviewing" dozens of outputs at the end
- No termination predicate
- Silent dropping of failed items

The meta-failure behind most of these: **correlated errors wearing an independence costume.**

## Related

- Full agent contract: [`SKILL.md`](./SKILL.md)
- Companion runtime experiment (Pi): [pi-dynamic-workflows](https://github.com/haziqazizi/pi-dynamic-workflows)

## License

MIT
