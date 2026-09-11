/*
 * Aggregation, and the two checks the pilot exists to run.
 *
 * The pilot is not trying to show that the apparatus works — twelve items
 * cannot carry that. It is testing whether the INSTRUMENT can tell the arms
 * apart at all. Two questions, in order:
 *
 *   Does D fail? Annotate-everything must not beat the unannotated baseline.
 *   If it does, the rubric is rewarding density and every other number in the
 *   run is uninterpretable. That is a stop condition, not a finding.
 *
 *   Does B beat E? Same mark count, different placement. If B and E are level,
 *   placement is not the mechanism and the headline claim has no support.
 *
 * Everything is reported split by pool. The chapbook items are contaminated by
 * construction and may not carry a conclusion.
 */
import fs from 'node:fs'
import path from 'node:path'
import { items } from './items.js'
import { ARMS, wilson, mcnemar, placement, density, slotsForArm, yieldPerMark, trivialBaselines } from './lib/apparatus.js'

const dir = process.argv[2] ?? latestRun()
const rows = readJsonl(path.join(dir, 'results.jsonl'))
const errs = readJsonl(path.join(dir, 'errors.jsonl'))
console.log(`run: ${path.basename(dir)}   scored ${rows.length}   errored ${errs.length}\n`)

if (errs.length) {
  const byClass = {}
  for (const e of errs) byClass[e.class] = (byClass[e.class] ?? 0) + 1
  console.log('errors by class (never counted as wrong answers):', JSON.stringify(byClass), '\n')
}

const base = trivialBaselines(items)
console.log('trivial baselines — an arm at or below its pool\'s floor has told us nothing:')
for (const pool of ['transplant', 'chapbook', 'ALL']) {
  const sub = items.filter((i) => pool === 'ALL' || i.pool === pool)
  const b = trivialBaselines(sub)
  console.log(`   ${pool.padEnd(11)} always-"${b.majorityClass}" = ${(b.majorityRate * 100).toFixed(1)}%   ${JSON.stringify(b.counts)}`)
}
console.log()

for (const pool of ['transplant', 'chapbook', 'ALL']) {
  const sel = rows.filter((r) => pool === 'ALL' || r.pool === pool)
  if (!sel.length) continue
  const flag = pool === 'chapbook' ? '  (contaminated — calibration only)' : pool === 'transplant' ? '  (the pass bar rides on these)' : ''
  console.log(`── ${pool}${flag}`)
  console.log(`   ${'arm'.padEnd(4)} ${'n'.padEnd(5)} ${'acc'.padEnd(7)} ${'95% CI'.padEnd(16)} ${'F0.5'.padEnd(6)} ${'marks'.padEnd(7)} yield/mark`)
  const acc = {}
  for (const arm of ARMS) {
    const a = sel.filter((r) => r.arm === arm)
    if (!a.length) continue
    const k = a.filter((r) => r.decision === r.correct).length
    const ci = wilson(k, a.length)
    acc[arm] = k / a.length
    const pool_items = items.filter((i) => pool === 'ALL' || i.pool === pool)
    const f = mean(pool_items.map((i) => placement(i, slotsForArm(i, arm)).f))
    const m = mean(pool_items.map((i) => density(i, arm).marks))
    const y = arm === 'A' ? null : yieldPerMark(acc[arm], acc.A ?? 0, m)
    console.log(`   ${arm.padEnd(4)} ${String(a.length).padEnd(5)} ${(acc[arm] * 100).toFixed(1).padStart(5)}%  [${(ci.lo * 100).toFixed(1)}, ${(ci.hi * 100).toFixed(1)}]`.padEnd(45) + `${f.toFixed(3).padEnd(6)} ${m.toFixed(2).padEnd(7)} ${y === null ? '—' : y.toFixed(4)}`)
  }
  console.log()
}

// The paired tests. Arms see identical items, so pair on (case_id, reader, rep).
console.log('── paired comparisons (transplant + chapbook pooled for the pilot; n is too small to split)')
for (const [x, y] of [['B', 'A'], ['B', 'E'], ['D', 'A'], ['B', 'D']]) {
  const { xWins, yWins, p } = paired(rows, x, y)
  console.log(`   ${x} vs ${y}:  ${x} right/${y} wrong = ${xWins}, ${y} right/${x} wrong = ${yWins}, McNemar one-sided p = ${p.toFixed(4)}`)
}

console.log('\n── instrument checks')
const accOf = (arm) => { const a = rows.filter((r) => r.arm === arm); return a.length ? a.filter((r) => r.decision === r.correct).length / a.length : null }
const check = (name, pass, detail) => console.log(`   ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
const [aA, aB, aD, aE] = ['A', 'B', 'D', 'E'].map(accOf)
check('D does not beat A (rubric is not rewarding density)', aD <= aA + 0.05, `D=${pct(aD)} A=${pct(aA)}`)
check('B beats E (placement, not attention)', aB > aE, `B=${pct(aB)} E=${pct(aE)}`)
check('B beats A at all', aB > aA, `B=${pct(aB)} A=${pct(aA)}`)
const tBase = trivialBaselines(items.filter((i) => i.pool === 'transplant'))
const tRows = rows.filter((r) => r.pool === 'transplant' && r.arm === 'B')
const tAcc = tRows.length ? tRows.filter((r) => r.decision === r.correct).length / tRows.length : null
check('B clears the transplant pool floor', tAcc > tBase.majorityRate, `B(transplant)=${pct(tAcc)} floor=${pct(tBase.majorityRate)} (always-"${tBase.majorityClass}")`)

function paired (rows, x, y) {
  const key = (r) => `${r.case_id}|${r.reader}|${r.rep}`
  const X = new Map(rows.filter((r) => r.arm === x).map((r) => [key(r), r]))
  const Y = new Map(rows.filter((r) => r.arm === y).map((r) => [key(r), r]))
  let xWins = 0, yWins = 0
  for (const [k, rx] of X) {
    const ry = Y.get(k); if (!ry) continue
    const cx = rx.decision === rx.correct, cy = ry.decision === ry.correct
    if (cx && !cy) xWins++; else if (cy && !cx) yWins++
  }
  return { xWins, yWins, p: mcnemar(xWins, yWins).p }
}

function latestRun () {
  const runs = path.join(import.meta.dirname, 'runs')
  const all = fs.readdirSync(runs).sort()
  if (!all.length) throw new Error('no runs yet')
  return path.join(runs, all[all.length - 1])
}
function readJsonl (p) {
  if (!fs.existsSync(p)) return []
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
}
function mean (a) { return a.reduce((x, y) => x + y, 0) / a.length }
function pct (x) { return x === null ? 'n/a' : (x * 100).toFixed(1) + '%' }
