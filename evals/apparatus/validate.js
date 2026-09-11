/*
 * Structural audit over the whole case set. Cheap, exhaustive, and run before
 * anything is spent on a model — a broken case set produces confident numbers
 * pointing the wrong way, and none of these checks need an API key.
 *
 * The invariant that matters most is B and E carrying the same mark count. If
 * that slips, E stops being a placement control and becomes a density control,
 * and the pilot can no longer tell "the marks are in the right place" from
 * "there are marks".
 */
import { items } from './items.js'
import { render, slotsForArm, density, placement, trivialBaselines, ARMS } from './lib/apparatus.js'

let failed = 0
const fail = (id, msg) => { console.log(`  FAIL  ${id}: ${msg}`); failed++ }

const seen = new Set()
for (const item of items) {
  if (seen.has(item.id)) fail(item.id, 'duplicate id')
  seen.add(item.id)

  const declared = Object.keys(item.slots)
  const used = [...item.passage.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
  for (const id of used) if (!declared.includes(id)) fail(item.id, `passage uses undeclared slot ${id}`)
  for (const id of declared) if (!used.includes(id)) fail(item.id, `slot ${id} declared but never placed`)
  if (new Set(used).size !== used.length) fail(item.id, 'a slot is placed twice')

  const gold = declared.filter((d) => item.slots[d].gold)
  const rest = declared.filter((d) => !item.slots[d].gold)
  if (!gold.length) fail(item.id, 'no gold slot — the item cannot discriminate')
  if (rest.length < gold.length) fail(item.id, `only ${rest.length} non-gold slots for ${gold.length} gold: arm E cannot match B`)
  if (!['merge', 'refuse', 'remeasure'].includes(item.correct)) fail(item.id, `bad action ${item.correct}`)
  if (!item.why || item.why.length < 40) fail(item.id, 'missing or thin rationale')

  const marks = {}
  for (const arm of ARMS) {
    const r = render(item, arm)
    if (/\{\{|\}\}/.test(r.text)) fail(item.id, `arm ${arm} left an unrendered marker`)
    marks[arm] = r.marks
  }
  if (marks.B !== marks.E) fail(item.id, `arm E density mismatch: B=${marks.B} E=${marks.E}`)
  if (marks.A !== 0) fail(item.id, 'arm A carries marks')
  if (marks.D !== declared.length) fail(item.id, 'arm D does not mark every slot')

  // E must not accidentally land on a gold slot, or it stops being a decoy.
  const eSlots = slotsForArm(item, 'E')
  for (const s of eSlots) if (item.slots[s].gold) fail(item.id, `arm E placed on gold slot ${s}`)
}

console.log(`\nstructure: ${failed ? failed + ' failures' : 'all checks passed'} over ${items.length} items\n`)

const base = trivialBaselines(items)
console.log(`trivial baselines  majority="${base.majorityClass}" rate=${(base.majorityRate * 100).toFixed(1)}%  ${JSON.stringify(base.counts)}`)

console.log('\nplacement scores by arm (against gold), and density:')
console.log(`  ${'arm'.padEnd(4)} ${'prec'.padEnd(6)} ${'rec'.padEnd(6)} ${'F0.5'.padEnd(6)} marks/item  per-100-words`)
for (const arm of ARMS) {
  let p = 0, r = 0, f = 0, m = 0, d = 0
  for (const item of items) {
    const sc = placement(item, slotsForArm(item, arm))
    const dn = density(item, arm)
    p += sc.precision; r += sc.recall; f += sc.f; m += dn.marks; d += dn.per100
  }
  const n = items.length
  console.log(`  ${arm.padEnd(4)} ${(p / n).toFixed(3).padEnd(6)} ${(r / n).toFixed(3).padEnd(6)} ${(f / n).toFixed(3).padEnd(6)} ${(m / n).toFixed(2).padEnd(11)} ${(d / n).toFixed(2)}`)
}
process.exit(failed ? 1 : 0)
