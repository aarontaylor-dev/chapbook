#!/usr/bin/env node
/*
 * Chapbook — the conformance audit.
 *
 *   node audit.js [file...]        one line per section, then the rubric
 *   node audit.js --json [file]    the same evidence, machine-readable
 *
 * Defaults to public/index.html and public/colophon.html.
 *
 * WHAT THIS IS FOR
 *
 * The build enforces six of the nine rules against the stylesheet and exits
 * non-zero on any of them. Rules 04, 05 and 08 are about markup and meaning,
 * they are not visible in CSS, and the README has always said so — "they are
 * the skill's job. Six here, three there." The third part was never written.
 * This is it.
 *
 * It reports two different kinds of thing and never mixes them:
 *
 *   PROBLEMS are decidable. A section with no rail, two row anatomies in one
 *   list, a <button> that carries no bordered class, an inline style with a
 *   radius in it. These exit non-zero, like any other failing check.
 *
 *   EVIDENCE is not. Whether a row's label is honest, whether a control has
 *   earned its border, whether the mono is carrying structure or has just
 *   been reached for — those need a reader. The evidence is laid out in the
 *   same shape every time so that two readers, or two agents, are looking at
 *   the same thing and can be held to the same rubric.
 *
 * The rubric is in skill/chapbook/AUDIT.md. Point an agent at that file and
 * this output together, and it will rank the document section by section.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, isAbsolute, join, relative } from 'node:path';

import { scan } from './src/conformance.js';

const root = dirname(fileURLToPath(import.meta.url));

/* Repo-relative by default, because the two files it audits by default live
   here — but an absolute path is a path, not a suffix, and auditing a page
   from another project is half the point of a conformance tool. */
const p = (file) => (isAbsolute(file) ? file : join(root, file));

const DEFAULTS = ['public/index.html', 'public/colophon.html'];

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const files = args.filter((a) => !a.startsWith('--'));
const targets = files.length ? files : DEFAULTS;

const pad = (s, n) => String(s ?? '').padEnd(n);

async function main() {
  const reports = [];

  for (const file of targets) {
    let html;
    try {
      html = await readFile(p(file), 'utf8');
    } catch {
      console.error(`  cannot read ${file}`);
      process.exit(1);
    }
    reports.push({ file, ...scan(html) });
  }

  if (asJson) {
    console.log(JSON.stringify(reports, null, 2));
    const failed = reports.some((r) => r.global.length || r.sections.some((s) => s.problems.length));
    process.exit(failed ? 1 : 0);
  }

  let problems = 0;

  for (const report of reports) {
    console.log(`\n  ${relative('.', report.file)}  —  ${report.sections.length} sections\n`);
    console.log(
      `  ${pad('##', 4)}${pad('SECTION', 22)}${pad('RAIL', 6)}${pad('ROWS', 6)}` +
        `${pad('SHAPES', 8)}${pad('CTRL', 6)}${pad('WORDS', 7)}MONO`
    );

    for (const s of report.sections) {
      const shapes = s.rowShapes.length;
      console.log(
        `  ${pad(s.number ?? '--', 4)}${pad(s.heading.slice(0, 20), 22)}` +
          `${pad(s.rail ? (s.railNumber ? 'n+h2' : 'h2') : 'NONE', 6)}` +
          `${pad(s.rows, 6)}${pad(shapes || '—', 8)}` +
          `${pad(s.controls ? `${s.borderedControls}/${s.controls}` : '—', 6)}` +
          `${pad(s.words, 7)}${s.monoBearing.length}`
      );
      problems += s.problems.length;
    }

    const all = [...report.global, ...report.sections.flatMap((s) => s.problems)];
    problems += report.global.length;

    if (all.length) {
      console.log(`\n  DECIDABLE PROBLEMS — these are failures, not opinions:\n`);
      for (const problem of all) console.log(`    - ${problem}`);
    } else {
      console.log(`\n  No decidable problem in this document.`);
    }
  }

  console.log(`
  ─────────────────────────────────────────────────────────────────────────

  WHAT IS LEFT IS JUDGEMENT.

  Rules 04, 05 and 08 are about meaning, and the table above is evidence
  rather than a verdict. Nothing here knows whether a row's label is honest,
  whether a control earned its border, or whether the mono is carrying
  structure or was simply reached for.

  One blind spot, named rather than left for you to find: the row count above
  counts .row only. A page that invents a second row-like component — a pair
  list, a definition stack, anything repeated with a hairline between — will
  still report one anatomy. Rule 05 says one anatomy EVERYWHERE, so look at
  the repeated structures this table does not name.

  To rank the document section by section, give an agent this output and
  skill/chapbook/AUDIT.md, which carries the rubric and the scale.

      node audit.js --json | your-agent-here
`);

  process.exit(problems ? 1 : 0);
}

main();
