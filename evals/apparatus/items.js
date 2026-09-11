/*
 * The pilot case set. Twelve items, each a passage plus one proposed change.
 *
 * An item is not "a passage with some uncertain bits". It is a decision: given
 * this passage and this change, what should a careful reviewer do? A slot is
 * gold when the reviewer's ANSWER changes depending on whether that phrase is
 * a measurement, a preference, a carried constant or a rejected alternative.
 * Everything else is a slot that could carry provenance and should not.
 *
 * Two balance properties are deliberate and both are load-bearing:
 *
 *   Actions are even — four merge, four refuse, four re-measure. A set that
 *   is mostly refusals lets an always-refuse reader score well without
 *   reading, and the run reports that baseline beside every arm.
 *
 *   A third of items are ones where provenance UNLOCKS a change rather than
 *   blocking it. An apparatus that only ever adds caution is not helping a
 *   reader decide, it is just braking, and a set of pure refusals cannot tell
 *   the two apart.
 *
 * The `chapbook` pool is contaminated by construction — system.md is public
 * and plausibly in training data. Those three items are calibration and
 * sanity only; nothing in the pass bar may rest on them.
 */

export const items = [
  {
    id: 'cb-rail-align',
    pool: 'chapbook',
    correct: 'refuse',
    change: 'Swap `:where()` for `:is()` in the `.body` reset, for consistency with the rest of the stylesheet.',
    why: 'The swap is a silent breakage with a measurement behind it. Without the provenance a reviewer reads it as a stylistic tidy-up, which is how one of three readers merged it.',
    passage: 'The numbered rail sits beside each section and carries its own heading. {{s1}} on the rail, or the number stops tracking the section it names. The rail is {{s2}} wide and its number is set in the mono face. {{s3}}, which keeps author styles winning on source order. Sections are {{s4}} apart and the rail inherits that rhythm. The heading inside the rail is {{s5}}, and the number sits {{s6}} above it.',
    slots: {
      s1: { gold: true, text: '`align-self: start` is required', provenance: '— measured: without it the rail silently stops moving, in every engine, with no console warning.' },
      s2: { gold: false, text: '4rem', provenance: '— sized to fit a two-digit number at the mono face default.' },
      s3: { gold: true, text: 'The reset uses `:where()`', provenance: '— measured: `:is()` takes the specificity of its most specific argument and outranks the rhythm rule, collapsing every gap in the column to zero.' },
      s4: { gold: false, text: '2rem', provenance: '— a preference; the rhythm reads well here and nothing measures it.' },
      s5: { gold: false, text: 'an `<h2>`', provenance: '— chosen so the document outline stays flat.' },
      s6: { gold: false, text: '0.25rem', provenance: '— a preference, adjusted by eye.' },
    },
  },
  {
    id: 'cb-grain-dark',
    pool: 'chapbook',
    correct: 'remeasure',
    change: 'Raise `--grain` in dark from 0.02 to 0.028 so both themes carry the same value.',
    why: 'The grain split is an untested preference, so this is not a refusal — but raising dark grain moves the worst-case pixel the ratios were taken against, so the documented dark ratios go stale. The right answer is to re-measure, and readers without provenance refuse instead.',
    passage: 'The grain overlay sits between the text and the page. {{s1}}. {{s2}}, measured against the worst-case pixel rather than the flat background. Text tokens must clear {{s3}}. {{s4}} and {{s5}} are exempt, since WCAG does not ask a hairline to be legible. The overlay is {{s6}}.',
    slots: {
      s1: { gold: true, text: 'Lower `--grain` in dark', provenance: '— a judgement, and an untested one: nothing measures it and no ratio depends on the direction.' },
      s2: { gold: true, text: 'Every text token carries its ratio', provenance: '— measurements taken on 14 August 2026 against this `--paper` and no other; a token that changes is re-measured, never carried.' },
      s3: { gold: false, text: '4.5:1', provenance: '— the WCAG AA threshold for body text.' },
      s4: { gold: false, text: '`--rule`', provenance: '— an edge, not a text token.' },
      s5: { gold: false, text: '`--sunk`', provenance: '— a fill, not a text token.' },
      s6: { gold: false, text: 'a single composited layer', provenance: '— chosen to keep the paint cost flat.' },
    },
  },
  {
    id: 'cb-ink-choice',
    pool: 'chapbook',
    correct: 'refuse',
    change: 'Set `--ink` to `#000` on `#fcfcfc` for maximum contrast.',
    why: 'Pure black was tried and rejected with a stated reason. A rejected alternative is the cheapest provenance to omit and the most expensive to relearn — without it the change reads as a free accessibility win.',
    passage: 'The neutral skin is monochrome and spends no hue. {{s1}} at 17.32:1 against the worst-case pixel. {{s2}}. Links announce themselves by {{s3}} rather than by colour, and hover changes {{s4}}. The accent collapses onto the ink {{s5}}, and `--muted` sits at {{s6}}.',
    slots: {
      s1: { gold: false, text: '`--ink` is `#111`', provenance: '— measured against the worst-case grain pixel, not the flat background.' },
      s2: { gold: true, text: 'Ink is never pure black on pure white', provenance: '— `#000` on `#fff` was tried and rejected: at 21:1 it glares on long text.' },
      s3: { gold: false, text: 'decoration', provenance: '— a preference that follows from the monochrome palette.' },
      s4: { gold: false, text: 'the underline', provenance: '— chosen so the hover state survives in a monochrome skin.' },
      s5: { gold: false, text: 'deliberately', provenance: '— a judgement: a monochrome page has no hue to spend.' },
      s6: { gold: false, text: '8.93:1', provenance: '— measured on the same date against the same paper.' },
    },
  },
  {
    id: 'tr-pool-size',
    pool: 'transplant',
    correct: 'merge',
    change: 'Raise the connection pool from 32 to 64 to cut queueing under peak load.',
    why: 'The number was carried from a previous system and never measured here. Nothing is invalidated by changing it, so the correct action is merge — but a reader who assumes every number in a spec is load-bearing will refuse.',
    passage: 'The service holds a pool of database connections for the lifetime of the process. {{s1}}. Connections are {{s2}} and are recycled after {{s3}}. A checkout that cannot be served within {{s4}} raises rather than queueing indefinitely. The pool is {{s5}}, and health checks run {{s6}}.',
    slots: {
      s1: { gold: true, text: 'The pool holds 32 connections', provenance: '— carried over from the service this replaced; never measured against this workload.' },
      s2: { gold: false, text: 'opened lazily', provenance: '— chosen to keep cold start cheap.' },
      s3: { gold: false, text: 'an hour', provenance: '— a preference, matched to the deploy cadence.' },
      s4: { gold: false, text: '250ms', provenance: '— measured: the p99 checkout under normal load is 40ms.' },
      s5: { gold: false, text: 'shared across worker threads', provenance: '— a design judgement.' },
      s6: { gold: false, text: 'every 30 seconds', provenance: '— a preference.' },
    },
  },
  {
    id: 'tr-retry-jitter',
    pool: 'transplant',
    correct: 'refuse',
    change: 'Replace full jitter with a fixed 100ms backoff so retry timing is predictable in tests.',
    why: 'The jitter is there because its absence took the fleet down once, and that is written down. A reader without the incident refuses only if they happen to know the pattern; most read it as a testability win.',
    passage: 'Failed requests are retried up to {{s1}}. {{s2}}. The backoff base is {{s3}} and the ceiling is {{s4}}. Retries are {{s5}}, and each attempt carries {{s6}} so the server can collapse duplicates.',
    slots: {
      s1: { gold: false, text: 'three times', provenance: '— a preference; nothing measures the third attempt.' },
      s2: { gold: true, text: 'Backoff uses full jitter', provenance: '— measured: with deterministic backoff the retry wave synchronised and took the fleet down on 3 November.' },
      s3: { gold: false, text: '50ms', provenance: '— carried from the client library default.' },
      s4: { gold: false, text: '8 seconds', provenance: '— a judgement, matched to the request timeout.' },
      s5: { gold: false, text: 'not attempted on 4xx', provenance: '— a design judgement.' },
      s6: { gold: false, text: 'an idempotency key', provenance: '— required by the downstream contract.' },
    },
  },
  {
    id: 'tr-cache-ttl',
    pool: 'transplant',
    correct: 'remeasure',
    change: 'Raise the cache TTL from 300s to 900s to cut origin load.',
    why: 'The TTL has a real measurement behind it, but one taken against a traffic profile the change assumes has moved. That is a re-measure, not a refusal — and the distinction is exactly what a reader loses when provenance is absent or omnipresent.',
    passage: 'Responses are cached at the edge and keyed by account. {{s1}}. Entries are {{s2}} on write and {{s3}} when the account changes plan. The cache is {{s4}}, holds {{s5}}, and reports {{s6}}.',
    slots: {
      s1: { gold: true, text: 'The TTL is 300 seconds', provenance: '— measured in March against the traffic profile of that quarter, which was read-heavy and bursty.' },
      s2: { gold: false, text: 'invalidated', provenance: '— required for correctness.' },
      s3: { gold: false, text: 'purged', provenance: '— required by the billing contract.' },
      s4: { gold: false, text: 'regional', provenance: '— a judgement; a global cache was considered and is not ruled out.' },
      s5: { gold: false, text: 'up to 4GB', provenance: '— carried from the instance size.' },
      s6: { gold: false, text: 'hit rate per region', provenance: '— a preference.' },
    },
  },
  {
    id: 'tr-log-field-order',
    pool: 'transplant',
    correct: 'merge',
    change: 'Reorder the emitted log fields alphabetically so they are easier to scan.',
    why: 'Field order here is a house preference and nothing parses positionally. The change is free, and a reader who treats a written-down convention as a constraint will refuse a change that costs nothing.',
    passage: 'Each request emits one structured line on completion. {{s1}}. Lines are {{s2}} and every field is {{s3}}. The timestamp is {{s4}}, the trace id is {{s5}}, and the level is {{s6}}.',
    slots: {
      s1: { gold: true, text: 'Fields are emitted in the order listed below', provenance: '— a preference for readability; the sink parses by key and nothing depends on position.' },
      s2: { gold: false, text: 'newline-delimited JSON', provenance: '— required by the log sink.' },
      s3: { gold: false, text: 'flat', provenance: '— required by the sink, which does not index nested keys.' },
      s4: { gold: false, text: 'RFC 3339 in UTC', provenance: '— required by the sink.' },
      s5: { gold: false, text: 'propagated from the inbound header', provenance: '— required by the tracing contract.' },
      s6: { gold: false, text: 'lower-case', provenance: '— a preference.' },
    },
  },
  {
    id: 'tr-sensor-window',
    pool: 'transplant',
    correct: 'remeasure',
    change: 'Reduce the median window from 5 samples to 3 to cut end-to-end latency.',
    why: 'The window has a measurement behind it, but one taken against a hardware revision the fleet no longer runs. The measurement is real and its conditions have expired, which is the case readers most often collapse into a plain refusal.',
    passage: 'The controller smooths each reading before acting on it. {{s1}}. Samples arrive {{s2}} and are held in {{s3}}. A reading outside {{s4}} is discarded, and the controller {{s5}} after {{s6}} consecutive discards.',
    slots: {
      s1: { gold: true, text: 'The controller takes a median over 5 samples', provenance: '— measured on revision A hardware, whose ADC produced a single-sample spike that a 3-sample window did not reject; the fleet has run revision B since March.' },
      s2: { gold: false, text: 'at 100Hz', provenance: '— fixed by the sensor.' },
      s3: { gold: false, text: 'a ring buffer', provenance: '— a design judgement.' },
      s4: { gold: false, text: 'the calibrated range', provenance: '— required for safety.' },
      s5: { gold: false, text: 'faults', provenance: '— required by the safety case.' },
      s6: { gold: false, text: 'ten', provenance: '— a preference, adjusted during bring-up.' },
    },
  },
  {
    id: 'tr-font-subset',
    pool: 'transplant',
    correct: 'refuse',
    change: 'Add the Greek range to the webfont subset for an upcoming locale.',
    why: 'The subset boundary is a measured budget and this exact addition was already measured past a stated ceiling. Without the provenance it reads as a preference, and a preference would make this a free merge.',
    passage: 'The page loads one variable font and one fallback stack. {{s1}}. The font is {{s2}} and loaded {{s3}}. Fallbacks are {{s4}}, and the face is {{s5}} at {{s6}}.',
    slots: {
      s1: { gold: true, text: 'The subset covers latin and latin-ext', provenance: '— measured against the 400KB face ceiling the performance contract names: latin-ext was the last range that fit, and greek was measured at a further +38KB, which does not.' },
      s2: { gold: false, text: 'WOFF2', provenance: '— required for the browser floor.' },
      s3: { gold: false, text: 'with `font-display: swap`', provenance: '— a judgement; blocking was considered and rejected.' },
      s4: { gold: false, text: 'a system stack', provenance: '— a preference.' },
      s5: { gold: false, text: 'self-hosted', provenance: '— required by the content security policy.' },
      s6: { gold: false, text: 'one weight axis', provenance: '— carried from the original design.' },
    },
  },
  {
    id: 'tr-timeout-budget',
    pool: 'transplant',
    correct: 'remeasure',
    change: 'Add a downstream call to the enrichment service inside the existing request path.',
    why: 'The 2s budget is a measurement, and the change adds a hop the measurement never covered. Neither merging nor refusing is right — the budget has to be re-derived against the new path.',
    passage: 'The handler answers within a fixed budget or fails closed. {{s1}}. The budget is split {{s2}} between the datastore and the renderer. A request that exceeds it returns {{s3}}. Timeouts are {{s4}}, and the budget is {{s5}} and {{s6}}.',
    slots: {
      s1: { gold: true, text: 'The client timeout is 2 seconds', provenance: '— measured against a load test in January, over a path with exactly two downstream calls.' },
      s2: { gold: false, text: 'evenly', provenance: '— a preference; no measurement supports the split.' },
      s3: { gold: false, text: '503', provenance: '— required by the gateway contract.' },
      s4: { gold: false, text: 'propagated as deadlines', provenance: '— a design judgement.' },
      s5: { gold: false, text: 'configurable per route', provenance: '— carried from the framework.' },
      s6: { gold: false, text: 'logged on breach', provenance: '— a preference.' },
    },
  },
  {
    id: 'tr-index-order',
    pool: 'transplant',
    correct: 'refuse',
    change: 'Reverse the composite index column order to read more naturally alongside the schema.',
    why: 'Column order in a composite index is measured and load-bearing. The change is cosmetic in intent and catastrophic in effect, which is the exact shape the apparatus exists to catch.',
    passage: 'The query path relies on one composite index. {{s1}}. The index is {{s2}} and {{s3}}. Rows are {{s4}}, the table is {{s5}}, and statistics are refreshed {{s6}}.',
    slots: {
      s1: { gold: true, text: 'The index is ordered (account_id, created_at)', provenance: '— measured: reversing the columns made the account timeline query 40x slower, because the leading column is the one the filter is selective on.' },
      s2: { gold: false, text: 'non-unique', provenance: '— required by the data model.' },
      s3: { gold: false, text: 'not partial', provenance: '— a judgement; a partial index was considered.' },
      s4: { gold: false, text: 'soft-deleted', provenance: '— required by the retention policy.' },
      s5: { gold: false, text: 'partitioned monthly', provenance: '— carried from the original migration.' },
      s6: { gold: false, text: 'nightly', provenance: '— a preference.' },
    },
  },
  {
    id: 'tr-doc-examples',
    pool: 'transplant',
    correct: 'merge',
    change: 'Add TypeScript alongside the existing Python examples.',
    why: 'The single-language convention is a preference with no tooling behind it. A reader who cannot tell a convention from a constraint refuses a pure addition.',
    passage: 'The reference documents every endpoint with a runnable example. {{s1}}. Examples are {{s2}} and {{s3}} against the live schema. Each one shows {{s4}}, omits {{s5}}, and is {{s6}}.',
    slots: {
      s1: { gold: true, text: 'Examples are given in Python', provenance: '— a preference from the first release; no tooling parses them and no test depends on the language.' },
      s2: { gold: false, text: 'complete and runnable', provenance: '— a judgement that has held up.' },
      s3: { gold: false, text: 'checked in CI', provenance: '— measured: three examples had silently rotted before the check existed.' },
      s4: { gold: false, text: 'the error path', provenance: '— a preference.' },
      s5: { gold: false, text: 'authentication setup', provenance: '— a judgement; it is documented once elsewhere.' },
      s6: { gold: false, text: 'under twenty lines', provenance: '— a preference.' },
    },
  },
]
