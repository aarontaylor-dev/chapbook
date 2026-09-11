# The generation-first apparatus eval — pilot

The shipped result (5/9 → 8/9) tested **consumption**: whether a reader decides
better when the apparatus is present. This asks the other question — whether an
apparatus helps a model **write**. This directory is the pilot that runs first.

## What the pilot is for

It is **not** trying to show the apparatus works. Twelve items cannot carry
that, and the numbers it produces are not evidence about models. It tests
whether the **instrument** can tell the arms apart at all, on two questions:

1. **Does D fail?** Annotate-everything must not beat the unannotated baseline.
   If it does, the rubric is rewarding density and every number a full run
   produced would be uninterpretable. Stop condition, not a finding.
2. **Does B beat E?** Same mark count, different placement. If they are level,
   placement is not the mechanism and the headline claim has no support.

Both checks cost about 5% of a full run. Finding either at the end instead is
the expensive way.

## Arms

| Arm | | |
|---|---|---|
| A | no provenance | baseline |
| B | provenance on gold slots only | the shipped style |
| D | provenance on every slot | over-annotation control |
| E | provenance on non-gold slots, count matched to B | placement control |
| F | same as B | ceiling, kept distinct so it can diverge later |

Arms are **generated** from each item's slots rather than written out five
times. That is what guarantees E carries exactly as many marks as B — written
by hand, the two would drift and E would quietly become a density control.

## The rule the items encode

A slot is **gold** when a reader could act differently depending on whether the
phrase is a measurement, a preference, a carried constant, or a rejected
alternative. Everything else is a slot that *could* carry provenance and should
not. Precision is weighted over recall (F<sub>β=0.5</sub>) because the failure
being hunted is annotating too much.

Two balance properties are load-bearing. Actions are even within the transplant
pool (3/3/3), so an always-X reader cannot score well without reading — the
report prints that floor beside every arm. And a third of items are ones where
provenance **unlocks** a change rather than blocking it; an apparatus that only
ever adds caution is braking, not helping, and a set of pure refusals cannot
tell those apart.

## Running it

```sh
npm install
npm run validate   # structural audit, no API, no cost
npm run dry        # whole pipeline with a stand-in reader, no API, no cost
npm run run        # the paid pass — needs credentials
npm run report     # aggregate the latest run
```

`npm run dry` is a self-test, not a smoke test: the stand-in reader always
answers "refuse", so it must land on exactly the majority-class floor and fail
every instrument check. If it does anything else, the scorer is wrong before a
single real call is made.

Credentials: export `ANTHROPIC_API_KEY`, or `ant auth login`. Readers are
`claude-opus-5`, `claude-sonnet-5` and `claude-haiku-4-5` — three readers, but
one family, which is a real limit on the "holds on ≥2 of 3 readers" condition
and should be widened before the full run.

## Known limits, stated rather than buried

- **The chapbook pool is contaminated by construction.** `system.md` is public
  and plausibly in training data. Those three items are calibration and sanity
  only; nothing in the pass bar may rest on them. The pass bar rides on the
  transplant pool.
- **B and E match on mark count, not on word density.** Gold provenance is
  genuinely longer than decoy provenance — a measurement with a date has more
  to say than a preference. E therefore runs at *higher* marks-per-100-words
  than B (2.08 vs 1.64), so a B win is a win despite the handicap. What it does
  not separate is placement from informativeness; length-matching the decoys
  would isolate placement more tightly at the cost of making them artificially
  verbose.
- **There is no generator in the pilot.** Arms are constructed, not written by
  a model. That is deliberate — an instrument that cannot distinguish gold
  placement from random placement will never evaluate a generator — but it
  means the pilot says nothing yet about whether a model can *write* the
  apparatus. That is what the full run is for.
- **Twelve items cannot reach significance.** At realistic flip rates the
  paired test needs ~60. The pilot reports CIs and p-values so the instrument's
  behaviour is visible, not so the hypothesis can be decided.

## Files

| | |
|---|---|
| `items.js` | the 12 cases: passage, slots, proposed change, correct action |
| `lib/apparatus.js` | arm construction and every metric; calls no model |
| `validate.js` | structural audit over the whole set |
| `run.js` | the reader-decision pass |
| `report.js` | aggregation and the two instrument checks |
