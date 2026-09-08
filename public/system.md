# Chapbook v1.2.2

A small CSS system for documents that want to read like documents.

**Monospace carries structure, a second face carries language, and separation
comes from rules and space rather than from cards.**

MIT. Take it, change it, no credit needed.

- Stylesheet: <https://chapbook.page/v1.2.2/chapbook.css>
- Skins: <https://chapbook.page/v1.2.2/chapbook-skins.css>
- Theme bootstrap: <https://chapbook.page/v1.2.2/chapbook-theme.js>
- Specimen: <https://chapbook.page>
- Source: <https://github.com/aarontaylor-dev/chapbook>

This file is the complete specification. If you are an agent building a page
in this system, you need nothing else.

---

## What this is not

It is not a framework, and it is not a component library. It has no build
step, no JavaScript requirement and no utility classes. It styles a **named set
of components** and leaves the rest of the document alone, deliberately, so it
can be dropped into an existing page without a fight.

It will not style your headings, paragraphs or links for you beyond the
primitives listed here. That is on purpose. If you want a heading styled, put
one of these classes on it.

### What it does reset

Small, but not nothing. Know this before dropping it into a page that already
has styles:

| Selector | What it sets |
| --- | --- |
| `*`, `::before`, `::after` | `box-sizing: border-box` |
| `body` | margin, background, colour, face, size, leading |
| `h1`–`h4`, `p` | `margin: 0` — the system spaces from the container |
| `h1`–`h4` | `font-weight: 400`, `text-wrap: balance` |
| `a` | `color: inherit` |
| `html` | `scroll-behavior: smooth`, off under reduced motion |
| `code`, `kbd`, `samp` | `var(--mono)` at `0.9em`, so Rule 01 is true by default |
| `pre code` | `font-size: inherit`, so `<pre><code>` does not shrink twice |
| `hr` | one 1px `--rule` hairline, so Rule 03 is true by default |

The last two exist because the rules were otherwise **false by default**:
`monospace` is a keyword rather than a face, so an unstyled `<code>` renders in
a second mono the system never chose; and the UA draws `<hr>` as an inset
border, which is a third rule weight arriving without anybody writing one.

`p { margin: 0 }` is global, so paragraphs nested inside a blockquote, list
item or figure are spaced by `.body` rather than by the UA. Outside `.body`
they have no spacing at all — that is the container's job.

The column rhythm itself is `.body > * + *` at 1.35rem, and the reset that
clears the UA's own margins ahead of it is written with `:where()`. **That is
load-bearing.** `:is()` takes the specificity of its most specific argument, so
`.body > :is(p, ul, ol, …)` scores (0,1,1) and outranks the rhythm rule at
(0,1,0) — the reset wins, and every gap in the column collapses to zero.
`:where()` contributes no specificity, ties at (0,1,0), and loses on source
order, which is what a reset should do. Swap the one for the other and the
column closes up, with no error anywhere.

---

## The nine rules

These are the system. The CSS is only their implementation. Each was already
being followed by two independently built sites before it was written down —
a rule that has survived one build is a preference.

### Rule 01 — Two faces, and the mono is the constant

One monospace sets every label, number, address, breadcrumb, button and footer
line — anything that tells you *what kind of thing* you are looking at rather
than *saying something*. A second face carries the language, and it is the
site's own.

**The test that decides every case:** if a piece of text tells you what kind of
thing you are looking at, it is mono, uppercase and tracked. If it says
something, it is the language face.

`--mono` is shared across sites built on this system. `--language` is not.

### Rule 02 — No cards

No radius, no fill, no shadow to say "separate object". Objects are separated
by a hairline and by space.

The only fill in the system is the row hover at about 1.07:1 — felt rather
than seen. If you can identify its colour, it is too strong.

The single exception is `.code`, which earns its border by genuinely being a
different surface rather than a card drawn around ordinary content.

**Never write:** `border-radius`, `box-shadow`, or a background fill on a
container.

### Rule 03 — Two weights of rule, and they mean different things

- **1px `var(--rule)`** separates peers.
- **2px `var(--ink)`** opens and closes the document: under the masthead,
  above the first block, above the footer.

Those three ink lines are what hold a page together at a glance. Do not add a
third weight — the moment there are three, none of them mean anything.

### Rule 04 — The numbered rail

A sticky left column carrying a number and a mono section name, content on the
right. It stays beside its content for as long as that content is on screen,
and collapses to a line above the content below 52rem.

`align-self: start` is **required**. A grid item stretches to the row height by
default, and a stretched item has nothing to stick within. Remove that one
line and the rail silently stops moving, with no error anywhere.

Omit the number on a single-section page. A section number is a promise that
another one follows.

### Rule 05 — One row anatomy, and the row is a link

Mono label left, title in the display face, mark right, then an optional
description and a mono line carrying the destination. The whole row is the
link; the mark is decorative and must carry `aria-hidden="true"`.

On hover the hairline redraws in ink from the left and the mark nudges up and
right.

Use `↗` for a destination that leaves the site and `→` for one that does not,
so the mark keeps meaning something.

**What the rule covers.** The index row — the one that navigates. Every clause
above is about a link: the row *is* the anchor, the mark points at a
destination, the hover is navigational affordance. A repeated block that does
not link is a different object and does not owe this anatomy. `.rule` on the
specimen has had its own shape since v1.0.0 for exactly that reason.

The rule is that there is **one** such anatomy, not that every repeated thing
on the page must adopt it.

### Rule 06 — Tokens declared three times

```css
:root { /* light palette, and the fallback */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* guarded, so an explicit choice wins */ }
}

:root[data-theme="dark"] { /* the toggle, so it wins in both directions */ }
```

**Never style a component from inside one of those blocks.** Redefine tokens
only. A component rule written there exists in one theme and not the other,
and you will not notice for weeks.

The two dark blocks must declare identical values. Nothing in CSS enforces
that; `build.js` in the source repo checks it.

### Rule 07 — Contrast is measured, and the measurement is written down

Every text token carries its ratio, measured against the **worst-case surface**
rather than the flat background. The grain overlay sits between the text and
the page and moves the surface toward the text in *both* themes, so a ratio
taken against `--paper` flatters itself.

- Light: the worst pixel is `--paper` composited with black at `--grain`.
- Dark: the worst pixel is `--paper` composited with white at `--grain`.

Text tokens must clear **4.5:1**. `--rule` and `--sunk` are exempt — they are
edges and fills, and WCAG does not ask a hairline to be legible.

Ink is never pure black on pure white; at 21:1 that pairing glares on long
text.

### Rule 08 — A bordered control, not another word in a row of words

A control that *does* something gets a hairline border. Links that only *go*
somewhere do not. The theme toggle is a 2rem square for exactly this reason.

Ship it with the `hidden` attribute set and let script reveal it, so a visitor
without JavaScript is never offered a button that cannot work.

A pressed state is a **border in ink, not a fill** — a filled button would be
the first card on the page.

### Rule 09 — It prints

Ink on white, controls gone, every panel open, `break-inside: avoid` on
structural blocks, and link destinations expanded after the link text. A
printed page has no hover and no address bar, so a bare "read more" prints as
a dead end.

**The sheet is set, not surrendered.** Three decisions that a stylesheet
otherwise hands to the browser:

```css
@page { margin: 18mm; }                        /* not the print dialogue's default */

@media print {
  p, li, dd, blockquote { orphans: 3; widows: 3; }   /* no stranded lines */
  h1, h2, h3, h4 { break-after: avoid; }             /* no heading alone at a foot */
}
```

`@page` sits outside `@media print` because it only ever applies to paged
media. 18mm is a judgement and a fork may reasonably disagree; leaving it
unset is not a judgement, it is a per-installation default, which means the
same document printed in two offices is set two different ways.

Three is the conventional floor for orphans and widows: two admits a stranded
pair that still reads as broken, four starts pushing whole paragraphs across
for the sake of one line.

Expand `href` on content links only. Applied to every anchor it also prints the
address of every nav item, which is noise.

**Every token in the print block carries `!important`, and that is
load-bearing.** A media query does not change specificity: the print block is
`:root` at (0,1,0) and loses to `:root[data-theme="dark"]` and to every skin
selector at (0,2,0). Until v1.0.1 this meant the print palette applied only to
the neutral skin, and only for a reader who had never touched the toggle —
anyone else printed near-white text onto white paper. `!important` is the one
mechanism specificity cannot outrank, so it is the correct tool here rather
than a shortcut: this block has to beat every palette that will ever be written
against the system, including palettes that do not exist yet.

**A skin must therefore never mark a token `!important`.** It would win that
fight and print itself. `build.js` checks for it.

---

## Token contract

The eight colour token **names** are the contract. Change every value you
like; keep the names, so a diff between two sites built on this system shows
only the differences that were intended.

| Token | Role |
| --- | --- |
| `--paper` | Page ground |
| `--sunk` | Row hover, code field. Felt rather than seen. |
| `--rule` | Hairlines. Decorative; no contrast requirement. |
| `--ink` | Body, titles, and the 2px rules |
| `--muted` | Ledes, summaries, descriptions |
| `--faint` | Mono labels, meta, addresses |
| `--accent` | Links, rail numbers, status |
| `--accent-deep` | Link hover |

Plus `--grain` (0 to disable the surface noise).

### Faces

| Token | Role |
| --- | --- |
| `--mono` | The structural face. Shared across sites. |
| `--language` | The reading face. The site's own. |
| `--display` | Titles. Defaults to `var(--language)`. |

Set `--display` separately only when titles genuinely want a different face.

### Layout

Reconciled across the three sites already running this system — they had
drifted, and these are the settled values. **Rem everywhere; do not
reintroduce px.**

| Token | Value |
| --- | --- |
| `--gut` | `clamp(1.25rem, 5vw, 2.75rem)` |
| `--wrap` | `62rem` |
| `--rail` | `10rem` |
| `--measure` | `34em` |
| `--ease` | `cubic-bezier(0.22, 0.61, 0.36, 1)` |

---

## The default palette

Neutral: monochrome, no accent. Ratios measured against the worst-case grain
pixel — `#f5f5f5` in light, `#161616` in dark.

| Token | Light | Ratio | Dark | Ratio |
| --- | --- | --- | --- | --- |
| `--paper` | `#fcfcfc` | — | `#111` | — |
| `--sunk` | `#f4f4f4` | 1.07 | `#191919` | 1.07 |
| `--rule` | `#e5e5e5` | — | `#2a2a2a` | — |
| `--ink` | `#111` | 17.32 | `#ededed` | 15.46 |
| `--muted` | `#444` | 8.93 | `#b4b4b4` | 8.73 |
| `--faint` | `#666` | 5.27 | `#8a8a8a` | 5.24 |
| `--accent` | `#111` | 17.32 | `#ededed` | 15.46 |
| `--accent-deep` | `#111` | 17.32 | `#ededed` | 15.46 |
| `--grain` | `0.028` | | `0.02` | |

Those ratios are measurements rather than constants, taken on 14 August 2026
against the worst-case pixel for this `--paper` and no other. `--ink` is 18.41:1
against the flat background and 17.32:1 against the worst case; `#000` on `#fff`
was tried and rejected, because at 21:1 it glares on long text. A text token
that changes is re-measured against the worst-case pixel for its own `--paper`.
It is never carried over.

The neutral skin collapses the accent onto the ink deliberately: a monochrome
page has no hue to spend, so a link announces itself by decoration and hover
changes the underline rather than the colour.

---

## Class reference

Everything the system styles. There is nothing else.

### Layout

| Class | On | What it does |
| --- | --- | --- |
| `.wrap` | any | Centres content at `--wrap`, with `--gut` either side |
| `.bar` | `<header>` | Masthead row. Adds the 2px ink rule beneath. |
| `.brand` | `<a>` | Site name in the masthead |
| `.bar-end` | `<div>` | Right-hand group: nav plus the toggle |
| `.barlinks` | `<nav>` | Section links. Hidden below 36rem. |
| `.blk` | `<section>` | Rail + body grid. First one gets the 2px ink rule. |
| `.rail` | `<div>` | The sticky left column |
| `.rail .n` | `<p>` | The section number. Tabular, `--accent`. |
| `.rail .note` | `<p>` | A margin note. Mono, `--faint`. `<b>` inside is its lead-in. |
| `.body` | `<div>` | The content column |
| `.foot` | `<div>` | Footer row, inside `<footer>` |

### Type

| Class | What it is |
| --- | --- |
| `.eyebrow` | Mono label above a page title |
| `.name` | The page title, in `--display` |
| `.intro` | The opening sentence, `--muted` |
| `.aside` | Mono aside — the page talking about itself |
| `.lede` | Section opener, `--muted` |
| `.label` | The mono label. The most reused object in the system. |
| `.small` | Mono running text, for footnotes and asides |
| `.footnote` | Adds top margin. Combine: `class="small footnote"`. |
| `.code` | `<pre>` code field. The one bordered, filled object. |

Unclassed inside `.body`, and styled because a document has them:

| Element | What it gets |
| --- | --- |
| `h3` | Mono, tracked, uppercase. One treatment, not a scale. |
| `ul` / `ol` | `--faint` markers, tighter gap between items than between blocks |
| `blockquote` | 2px ink rule on the left, no fill and no italic |
| `blockquote cite` | Mono, uppercase, `--faint` |

### The index row

| Class | On | What it is |
| --- | --- | --- |
| `.index` | `<nav>` | The container. Drops its top border if first in `.body`. |
| `.row` | `<a>` | The whole row is the link |
| `.row-label` | `<span>` | Mono status, left column |
| `.row-title` | `<span>` | Title in `--display` |
| `.row-mark` | `<span>` | `↗` or `→`. Must be `aria-hidden="true"`. |
| `.row-desc` | `<span>` | Optional description |
| `.row-meta` | `<span>` | Optional mono destination line |
| `.row-meta.breakable` | | Allows long addresses to break |

### Control and utility

| Class | What it is |
| --- | --- |
| `.theme` | The 2rem bordered toggle — the icon form of Rule 08 |
| `.tsvg` | Its SVG, with `.ring` and `.half` inside |
| `.btn` | The text form of Rule 08. Border never fill; `aria-pressed` deepens it to ink. |
| `.btns` | Flex group for a row of `.btn` |
| `.theming` | Added by script during a theme change only |
| `.vh` | Visually hidden, still read aloud |
| `.skip` | Skip-to-content link |

### Tables

| Class | On | What it is |
| --- | --- | --- |
| `.tablewrap` | `<div>` | Scrolls a wide table inside its column, never the page |
| `.tbl` | `<table>` | Mono, hairlines, 2px ink head rule, no zebra fill |
| `.tbl .num` | `<td>` | Tabular numerals |
| `.tbl .prose` | `<td>` | The one cell allowed to wrap |

### Prose links

Unclassed `<a>` inside `.body`, `.lede` or `.intro` gets the accent treatment.
Every component carries a class, so `:not([class])` separates a link in a
sentence from a link that *is* a component.

---

## Markup

### A complete page

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>A page</title>
  <link rel="stylesheet" href="https://chapbook.page/v1.2.2/chapbook.css">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>

  <header class="wrap bar">
    <a class="brand" href="/">site name</a>
    <div class="bar-end">
      <nav class="barlinks" aria-label="Sections">
        <a href="#one">Section</a>
      </nav>
    </div>
  </header>

  <main class="wrap" id="main">
    <div class="hero">
      <p class="eyebrow">Label</p>
      <h1 class="name">The title</h1>
      <p class="intro">One sentence saying what this is.</p>
      <p class="aside"><b>A lead-in.</b> The page explaining how to read itself.</p>
    </div>

    <section class="blk" id="one">
      <div class="rail">
        <p class="n">01</p>
        <h2>Section</h2>
      </div>
      <div class="body">
        <p class="lede">What this section is for.</p>
        <nav class="index" aria-label="Things">
          <a class="row" href="/somewhere">
            <span class="row-label">Status</span>
            <span class="row-title">The thing</span>
            <span class="row-mark" aria-hidden="true">&rarr;</span>
            <span class="row-desc">What it is.</span>
            <span class="row-meta">where it goes</span>
          </a>
        </nav>
        <p class="small footnote">A closing note.</p>
      </div>
    </section>
  </main>

  <footer class="wrap">
    <div class="foot">
      <b>site name</b>
      <span>A line.</span>
    </div>
  </footer>
</body>
</html>
```

### The theme toggle

Goes inside `.bar-end`. Ships `hidden`; script reveals it.

```html
<button class="theme" id="theme" type="button" hidden>
  <svg class="tsvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle class="ring" cx="12" cy="12" r="8.4" fill="none"/>
    <path class="half" d="M12 3.6 A8.4 8.4 0 0 1 12 20.4 Z"/>
  </svg>
  <span class="vh">Switch theme</span>
</button>
```

Inline `chapbook-theme.js` in `<head>`, before the stylesheet. Fetching it
as a file costs a round trip, and a round trip here is a flash of the wrong
colour on every load for anyone who chose dark.

---

## Building a new skin

1. Copy the three token blocks. Keep all eight names.
2. Pick `--paper` and `--ink` first. Never pure black on pure white.
3. Derive `--muted` and `--faint` by stepping toward the ground. Aim for
   roughly 8:1 and 5:1.
4. `--sunk` sits about 1.07–1.10:1 from `--paper`. Above ~1.15:1 it starts
   reading as a card, which is Rule 02 lost by accident.
5. `--rule` sits about 1.2–1.4:1 from `--paper`.
6. `--accent` must clear 4.5:1. `--accent-deep` is further from the ground in
   light and closer to it in dark.
7. **Measure against the worst-case grain pixel, not against `--paper`.**
8. Lower `--grain` in dark. Light noise on a dark field is more conspicuous
   than dark noise on a light one. This is a judgement and not a
   measurement — nothing fails if the two are equal, and the pair has
   never been tested.
9. **Never mark a token `!important`.** The print block uses it so that ink on
   white beats every palette on the way to paper; a skin that answers in kind
   wins that fight and prints itself. This is Rule 09 lost, and it is checked.

The reference implementation of the measuring is `src/measure.js` in the
source repo, and `build.js` fails the build on a token below AA. The static
checks for Rules 01, 02, 03 and 09 are in `src/rules.js` beside it.

---

## Extending without drift

- **Put additions in a separate stylesheet** loaded after `chapbook.css`.
  Keep the two apart so you can always see what you added. The specimen site
  does exactly this in `specimen.css`.
- **Reuse the tokens.** A new component that hard-codes a colour is a
  component that breaks in dark mode.
- **Obey Rule 02.** If your addition needs a border-radius or a shadow, it is
  probably a card, and the system does not have cards.
- **Do not add a third rule weight** (Rule 03) or a third face (Rule 01).
- **A component earns its place after two builds**, not one. That is why form
  controls and grid utilities are not here — each is a real gap, and neither
  has been built twice. Form controls in particular are the point at which
  this stops being a document system.

**Queued for 1.1.0:** styled tables, a sub-heading inside `.body`, a bordered
text control, lists and blockquotes as components, a container query for the
rail, `forced-colors` support, `::selection` — and **margin notes**, which are
admitted ahead of the two-build rule on purpose. The rail is already half of
that component: Rule 04 is a sticky column carrying mono metadata, and a margin
note is the same column carrying prose. The exception and its reasoning are in
the changelog, because an exception written down is a different object from a
rule that quietly stopped being followed.

## Versioning

- `/v1.2.2/` — exact. Never changes. Cached for a year. Older exact paths stay
  served forever, unchanged.
- `/v1/` — the major line. Picks up additive releases. Cached for a day.
- A **token rename or a removed primitive** bumps the major. Those are the
  only two changes that can break a site downstream.
