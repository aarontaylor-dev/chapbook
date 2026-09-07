# Chapbook

A small CSS system for documents that want to read like documents.

**Monospace carries structure, a second face carries language, and separation
comes from rules and space rather than from cards.**

- **Specimen:** <https://style.aarontaylor.me>
- **Spec:** <https://style.aarontaylor.me/system.md>
- **For agents:** <https://style.aarontaylor.me/llms.txt>

MIT. Take it, change it, no credit needed.

## Use it

```html
<link rel="stylesheet" href="https://style.aarontaylor.me/v1.0.0/chapbook.css">
```

Or vendor it, which is better — one request less, it survives this domain
disappearing, and you can edit it, which you are meant to do:

```bash
curl -O https://style.aarontaylor.me/chapbook.css
```

Or from npm — published from CI with
[provenance](https://docs.npmjs.com/generating-provenance-statements), so the
tarball is cryptographically tied to the commit that built it:

```bash
npm i chapbook
```

There is no build step, no configuration and nothing to initialise. Link one
file and use the class names. The complete list is in
[system.md](public/system.md), and it is exhaustive.

## What it is not

Not a framework and not a component library. No JavaScript requirement, no
utility classes, no reset beyond `box-sizing`. It styles a named set of
components and leaves the rest of the document alone, deliberately, so it can
be dropped into an existing page without a fight.

It has no cards, no form controls and no grid utilities. If you want those,
this is the wrong system rather than one that needs configuring.

## The nine rules

The rules are the system; the CSS is only their implementation.

1. **Two faces, and the mono is the constant.** If a piece of text tells you
   *what kind of thing* you are looking at, it is mono. If it *says something*,
   it is the language face.
2. **No cards.** No radius, no shadow, no container fill. One fill in the whole
   system, at about 1.07:1.
3. **Two weights of rule.** 1px separates peers; 2px opens and closes the
   document. Never a third.
4. **The numbered rail.** Sticky left column, content on the right.
5. **One row anatomy, everywhere.**
6. **Tokens declared three times**, so system-default, explicit light and
   explicit dark all resolve.
7. **Contrast is measured, and the measurement is written down** — against the
   worst-case grain pixel, not the flat background.
8. **A bordered control, not another word in a row of words.**
9. **It prints.**

Long form: [system.md](public/system.md).

## The build measures the system

`build.js` does three things, in order of how much they matter:

1. **Measures.** Every colour token in every skin, against the worst-case grain
   pixel. A text token below WCAG AA **exits non-zero**. Rule 07 is a test
   rather than a comment, so a failing token cannot reach the site and the
   published table cannot drift from the CSS it describes.
2. **Checks Rule 06.** The dark palette is declared twice and nothing in CSS
   makes the two agree. A value edited in one and not the other is close to
   undebuggable by eye, so it is a build error.
3. **Renders** the specimen, the 404, the frozen version directories, and
   `_headers` with the inline script hashes.

```bash
node build.js
```

```txt
  system   v1.0.0
  measure  neutral light surface #f5f5f5  tightest 5.27:1  sunk 1.07:1  AA
  measure  neutral dark  surface #161616  tightest 5.24:1  sunk 1.07:1  AA
  measure  green   light surface #fbfaf7  tightest 4.97:1  sunk 1.09:1  AA
  measure  green   dark  surface #121412  tightest 4.99:1  sunk 1.09:1  AA
  measure  clay    light surface #f5f3ee  tightest 5.06:1  sunk 1.10:1  AA
  measure  clay    dark  surface #181613  tightest 4.92:1  sunk 1.08:1  AA
```

No dependencies. Node's standard library and nothing else.

## Layout

```txt
chapbook.css          THE PRODUCT — tokens, primitives, components, print
chapbook-skins.css    two worked palettes, from real sites
chapbook-theme.js     the theme bootstrap, 24 lines

build.js                measures, checks, renders
src/
  measure.js            the contrast maths and the CSS token reader
  content.js            the nine rules and the specimen's copy
  page.js               the specimen template
  demo.js               the skin picker — specimen only
  headers.txt           _headers template, with slots for the script hashes
skill/chapbook/       the same system as an agent skill
public/                 the deployed site
  index.html            generated
  system.md             the specification — hand-written
  llms.txt              the short brief for agents — hand-written
  specimen.css          the specimen's own CSS, and nothing else's
  v1/  v1.0.0/          frozen copies, written by the build
```

Generated files are committed, so a deploy or a local static server works
whether or not the build has been run, and a template change shows up as a
reviewable diff rather than as a mystery at deploy time.

## Local preview

```bash
node build.js && python3 -m http.server 4400 --directory public
```

Then <http://localhost:4400>. A static server does not apply `_headers`, so
the CSP is only exercised on Pages.

## Versioning

- `/v1.0.0/` — exact. Never changes. Cached for a year.
- `/v1/` — the major line. Picks up additive releases. Cached for a day.

A **token rename or a removed primitive** bumps the major. Those are the only
two changes that can break a site downstream; everything else is additive.

[CHANGELOG.md](CHANGELOG.md) records why a thing changed, not only that it did.

## Why "Chapbook"

A chapbook was a small, cheaply printed booklet sold by pedlars from the
sixteenth century onward — plain type on cheap paper, no ornament and no gilt,
bought for a penny and passed on. It is the democratised print object: made to
be cheap, read, and given away.

That is the whole brief for this system, including the licence. It is small,
it is plainly set, it has no ornament, and you are meant to take it.

The name is also deliberately *not* an instruction. "Ruled", "hairline" and
"house style" were all considered and all rejected for the same reason: each
is a phrase you might reasonably type at an agent meaning something else
entirely. A name that doubles as an ordinary instruction cannot work as a
retrieval key.

## Where it came from

It was running on two sites before it was written down — [aarontaylor.me](https://aarontaylor.me)
and [weindie.com](https://weindie.com) — as CSS comments in two repositories
that had already drifted from each other. v1 reconciles them and freezes the
result. [notes.aarontaylor.me](https://notes.aarontaylor.me) is the third
build, and the first one that did not have to be ported by eye.

## Who made this

Built by **Aaron Taylor** — an engineer in Norfolk, UK, working across
front-end systems, product engineering, AI workflows and internal tools.

- [aarontaylor.me](https://aarontaylor.me) — an index of what I am building
- [github.com/aarontaylor-dev](https://github.com/aarontaylor-dev) — the code
- [notes.aarontaylor.me](https://notes.aarontaylor.me) — working notes
- [hi@aarontaylor.me](mailto:hi@aarontaylor.me)

MIT, and the licence means it: take it, change it, ship it, no credit needed.
If you build something with it I would like to see it, but that is a wish
rather than a condition.
