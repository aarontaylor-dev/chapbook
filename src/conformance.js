/*
 * The conformance scanner.
 *
 * build.js enforces six of the nine rules against the STYLESHEET. Rules 04, 05
 * and 08 are about markup and meaning — whether a rail actually carries the
 * section, whether every index row shares one anatomy, whether a control that
 * does something is bordered — and none of that is visible in CSS. Until now
 * they were documented and nothing ran them.
 *
 * This file does not score those three, and that is deliberate. A regex cannot
 * tell whether a row's label is honest or whether a control earns its border,
 * and a checker that pretended otherwise would be the theatre the build's own
 * comments refuse. What it does is gather the evidence a reader — human or
 * agent — needs in order to judge, section by section, and lay it out in the
 * same shape every time so that two audits of the same page agree.
 *
 * Mechanical findings ARE reported as failures, because those are decidable:
 * a section with no rail, a row carrying an anatomy no other row uses, a
 * <button> with no bordered class, an inline style introducing a radius.
 *
 * No dependencies, and no HTML parser. The system's markup is a small, known
 * vocabulary of class names, which is exactly what makes a scanner tractable
 * here and would not make one tractable in general.
 */

/* The row anatomy, in the order the system declares it. Rule 05. */
export const ROW_PARTS = ['row-label', 'row-title', 'row-mark', 'row-desc', 'row-meta'];

/* Classes that carry the mono face, and therefore claim to be structure
   rather than language. Rule 01's test: does this text tell you what kind of
   thing you are looking at, or does it say something? */
export const MONO_BEARING = [
  'eyebrow', 'label', 'n', 'rule-n', 'rule-spec', 'row-label', 'row-meta',
  'row-mark', 'small', 'brand', 'foot', 'btn', 'note', 'aside',
];

/* Rule 08: a control that does something is bordered. These are the bordered
   forms the system ships. A <button> outside this set is a word pretending
   not to be a control. */
export const BORDERED_CONTROLS = ['theme', 'btn'];

const classesOf = (tag) => {
  const m = tag.match(/class="([^"]*)"/);
  return m ? m[1].trim().split(/\s+/).filter(Boolean) : [];
};

/*
 * Split the document into sections at `<section class="blk"`, matching each to
 * its own closing tag by depth rather than by the next `</section>`, so a
 * nested section cannot truncate its parent.
 */
export function sections(html) {
  const found = [];
  const open = /<section\b[^>]*class="[^"]*\bblk\b[^"]*"[^>]*>/g;
  let m;

  while ((m = open.exec(html))) {
    const start = m.index;
    let depth = 0;
    const scan = /<\/?section\b[^>]*>/g;
    scan.lastIndex = start;
    let s;
    let end = html.length;
    while ((s = scan.exec(html))) {
      depth += s[0][1] === '/' ? -1 : 1;
      if (depth === 0) {
        end = s.index + s[0].length;
        break;
      }
    }
    const inner = html.slice(start, end);
    const idm = m[0].match(/id="([^"]+)"/);
    found.push({ id: idm ? idm[1] : null, html: inner });
    open.lastIndex = end;
  }
  return found;
}

/* Every row in a fragment, with the anatomy each one actually carries. */
function rowsIn(fragment) {
  const rows = [];
  const re = /<a\b[^>]*class="[^"]*\brow\b[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(fragment))) {
    const parts = ROW_PARTS.filter((p) =>
      new RegExp(`class="[^"]*\\b${p}\\b[^"]*"`).test(m[1])
    );
    rows.push(parts);
  }
  return rows;
}

function controlsIn(fragment) {
  const out = [];
  const re = /<button\b([^>]*)>/g;
  let m;
  while ((m = re.exec(fragment))) {
    const cls = classesOf(m[0]);
    out.push({ classes: cls, bordered: cls.some((c) => BORDERED_CONTROLS.includes(c)) });
  }
  return out;
}

const textOf = (html) =>
  html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

/*
 * One section's evidence. Everything here is observable; nothing here is a
 * verdict except the `problems` array, which holds only the decidable kind.
 */
export function inspect(section) {
  const { id, html } = section;
  const problems = [];

  const railMatch = html.match(/<div\b[^>]*class="[^"]*\brail\b[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  const rail = Boolean(railMatch);
  const railNumber = rail ? /class="[^"]*\bn\b[^"]*"/.test(railMatch[1]) : false;
  const railHeading = rail ? /<h2\b/.test(railMatch[1]) : false;
  const body = /<div\b[^>]*class="[^"]*\bbody\b[^"]*"/.test(html);

  /* Rule 04 — decidable: the column either exists or it does not. */
  if (!rail) problems.push(`${id}: no .rail — Rule 04 wants the section in a column beside its content`);
  if (rail && !railHeading) problems.push(`${id}: .rail carries no <h2>`);
  if (!body) problems.push(`${id}: no .body`);

  /* Rule 05 — decidable: within one section, rows either share an anatomy or
     they do not. Whether the anatomy is the RIGHT one is judgement. */
  const rows = rowsIn(html);
  const shapes = [...new Set(rows.map((r) => r.join('+')))];
  if (shapes.length > 1) {
    problems.push(
      `${id}: ${shapes.length} different row anatomies in one section — Rule 05 wants one:\n` +
        shapes.map((s) => `             ${s || '(empty)'}`).join('\n')
    );
  }
  const untitled = rows.filter((r) => !r.includes('row-title')).length;
  if (untitled) problems.push(`${id}: ${untitled} row(s) with no .row-title`);

  /* Rule 08 — decidable half: a <button> with no bordered class. */
  const controls = controlsIn(html);
  for (const c of controls) {
    if (!c.bordered) {
      problems.push(
        `${id}: <button class="${c.classes.join(' ') || '—'}"> is not a bordered control — Rule 08`
      );
    }
  }

  /* Rules 02 and 03 reach the markup through inline styles, which the CSS
     checks cannot see. */
  for (const m of html.matchAll(/style="([^"]*)"/g)) {
    if (/border-radius|box-shadow/.test(m[1])) {
      problems.push(`${id}: inline style introduces ${/radius/.test(m[1]) ? 'a radius' : 'a shadow'} — Rule 02`);
    }
    const bw = m[1].match(/border(?:-\w+)?-width\s*:\s*(\d+)px/);
    if (bw && !['1', '2'].includes(bw[1])) {
      problems.push(`${id}: inline style sets a ${bw[1]}px border — Rule 03 allows 1px and 2px`);
    }
  }

  const mono = MONO_BEARING.filter((c) => new RegExp(`class="[^"]*\\b${c}\\b`).test(html));
  const heading = railMatch ? textOf(railMatch[1]).replace(/^\d+\s*/, '') : '(no rail)';
  const number = railMatch ? (textOf(railMatch[1]).match(/^\d+/) || [null])[0] : null;

  return {
    id,
    number,
    heading,
    rail,
    railNumber,
    body,
    rows: rows.length,
    rowShapes: shapes,
    controls: controls.length,
    borderedControls: controls.filter((c) => c.bordered).length,
    monoBearing: mono,
    words: textOf(html).split(' ').length,
    problems,
  };
}

export function scan(html) {
  const found = sections(html).map(inspect);

  /* Rule 05 asks for ONE index-row anatomy, and one section reading correctly
     says nothing about the next. This cross-section check is the one that
     matters and the one a per-section reading misses: two sections can each be
     internally consistent and still disagree with each other. */
  const all = [...new Set(found.flatMap((s) => s.rowShapes))].filter(Boolean);
  const global = [];
  if (all.length > 1) {
    global.push(
      `Rule 05 — ${all.length} row anatomies across the document, and the rule says one:\n` +
        all.map((s) => `             ${s}`).join('\n')
    );
  }
  return { sections: found, global };
}
