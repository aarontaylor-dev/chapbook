#!/usr/bin/env node
/*
 * Chapbook — build.
 *
 * Three jobs, in order of how much they matter:
 *
 *   1. MEASURE. Every colour token in every skin is read out of the shipped
 *      stylesheet and measured against the worst-case grain pixel. A text
 *      token below WCAG AA exits non-zero. That is Rule 07 turned from a
 *      comment into a test — a failing token cannot reach the site, and the
 *      table on the page cannot drift from the CSS it describes.
 *
 *   2. CHECK. Six of the nine rules are enforced here rather than described:
 *
 *        01  every font-family is one of the three face tokens
 *        02  no border-radius and no box-shadow anywhere
 *        03  border widths are 1px or 2px, and 2px only ever with --ink
 *        06  the two dark declarations of the palette agree
 *        07  every text token clears AA against the grain surface
 *        09  the print palette beats every other palette on the way to paper
 *
 *      06 and 07 shipped in v1.0.0. The other four arrived in v1.0.1, after
 *      Rule 09 turned out to have been false for the whole life of v1.0.0 on
 *      the system's own website — the print block is `:root` at (0,1,0) and
 *      lost to every skin at (0,2,0), so anyone who picked a skin printed in
 *      screen colours. Nothing caught it because nothing was looking.
 *
 *      Rules 04, 05 and 08 are about markup and meaning and are not visible in
 *      a stylesheet. They are the skill's job. Six here, three there.
 *
 *   3. RENDER. The specimen page, the 404, the frozen version directories,
 *      and _headers with the two inline script hashes.
 *
 * No dependencies. Node's standard library and nothing else.
 *
 *   node build.js
 *
 * Generated files are committed, so a Pages deploy or a local static server
 * works whether or not the build has been run, and a template change shows up
 * as a reviewable diff rather than as a mystery at deploy time.
 */

import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { site, skins } from './src/content.js';
import { indexPage, notFoundPage } from './src/page.js';
import { audit, block, darkBlocksAgree, COLOUR_TOKENS, AA } from './src/measure.js';
import { checkRules } from './src/rules.js';

const root = dirname(fileURLToPath(import.meta.url));
const p = (...parts) => join(root, ...parts);

/* The distributable. These three files are the product; everything else in
   the repo exists to document, measure or serve them. */
const SHIPPED = ['chapbook.css', 'chapbook-skins.css', 'chapbook-theme.js'];

/* What each token is for. Kept here rather than in content.js because it is a
   property of the contract, and the contract lives with the measuring code. */
const ROLES = {
  paper: 'Page ground',
  sunk: 'Row hover, code field',
  rule: 'Hairlines',
  ink: 'Body, titles, 2px rules',
  muted: 'Ledes, descriptions',
  faint: 'Mono labels, meta',
  accent: 'Links, rail numbers',
  'accent-deep': 'Link hover',
};

/* Which selector holds each skin. Neutral is the absence of a skin — it is
   the default palette in chapbook.css itself. */
const selectorFor = (id) => (id === 'neutral' ? ':root' : `:root[data-skin="${id}"]`);

/* ------------------------------------------------------------- measuring -- */

function readPalettes(baseCss, skinCss) {
  const problems = [];
  const palettes = [];

  for (const skin of skins) {
    const css = skin.id === 'neutral' ? baseCss : skinCss;
    const sel = selectorFor(skin.id);

    const light = block(css, sel);
    if (!light) {
      problems.push(`${skin.id}: no light block at ${sel}`);
      continue;
    }

    /* A skin only overrides what it names; anything it leaves out falls
       through to the base palette, exactly as the cascade would do it. */
    const baseLight = skin.id === 'neutral' ? light : { ...block(baseCss, ':root'), ...light };
    const darkOverride = block(css, `${sel}[data-theme="dark"]`);
    if (!darkOverride) {
      problems.push(`${skin.id}: no dark block at ${sel}[data-theme="dark"]`);
      continue;
    }
    const dark = { ...baseLight, ...darkOverride };

    /* Job 2 — the two dark declarations must agree. */
    const agree = darkBlocksAgree(css, sel);
    if (!agree.ok) {
      problems.push(
        `${skin.id}: Rule 06 violated — the dark media query and the dark attribute disagree:\n` +
          (agree.drift || [agree.reason]).map((d) => `             ${d}`).join('\n')
      );
    }

    const lightAudit = audit(baseLight, 'light');
    const darkAudit = audit(dark, 'dark');

    /* Job 1 — a text token below AA is a build failure, not a warning. */
    for (const [mode, a] of [['light', lightAudit], ['dark', darkAudit]]) {
      for (const r of a.rows.filter((r) => !r.pass)) {
        problems.push(
          `${skin.id} ${mode}: ${r.token} is ${r.grain.toFixed(2)}:1 against ${a.surface}, ` +
            `below AA ${AA}:1`
        );
      }
    }

    palettes.push({
      id: skin.id,
      label: skin.label,
      light: lightAudit,
      dark: darkAudit,
      tokens: COLOUR_TOKENS.map((token) => {
        const lr = lightAudit.rows.find((r) => r.token === `--${token}`);
        const dr = darkAudit.rows.find((r) => r.token === `--${token}`);
        return {
          token,
          light: baseLight[token],
          dark: dark[token],
          /* --paper is the ground, and --rule and --sunk are edges and fills.
             None of them carries text, so none of them has a ratio to report
             and printing one would invite someone to treat it as a floor. */
          lightRatio: lr ? lr.grain.toFixed(2) : '—',
          darkRatio: dr ? dr.grain.toFixed(2) : '—',
          role: ROLES[token] ?? '',
        };
      }),
    });
  }

  return { palettes, problems };
}

/* ----------------------------------------------------------------- build -- */

async function main() {
  const [baseCss, skinCss, themeScript, demoScript, headerTpl] = await Promise.all([
    readFile(p('chapbook.css'), 'utf8'),
    readFile(p('chapbook-skins.css'), 'utf8'),
    readFile(p('chapbook-theme.js'), 'utf8'),
    readFile(p('src', 'demo.js'), 'utf8'),
    readFile(p('src', 'headers.txt'), 'utf8'),
  ]);

  /* Inlined into <head>, so the distributable's own documentation header is
     stripped first — it is thirty lines of prose explaining how to inline the
     file, which is of no use to anyone who has already inlined it. Read from
     the shipped file rather than a copy, so the two cannot drift. */
  const themeInline = themeScript.replace(/^\/\*[\s\S]*?\*\/\s*/, '');

  const { palettes, problems } = readPalettes(baseCss, skinCss);

  /* Job 2, the static half. Rules 01, 02, 03 and 09 read the shipped CSS the
     same way the audit reads the palette, and fail the build the same way. */
  const ruleProblems = checkRules(
    [
      { name: 'chapbook.css', css: baseCss },
      { name: 'chapbook-skins.css', css: skinCss },
    ],
    COLOUR_TOKENS.concat('grain')
  );
  problems.push(...ruleProblems);

  console.log(`  system   v${site.version}`);
  /* Printed rather than asserted. The header tells a reader the file is about
     900 lines and asks them to read all of them, so the number is a promise
     and it should be visible on every build rather than checked once. */
  console.log(
    `  size     chapbook.css ${baseCss.split('\n').length} lines  ` +
      `skins ${skinCss.split('\n').length}  theme ${themeScript.split('\n').length}`
  );
  for (const pal of palettes) {
    for (const a of [pal.light, pal.dark]) {
      const worst = Math.min(...a.rows.map((r) => r.grain));
      console.log(
        `  measure  ${pal.id.padEnd(8)}${a.mode.padEnd(6)}surface ${a.surface}  ` +
          `tightest ${worst.toFixed(2)}:1  sunk ${a.sunk.toFixed(2)}:1  ` +
          `${a.pass ? 'AA' : 'FAIL'}`
      );
    }
  }

  console.log(
    `  rules    01 02 03 09 static  06 07 measured  ` +
      `${ruleProblems.length ? `${ruleProblems.length} FAIL` : 'pass'}  ` +
      `(04 05 08 are markup — see skill/chapbook)`
  );

  if (problems.length) {
    console.error('\n  The build refuses to publish this:\n');
    for (const problem of problems) console.error(`    - ${problem}`);
    console.error('');
    process.exit(1);
  }

  /* The CSP admits each inline script by hash, taken over the exact bytes
     between the script tags — so an edit to either script must reach _headers
     too, which is why _headers is generated rather than hand-maintained. */
  const sha = (s) => `sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}`;

  /* Two version paths, and they are not the same promise. The exact one never
     changes and is cached forever; the major one moves with each additive
     release inside v1 and is cached for a day. Saying "immutable" about a
     path that moves is the sort of small lie that costs somebody an afternoon.

     This runs BEFORE _headers is rendered, because the header template asks
     the filesystem which frozen directories exist and the newest one has to be
     on disk by the time it looks. */
  const major = `v${site.version.split('.')[0]}`;
  const exact = `v${site.version}`;
  for (const dir of [major, exact]) {
    await mkdir(p('public', dir), { recursive: true });
    for (const file of SHIPPED) await copyFile(p(file), p('public', dir, file));
  }
  for (const file of SHIPPED) await copyFile(p(file), p('public', file));
  console.log(`  freeze   public/${major}/ and public/${exact}/  ${SHIPPED.length} files each`);

  /*
   * One immutable block per frozen directory, discovered rather than listed.
   * Every exact version ever published stays on the site forever and stays
   * cached for a year, so the template cannot name only the current one — and
   * a hand-maintained list is a line somebody forgets on the release where it
   * matters. The directories on disk are the source of truth.
   */
  const frozen = (await readdir(p('public'), { withFileTypes: true }))
    .filter((e) => e.isDirectory() && /^v\d+\.\d+\.\d+$/.test(e.name))
    .map((e) => e.name)
    .sort();
  const exactBlocks = frozen
    .map(
      (dir) =>
        `/${dir}/*\n  Access-Control-Allow-Origin: *\n` +
        `  Cache-Control: public, max-age=31536000, immutable`
    )
    .join('\n');
  console.log(`  frozen   ${frozen.join('  ')}  immutable for a year`);

  const headers = headerTpl
    .replace('{{THEME_HASH}}', sha(themeInline))
    .replace('{{DEMO_HASH}}', sha(demoScript))
    .replace('{{EXACT_BLOCKS}}', exactBlocks);

  const written = [
    ['public/index.html', indexPage({ palettes, themeScript: themeInline, demoScript })],
    ['public/404.html', notFoundPage({ themeScript: themeInline })],
    ['public/_headers', headers],
  ];

  for (const [file, contents] of written) {
    await writeFile(p(file), contents);
    console.log(`  write    ${file}  ${contents.length.toLocaleString()} bytes`);
  }
  console.log(`  csp      theme ${sha(themeInline)}`);
  console.log(`  csp      demo  ${sha(demoScript)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
