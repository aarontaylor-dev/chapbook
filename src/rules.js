/*
 * The static checks behind Rules 01, 02, 03 and 09.
 *
 * WHY THIS FILE EXISTS
 *   v1.0.0 shipped nine rules, two of which the build enforced. Rule 06 was a
 *   diff and Rule 07 was a measurement, and those two were also the only two
 *   that had not broken. Rule 09 was a comment, and it was false for eight
 *   months on the system's own website: the print palette is declared on
 *   `:root` at (0,1,0) and lost to every skin selector at (0,2,0), so anyone
 *   who picked a skin or pressed the theme toggle printed in screen colours.
 *   Nobody noticed, because nothing looked.
 *
 *   The system's best idea is that a rule you can execute is worth more than a
 *   rule you can read. This file acts on it. Four more rules become tests, and
 *   three of the four passed on the day they were written — which is the point:
 *   they cost nothing now and they catch the edit that would have cost an
 *   afternoon in a year.
 *
 * WHAT IS NOT HERE, AND WHY
 *   Rules 04, 05 and 08 are about markup and meaning — whether a rail sticks
 *   beside its content, whether every list on a site shares one row anatomy,
 *   whether a control that DOES something is bordered. None of that is visible
 *   in a stylesheet, and a check that pretends otherwise would be theatre.
 *   Those three are the skill's job. Six enforced here, three enforced there,
 *   nine accounted for.
 *
 * The parsing is deliberately crude, for the same reason src/measure.js is: it
 * only ever reads files in this repository, which are hand-written and
 * formatted one declaration per line. A real CSS parser would be a dependency,
 * and this system has none.
 */

/* Comments contain counter-examples ON PURPOSE — Rule 02 says "never write
   border-radius", the upgrade note shows a @font-face with a real family name.
   Every check below runs on the code, so the prose cannot fail the build. */
export const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/* Slice an at-rule and its braces out of a stylesheet, counting depth so a
   nested block does not end the slice early. */
export function atRule(css, prelude) {
  const at = css.indexOf(prelude);
  if (at === -1) return null;
  let depth = 0;
  for (let i = css.indexOf('{', at); i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(at, i + 1);
  }
  return null;
}

/*
 * Specificity as (ids, classes, elements), which is all this system's
 * selectors need. `:root[data-skin="clay"][data-theme="dark"]` is (0,3,0);
 * `:not(...)` contributes its argument's specificity, not its own.
 */
export function specificity(selector) {
  /* :is() and :not() contribute their argument's specificity; :where() zero. */
  let s = selector
    .replace(/:where\([^)]*\)/g, ' ')
    .replace(/:(?:not|is)\(([^)]*)\)/g, ' $1 ');

  /* Counted and then removed, so a later pattern cannot rematch inside an
     earlier one — an attribute value like [data-skin="clay"] would otherwise
     read as an element called `clay`. */
  const ids = (s.match(/#[\w-]+/g) || []).length;
  s = s.replace(/#[\w-]+/g, ' ');

  const attributes = (s.match(/\[[^\]]*\]/g) || []).length;
  s = s.replace(/\[[^\]]*\]/g, ' ');

  const pseudoElements = (s.match(/::[\w-]+/g) || []).length;
  s = s.replace(/::[\w-]+/g, ' ');

  const classes = (s.match(/\.[\w-]+/g) || []).length;
  s = s.replace(/\.[\w-]+/g, ' ');

  const pseudoClasses = (s.match(/:[\w-]+/g) || []).length;
  s = s.replace(/:[\w-]+/g, ' ');

  const elements = (s.match(/[a-z][\w-]*/gi) || []).length;
  return [ids, attributes + classes + pseudoClasses, elements + pseudoElements];
}

export const beats = (a, b) =>
  a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] > b[2];

/* ------------------------------------------------------------- Rule 01 -- */

/*
 * Two faces, and the mono is the constant. Every font-family in the system has
 * to name one of the three face tokens — the moment a literal family appears
 * in the product, a site's --language stops being the site's own.
 */
export const FACE_TOKENS = ['var(--mono)', 'var(--language)', 'var(--display)', 'inherit'];

export function checkFaces(css) {
  const problems = [];
  for (const [, value] of stripComments(css).matchAll(/font-family:\s*([^;]+);/g)) {
    const v = value.trim();
    if (!FACE_TOKENS.includes(v)) {
      problems.push(`Rule 01 — font-family: ${v} is not one of ${FACE_TOKENS.join(', ')}`);
    }
  }
  return problems;
}

/* ------------------------------------------------------------- Rule 02 -- */

/* No cards. Radius and shadow are the two properties that say "separate
   object" without being asked, and the system has neither. */
export function checkCards(css) {
  const problems = [];
  for (const prop of ['border-radius', 'box-shadow']) {
    for (const [line] of stripComments(css).matchAll(new RegExp(`^.*\\b${prop}\\s*:.*$`, 'gm'))) {
      problems.push(`Rule 02 — ${prop} found: ${line.trim()}`);
    }
  }
  return problems;
}

/* ------------------------------------------------------------- Rule 03 -- */

/*
 * Two weights of rule, and they mean different things: 1px between peers, 2px
 * to open and close the document. A third weight is checked for, and so is the
 * pairing — a 2px rule in anything but --ink is the heavy weight spent on
 * something that is not structural, which is the same loss by a subtler route.
 *
 * `outline` is exempt. The focus ring is not a rule; it is a control affordance
 * that has to clear the text it surrounds, and WCAG has opinions about its
 * thickness that Rule 03 does not get to overrule.
 */
export function checkWeights(css) {
  const problems = [];
  const body = stripComments(css);
  for (const [, decl, value] of body.matchAll(/(border(?:-(?:top|right|bottom|left))?)\s*:\s*([^;]+);/g)) {
    const width = value.match(/([\d.]+)px/);
    if (!width) continue;                       /* `border: 0` and the like */
    const px = width[1];
    if (px !== '1' && px !== '2') {
      problems.push(`Rule 03 — a third rule weight: ${decl}: ${value.trim()}`);
    } else if (px === '2' && !value.includes('var(--ink)')) {
      problems.push(`Rule 03 — 2px is the document weight and must be --ink: ${decl}: ${value.trim()}`);
    }
  }
  return problems;
}

/* ------------------------------------------------------------- Rule 09 -- */

/*
 * It prints — and it has to print for every palette, not only the default one.
 *
 * The check resolves the actual cascade question rather than asserting the
 * shape of the fix: for each colour token, the print declaration must beat
 * every other declaration of that token in the shipped CSS, either by carrying
 * !important where the others do not, or by out-specifying all of them.
 *
 * `sheets` is every stylesheet that ships, because a skin in one file has to
 * lose to the print block in another.
 */
export function checkPrint(sheets, tokens) {
  const problems = [];
  const printSheet = sheets.find((s) => atRule(stripComments(s.css), '@media print'));
  if (!printSheet) return ['Rule 09 — no @media print block anywhere in the shipped CSS'];

  const printBlock = atRule(stripComments(printSheet.css), '@media print');

  /*
   * Every :root-ish declaration of a colour token OUTSIDE the print block,
   * with its position in the cascade — because specificity is only half the
   * question. At EQUAL specificity the later declaration wins, and the print
   * block sits at the end of chapbook.css, so it legitimately beats the base
   * :root palette in the same file. A stylesheet loaded afterwards does not
   * lose that way, which is why the sheet index is part of the ordering.
   */
  const printSheetIndex = sheets.indexOf(printSheet);
  const printAt = [printSheetIndex, stripComments(printSheet.css).indexOf(printBlock)];
  const laterThanPrint = (at) => at[0] !== printAt[0] ? at[0] > printAt[0] : at[1] > printAt[1];

  const rivals = [];
  for (const [index, sheet] of sheets.entries()) {
    const body = stripComments(sheet.css).replace(printBlock, '');
    for (const match of body.matchAll(/(:root[^{}]*?)\s*\{([^}]*)\}/g)) {
      const [, selector, decls] = match;
      for (const [, token, value] of decls.matchAll(/--([a-z-]+)\s*:\s*([^;]+);/g)) {
        if (!tokens.includes(token)) continue;
        rivals.push({
          sheet: sheet.name,
          selector: selector.trim(),
          token,
          spec: specificity(selector.trim()),
          important: /!important/.test(value),
          at: [index, match.index],
        });
      }
    }
  }

  for (const token of tokens) {
    const declared = printBlock.match(new RegExp(`--${token}\\s*:\\s*([^;]+);`));
    if (!declared) {
      problems.push(`Rule 09 — the print block never sets --${token}`);
      continue;
    }
    const printImportant = /!important/.test(declared[1]);
    const printSpec = specificity(':root');

    for (const rival of rivals.filter((r) => r.token === token)) {
      if (printImportant && !rival.important) continue;      /* important wins */
      if (printImportant && rival.important) {
        problems.push(
          `Rule 09 — --${token} is !important in ${rival.sheet} at ${rival.selector}, ` +
            `which fights the print block for the page. A skin must never mark a token !important.`
        );
        continue;
      }
      /* Print wins on specificity, or ties and comes later in the cascade. */
      const tied = printSpec.join() === rival.spec.join();
      if (beats(printSpec, rival.spec) || (tied && !laterThanPrint(rival.at))) continue;

      problems.push(
        `Rule 09 — --${token} in print is :root (${printSpec.join(',')}) and loses to ` +
          `${rival.selector} (${rival.spec.join(',')}) in ${rival.sheet}, so that palette prints ` +
          `instead of ink on white`
      );
    }
  }

  /* Deduplicate: one message per token per rival selector is enough. */
  return [...new Set(problems)];
}

/* ------------------------------------------------------------------ run -- */

/*
 * Run every static rule over the shipped stylesheets. Returns a flat list of
 * problems, which build.js turns into a non-zero exit exactly as it does for
 * the contrast audit — a rule that only warns is a rule that gets ignored.
 */
/*
 * Rule 09, the other half.
 *
 * checkPrint above proves the print palette WINS. It says nothing about
 * whether the page is SET — and for eight months "it prints" meant only that
 * the colours were right, which is how a page can pass every check and still
 * come off the printer with a heading stranded at the foot of a sheet and a
 * margin decided by whichever dialogue the reader happened to open.
 *
 * Three declarations, and each one owns a decision the stylesheet otherwise
 * hands to the browser. They are checked as presence rather than as values:
 * 18mm is a judgement and a fork may reasonably disagree, but a stylesheet
 * claiming Rule 09 while leaving the page unset is making a claim it has not
 * paid for.
 */
export function checkPaged(sheets) {
  const problems = [];
  const css = sheets.map((s) => stripComments(s.css)).join('\n');
  const printBlock = sheets
    .map((s) => atRule(stripComments(s.css), '@media print'))
    .filter(Boolean)
    .join('\n');

  const page = atRule(css, '@page');
  if (!page) {
    problems.push('Rule 09 — no @page rule, so the sheet margin is the print dialogue’s default');
  } else if (!/\bmargin\s*:/.test(page)) {
    problems.push('Rule 09 — @page sets no margin, which is the only reason to declare it');
  }

  for (const prop of ['orphans', 'widows']) {
    if (!new RegExp(`\\b${prop}\\s*:`).test(printBlock)) {
      problems.push(`Rule 09 — the print block never sets ${prop}, so lines strand across page breaks`);
    }
  }

  if (!/\b(?:page-)?break-after\s*:\s*avoid/.test(printBlock)) {
    problems.push('Rule 09 — nothing sets break-after: avoid, so a heading can end a sheet alone');
  }

  return problems;
}

export function checkRules(sheets, tokens) {
  const product = sheets.filter((s) => s.name.endsWith('.css'));
  return [
    ...product.flatMap((s) => checkFaces(s.css).map((p) => `${p}  (${s.name})`)),
    ...product.flatMap((s) => checkCards(s.css).map((p) => `${p}  (${s.name})`)),
    ...product.flatMap((s) => checkWeights(s.css).map((p) => `${p}  (${s.name})`)),
    ...checkPrint(product, tokens),
    ...checkPaged(product),
  ];
}
