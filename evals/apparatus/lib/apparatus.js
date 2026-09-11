/*
 * The pilot's mechanical half: build the four arms from an item, and score
 * what comes back. Nothing here calls a model, so all of it runs offline.
 *
 * Arms are GENERATED from an item's slots rather than written out four times.
 * That is what keeps arm E honest: "random placement at matched density" has
 * to carry exactly as many provenance sentences as B, or the comparison is
 * measuring volume instead of placement, and E is the only thing standing
 * between "the apparatus works" and "marks anywhere make readers slow down".
 *
 * A slot is a phrase in the passage that COULD carry provenance. It is gold
 * when a reader could act differently depending on the answer — which is the
 * whole rule the eval exists to test, so it is recorded per slot and never
 * inferred from how a passage reads.
 */

/** Arms. A is the floor, F the ceiling; D and E are controls, not competitors. */
export const ARMS = ['A', 'B', 'D', 'E', 'F']

const ARM_NOTE = {
  A: 'no provenance anywhere',
  B: 'provenance on the gold slots only — the shipped style',
  D: 'provenance on every slot — the over-annotation control',
  E: 'provenance on non-gold slots, count matched to B',
  F: 'same as B; kept distinct so the ceiling can diverge later',
}

/**
 * Which slots carry provenance in a given arm.
 *
 * E draws from the non-gold slots with a seeded shuffle, so a rerun places the
 * decoys identically. An unseeded pick would make E's score move between runs
 * for reasons that have nothing to do with the model.
 */
export function slotsForArm (item, arm, seed = 0) {
  const ids = Object.keys(item.slots)
  const gold = ids.filter((id) => item.slots[id].gold)
  const rest = ids.filter((id) => !item.slots[id].gold)

  switch (arm) {
    case 'A': return []
    case 'B': case 'F': return gold
    case 'D': return ids
    case 'E': return shuffle(rest, seed + hash(item.id)).slice(0, gold.length)
    default: throw new Error(`unknown arm: ${arm}`)
  }
}

/**
 * Render one arm of one item. Slot markers are `{{id}}`; a slot always renders
 * its phrase, and renders its provenance sentence after it only when the arm
 * selected it.
 */
export function render (item, arm, seed = 0) {
  const chosen = new Set(slotsForArm(item, arm, seed))
  const text = item.passage.replace(/\{\{(\w+)\}\}/g, (_, id) => {
    const slot = item.slots[id]
    if (!slot) throw new Error(`${item.id}: passage references missing slot ${id}`)
    return chosen.has(id) ? `${slot.text} ${slot.provenance}` : slot.text
  })
  return { text, marks: chosen.size, note: ARM_NOTE[arm] }
}

/** Provenance sentences per 100 words — the density figure the rubric caps. */
export function density (item, arm, seed = 0) {
  const { text, marks } = render(item, arm, seed)
  const words = text.trim().split(/\s+/).length
  return { marks, words, per100: (marks / words) * 100 }
}

/**
 * Placement, scored against the gold slots. Fβ with β=0.5 weights precision
 * over recall, because the failure this eval is built to catch is annotating
 * too much rather than too little.
 */
export function placement (item, marked) {
  const gold = new Set(Object.keys(item.slots).filter((id) => item.slots[id].gold))
  const hit = marked.filter((id) => gold.has(id)).length
  const precision = marked.length ? hit / marked.length : (gold.size ? 0 : 1)
  const recall = gold.size ? hit / gold.size : 1
  return { precision, recall, f: fbeta(precision, recall, 0.5) }
}

export function fbeta (p, r, beta) {
  const b2 = beta * beta
  return (p + r) === 0 ? 0 : ((1 + b2) * p * r) / (b2 * p + r)
}

/**
 * Decision accuracy gain per mark spent. The metric that actually kills
 * shotgunning: +3 correct decisions on 5 marks beats +3 on 40.
 */
export function yieldPerMark (armAccuracy, baseAccuracy, meanMarks) {
  if (!meanMarks) return null
  return (armAccuracy - baseAccuracy) / meanMarks
}

/**
 * Baselines a reader could hit without reading. Reported beside every arm —
 * an eval whose majority class beats the model is measuring class balance.
 */
export function trivialBaselines (items) {
  const counts = {}
  for (const item of items) counts[item.correct] = (counts[item.correct] ?? 0) + 1
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return { counts, majorityClass: best[0], majorityRate: best[1] / items.length }
}

/** Wilson score interval — a point estimate with no error bar is not a result. */
export function wilson (k, n, z = 1.96) {
  if (!n) return { lo: 0, hi: 1 }
  const p = k / n
  const d = 1 + (z * z) / n
  const centre = (p + (z * z) / (2 * n)) / d
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d
  return { lo: Math.max(0, centre - half), hi: Math.min(1, centre + half) }
}

/**
 * McNemar exact, one-sided. The arms see identical items, so the paired test
 * is the right one — an unpaired test throws away the pairing and needs far
 * more items to say the same thing.
 */
export function mcnemar (bWins, aWins) {
  const n = bWins + aWins
  if (!n) return { n, p: 1 }
  let p = 0
  for (let i = bWins; i <= n; i++) p += choose(n, i)
  return { n, p: p / Math.pow(2, n) }
}

function choose (n, k) {
  let r = 1
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1)
  return r
}

function hash (s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

/** Mulberry32 — small, seeded, and good enough to place decoys repeatably. */
function shuffle (arr, seed) {
  const out = arr.slice()
  let s = seed >>> 0
  for (let i = out.length - 1; i > 0; i--) {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296
    const j = Math.floor(r * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
