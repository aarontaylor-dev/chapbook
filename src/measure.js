/*
 * The measuring code behind Rule 07.
 *
 * Contrast in this system is not estimated and not pasted from a checker. It
 * is computed here, on every build, from the same CSS the site ships — and a
 * token that drops below AA fails the build rather than reaching a page.
 *
 * The subtlety is the surface. A ratio measured against --paper is wrong,
 * because the grain overlay sits between the text and the page. In light it
 * is dark noise on a light ground; in dark it is light noise on a dark one.
 * Both move the surface TOWARD the text colour, so both reduce contrast, and
 * the honest number is the one measured against the worst-case grain pixel.
 */

/* --------------------------------------------------------------- colour -- */

const channel = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const rgb = (hex) => {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

const luminance = (hex) => {
  const [r, g, b] = rgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const hex = (n) => Math.round(n).toString(16).padStart(2, '0');

/* Composite `noise` over `ground` at `alpha` — what the grain actually does. */
export const composite = (ground, noise, alpha) => {
  const [g, n] = [rgb(ground), rgb(noise)];
  return `#${g.map((c, i) => hex(c + (n[i] - c) * alpha)).join('')}`;
};

/*
 * The worst-case surface a glyph can sit on. Light mode paints dark noise,
 * dark mode paints light noise; in both cases the extreme pixel is the one
 * closest to the text.
 */
export const worstSurface = ({ paper, grain }, mode) =>
  Number(grain) > 0
    ? composite(paper, mode === 'dark' ? '#ffffff' : '#000000', Number(grain))
    : paper;

/* ------------------------------------------------------------------ CSS -- */

/* The eight colour tokens are the contract. Order matters: it is the order
   they are reported in, and it runs ground -> structure -> text -> accent. */
export const COLOUR_TOKENS = [
  'paper', 'sunk', 'rule', 'ink', 'muted', 'faint', 'accent', 'accent-deep',
];

/* Tokens that carry text and therefore must clear AA. --rule and --sunk are
   exempt: they are edges and fills, and WCAG does not ask a hairline to be
   legible. */
export const TEXT_TOKENS = ['ink', 'muted', 'faint', 'accent', 'accent-deep'];

export const AA = 4.5;

/*
 * Pull one declaration block out of a stylesheet by its exact selector.
 * Deliberately crude — it only ever reads files in this repo, which are
 * hand-written and formatted one declaration per line. A real CSS parser
 * would be a dependency, and this system has none.
 */
export function block(css, selector) {
  const at = css.indexOf(`${selector} {`);
  if (at === -1) return null;
  const open = css.indexOf('{', at);
  const close = css.indexOf('}', open);
  const out = {};
  for (const line of css.slice(open + 1, close).split('\n')) {
    const m = line.match(/^\s*--([a-z-]+)\s*:\s*([^;]+);/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

/*
 * Rule 06 says the dark palette is declared twice — once in the media query
 * and once on the attribute — and that the two must agree. Nothing in CSS
 * enforces that, and a value edited in one place and not the other produces a
 * site whose toggle disagrees with the same site's system preference. So it
 * is checked here instead.
 */
export function darkBlocksAgree(css, skinSelector = ':root') {
  const media = block(css, `${skinSelector}:not([data-theme="light"])`);
  const attr = block(css, `${skinSelector}[data-theme="dark"]`);
  if (!media || !attr) return { ok: false, reason: 'one of the dark blocks is missing' };
  const drift = COLOUR_TOKENS.concat('grain')
    .filter((t) => (media[t] ?? null) !== (attr[t] ?? null))
    .map((t) => `--${t}: ${media[t] ?? '(absent)'} vs ${attr[t] ?? '(absent)'}`);
  return { ok: drift.length === 0, drift };
}

/* ---------------------------------------------------------------- audit -- */

/*
 * Measure one palette and return a row per text token. `pass` is the whole
 * point: build.js turns a false into a non-zero exit.
 */
export function audit(palette, mode) {
  const surface = worstSurface(palette, mode);
  const rows = TEXT_TOKENS.map((token) => {
    const value = palette[token];
    const measured = ratio(value, surface);
    return {
      token: `--${token}`,
      value,
      flat: ratio(value, palette.paper),
      grain: measured,
      pass: measured >= AA,
    };
  });
  return {
    mode,
    surface,
    grain: Number(palette.grain ?? 0),
    rows,
    /* Reported for their own reason: --sunk has to stay felt rather than
       seen, and a fill that creeps past about 1.15:1 starts reading as a
       card, which is Rule 02 lost by accident. */
    sunk: ratio(palette.sunk, palette.paper),
    rule: ratio(palette.rule, palette.paper),
    pass: rows.every((r) => r.pass),
  };
}
