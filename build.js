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
 *      a stylesheet. audit.js reads the markup for the decidable half of them
 *      and lays out the evidence for the half only a reader can judge.
 *      Six here, three there — and the three now have somewhere to run.
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

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { site, skins } from './src/content.js';
import { indexPage, notFoundPage, colophonPage } from './src/page.js';
import { audit, block, darkBlocksAgree, COLOUR_TOKENS, AA } from './src/measure.js';
import { checkRules } from './src/rules.js';

const root = dirname(fileURLToPath(import.meta.url));
const p = (...parts) => join(root, ...parts);

/* The distributable. These three files are the product; everything else in
   the repo exists to document, measure or serve them. */
const SHIPPED = ['chapbook.css', 'chapbook-skins.css', 'chapbook-theme.js'];

/*
 * The social card. 1200x630 is the size every network crops from, and PNG
 * rather than JPEG is not a default either: the card is hairlines on a flat
 * ground, which is precisely what JPEG ringing destroys.
 *
 * The asset is drawn by hand and committed; the build's job is to look, not to
 * draw. A missing card is reported and the build continues, because the site
 * is correct without one — the head simply keeps the small summary card. A
 * card that is present but the wrong shape is a failure, because by then the
 * page is claiming summary_large_image and something will render broken.
 */
const CARD = { file: 'og.png', width: 1200, height: 630 };
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function readCard() {
  let bytes;
  try {
    bytes = await readFile(p('public', CARD.file));
  } catch {
    return { missing: true };
  }

  /* Signature, then IHDR: width and height are big-endian at 16 and 20. No
     decoding, no dependency — the header is the only part we need. */
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIG)) {
    return { problem: `public/${CARD.file} is not a PNG` };
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== CARD.width || height !== CARD.height) {
    return {
      problem:
        `public/${CARD.file} is ${width}x${height}, and the card must be ` +
        `${CARD.width}x${CARD.height} — every network crops from that shape`,
    };
  }
  return { width, height, bytes: bytes.length };
}

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

/* ========================================================================
   VERSION AGREEMENT
   ========================================================================
   Five files name the version and nothing read any of them, which is how the
   stylesheet header, system.md's title and the skill's frontmatter came to sit
   three releases behind while package.json, content.js, the changelog and the
   site all agreed. Drift here is invisible rather than broken, so it survives
   every other check in this file and is found by a reader instead.

   src/content.js is the source. It is what the build prints and what the
   frozen directory is named after.

   chapbook.css is checked ONLY while the version is unreleased. Once the tag
   exists the file is frozen, the header cannot be corrected without a bump,
   and failing on it would be a build nobody can make pass. Before the tag is
   exactly when it can be fixed, and therefore when it must be.
   ------------------------------------------------------------------------ */

function tagExists(tag) {
  try {
    return execFileSync('git', ['tag', '-l', tag], { cwd: root, encoding: 'utf8' }).trim() !== '';
  } catch {
    /* No git, no tags, or a shallow clone with none fetched. */
    return false;
  }
}

const VERSION_SITES = [
  { file: 'package.json', re: /"version":\s*"([^"]+)"/ },
  { file: 'public/system.md', re: /^# Chapbook v(\S+)/m },
  { file: 'skill/chapbook/SKILL.md', re: /^\s*version:\s*"([^"]+)"/m },
];

async function checkVersions(version, released) {
  const sites = released
    ? VERSION_SITES
    : VERSION_SITES.concat({ file: 'chapbook.css', re: /^ \* Chapbook — v(\S+)/m });

  const problems = [];
  for (const where of sites) {
    let text;
    try {
      text = await readFile(p(where.file), 'utf8');
    } catch {
      problems.push(`${where.file}: missing, and it names the version`);
      continue;
    }
    const found = text.match(where.re)?.[1];
    if (!found) problems.push(`${where.file}: no version string where one is expected`);
    else if (found !== version) {
      problems.push(`${where.file}: says ${found}, src/content.js says ${version}`);
    }
  }
  return problems;
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

  /* Cheap, and it runs before anything else is reported, because a build
     that publishes the wrong version number in its own documentation is
     wrong in a way no contrast measurement will catch. */
  problems.push(...(await checkVersions(site.version, tagExists(`v${site.version}`))));

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

  /* The card is an asset rather than a measurement, so it is read here and
     reported with everything else. A wrong-shaped card fails the build the
     same way a failing contrast token does. */
  const cardInfo = await readCard();
  if (cardInfo.problem) problems.push(cardInfo.problem);
  const og = cardInfo.width ? { ...cardInfo, alt: site.cardAlt } : null;

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
      `(04 05 08 are markup — node audit.js)`
  );

  /* The sheet, reported like everything else. Rule 09 is now two claims —
     the palette wins, and the page is set — so the build says both. */
  console.log(
    `  paper    18mm margin  10.5pt on 1.4  orphans 3 widows 3  ` +
      `headings hold the sheet`
  );

  console.log(
    `  card     ` +
      (og
        ? `public/${CARD.file}  ${og.width}x${og.height}  ` +
          `${(og.bytes / 1024).toFixed(0)} KB  summary_large_image`
        : `public/${CARD.file} absent  head falls back to the summary card`)
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

  /*
   * The exact directory is served `immutable, max-age=31536000`. That is a
   * promise that the bytes behind that URL will never change, and until now
   * nothing was keeping it: editing chapbook.css without bumping the version
   * quietly rewrote a published release, and anyone holding the old copy in
   * cache had different bytes from anyone fetching it fresh — with no way for
   * either to tell.
   *
   * So the promise is checked. If the frozen copy exists and differs from what
   * is about to be written, that is not a build to fix up, it is a release to
   * cut. Saying "immutable" about a path that moves is the sort of small lie
   * that costs somebody an afternoon, and this is the check that makes the
   * word true.
   */
  /*
   * Only a RELEASED version is immutable.
   *
   * The first build of an unreleased version writes public/vX.Y.Z/, and every
   * edit after that differs from it — which is not drift, it is work in
   * progress. Checking the directory alone made the guard fire on the second
   * build of every release, which is the fastest way to teach someone to stop
   * reading it.
   *
   * The tag is what publishes (release.yml triggers on it), so the tag is what
   * makes a version immutable. No tag, no promise to keep. If git cannot be
   * reached at all the check is skipped rather than guessed at: a build that
   * fails because it could not find git would be worse than one that misses a
   * rewrite.
   */
  const released = tagExists(exact);

  const frozenDrift = [];
  for (const file of released ? SHIPPED : []) {
    const at = p('public', exact, file);
    try {
      const [published, current] = await Promise.all([
        readFile(at, 'utf8'),
        readFile(p(file), 'utf8'),
      ]);
      if (published !== current) frozenDrift.push(`${exact}/${file}`);
    } catch {
      /* Not frozen yet — this is a new version, which is the normal case. */
    }
  }
  if (frozenDrift.length) {
    console.error(
      `\n  ${exact} is tagged and published, and is cached as immutable for a\n` +
        `  year, but the working copy differs from it:\n`
    );
    for (const f of frozenDrift) console.error(`    - ${f}`);
    console.error(
      `\n  Bump the version in package.json and src/content.js. Editing a\n` +
        `  shipped file without a bump rewrites a release somebody may already\n` +
        `  be linking to.\n`
    );
    process.exit(1);
  }

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
    ['public/index.html', indexPage({ palettes, themeScript: themeInline, demoScript, og })],
    ['public/404.html', notFoundPage({ themeScript: themeInline })],
    ['public/colophon.html', colophonPage({ palettes, themeScript: themeInline })],
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
