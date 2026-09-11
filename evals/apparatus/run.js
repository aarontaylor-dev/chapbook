/*
 * The reader-decision pass. Each (item, arm, reader, rep) is one call: the
 * reader sees a passage and a proposed change, and answers merge / refuse /
 * re-measure with a reason.
 *
 * Two rules from the eval health checklist are wired in rather than bolted on:
 *
 *   An attempt that never produced a scorable answer — a timeout, a refusal,
 *   a truncation, an unparseable reply — goes to errors.jsonl with a class,
 *   never to results.jsonl as a zero. Scoring plumbing as a model failure is
 *   how an eval ends up confidently measuring its own runner.
 *
 *   "No answer" is not "negative answer". A reader that fails to reply is not
 *   a reader that said refuse, and the two must never land on the same label.
 *
 * Readers never see the arm. The arm decides what the passage says; letting
 * the reader know which condition it is in would score the label, not the text.
 */
import fs from 'node:fs'
import path from 'node:path'
import { items } from './items.js'
import { render, ARMS } from './lib/apparatus.js'

const READERS = ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5']
const REPS = Number(process.env.REPS ?? 1)
const DRY = process.argv.includes('--dry-run')
const OUT = path.join(import.meta.dirname, 'runs', new Date().toISOString().replace(/[:.]/g, '-'))

const SYSTEM = `You are reviewing a proposed change to a written specification.

Answer with exactly one of these decisions on the first line, and nothing else on that line:

MERGE — the change is safe to take as proposed.
REFUSE — the change should not be made.
REMEASURE — the change may be fine, but something the spec asserts has to be re-established first.

On the second line, give one sentence of reason.

Decide from the specification as written. Do not assume facts it does not state.`

const prompt = (passage, change) =>
  `SPECIFICATION\n\n${passage}\n\nPROPOSED CHANGE\n\n${change}`

/** Strict first-token parse. Anything ambiguous is an error, not a guess. */
function parseDecision (text) {
  const first = (text ?? '').trim().split('\n')[0].toUpperCase()
  const hits = ['MERGE', 'REFUSE', 'REMEASURE'].filter((d) => first.includes(d))
  // REMEASURE contains no other label as a substring, so a single hit is clean.
  if (hits.length !== 1) return null
  return { merge: 'merge', refuse: 'refuse', remeasure: 'remeasure' }[hits[0].toLowerCase()]
}

async function main () {
  fs.mkdirSync(OUT, { recursive: true })
  const results = fs.createWriteStream(path.join(OUT, 'results.jsonl'))
  const errors = fs.createWriteStream(path.join(OUT, 'errors.jsonl'))

  let client = null
  if (!DRY) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    client = new Anthropic()

    /* Preflight. Credentials resolve lazily on the first call, so without this
     * a missing key produces one identical error per job instead of one clear
     * message. It doubles as the smoke case the checklist asks for: read the
     * model back from the response before trusting any row that claims it. */
    for (const reader of READERS) {
      try {
        const probe = await client.messages.create({
          model: reader, max_tokens: 16,
          messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
        })
        if (!probe.model.startsWith(reader.replace(/-\d{8}$/, ''))) {
          console.error(`preflight: asked for ${reader}, served ${probe.model} — refusing to run.`)
          process.exit(1)
        }
        console.log(`  preflight ok: ${reader} -> ${probe.model}`)
      } catch (err) {
        const m = String(err?.message ?? err)
        if (/authentication|apiKey|authToken/i.test(m)) {
          console.error('\nNo credentials. Export ANTHROPIC_API_KEY, or run `ant auth login`.')
          console.error('`npm run dry` exercises the whole pipeline with no API and no cost.\n')
        } else {
          console.error(`preflight failed on ${reader}: ${m}`)
        }
        process.exit(1)
      }
    }
  }

  const jobs = []
  for (const item of items) {
    for (const arm of ARMS) {
      for (const reader of READERS) {
        for (let rep = 0; rep < REPS; rep++) jobs.push({ item, arm, reader, rep })
      }
    }
  }
  console.log(`${jobs.length} calls — ${items.length} items x ${ARMS.length} arms x ${READERS.length} readers x ${REPS} rep(s)${DRY ? '  [DRY RUN, no API]' : ''}`)

  let ok = 0, bad = 0
  for (const [i, job] of jobs.entries()) {
    const { item, arm, reader, rep } = job
    const { text: passage, marks } = render(item, arm, rep)
    const row = {
      case_id: item.id, pool: item.pool, arm, reader, rep,
      correct: item.correct, marks, ts: new Date().toISOString(),
    }

    if (DRY) {
      // A dry run exercises the whole pipeline without spending anything. The
      // stand-in reader is deliberately dumb — always "refuse" — so the report
      // should show it landing exactly on the majority-class baseline. If it
      // does not, the scorer is wrong before a single real call is made.
      write(results, { ...row, decision: 'refuse', reason: 'dry run', stop_reason: 'end_turn', served: reader })
      ok++
      continue
    }

    try {
      const res = await client.messages.create({
        model: reader,
        max_tokens: 8000,
        system: SYSTEM,
        messages: [{ role: 'user', content: prompt(passage, item.change) }],
      })

      // The model that served the request must be the one we asked for; a
      // silent reroute would score a different model under this row's label.
      if (!res.model.startsWith(reader.replace(/-\d{8}$/, ''))) {
        write(errors, { ...row, class: 'served_model_mismatch', asked: reader, served: res.model }); bad++; continue
      }
      if (res.stop_reason === 'refusal') {
        write(errors, { ...row, class: 'reader_refusal', stop_details: res.stop_details ?? null }); bad++; continue
      }
      if (res.stop_reason === 'max_tokens') {
        write(errors, { ...row, class: 'truncated' }); bad++; continue
      }

      const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
      const decision = parseDecision(text)
      if (!decision) { write(errors, { ...row, class: 'unparseable', text }); bad++; continue }

      write(results, {
        ...row, decision,
        reason: text.trim().split('\n').slice(1).join(' ').trim(),
        stop_reason: res.stop_reason, served: res.model,
        usage: res.usage, transcript: { system: SYSTEM, passage, change: item.change, reply: text },
      })
      ok++
    } catch (err) {
      write(errors, { ...row, class: 'api_error', message: String(err?.message ?? err) }); bad++
    }
    if ((i + 1) % 10 === 0) process.stdout.write(`  ${i + 1}/${jobs.length}\r`)
  }

  results.end(); errors.end()
  console.log(`\nscored ${ok}, errored ${bad}  ->  ${OUT}`)
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ readers: READERS, reps: REPS, arms: ARMS, dry: DRY, items: items.length }, null, 2))
}

const write = (s, o) => s.write(JSON.stringify(o) + '\n')
main().catch((e) => { console.error(e); process.exit(1) })
