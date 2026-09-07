# Changelog

What changed, and why. The reasoning is the point — a list of versions with
"various improvements" beside each one is not a changelog.

Versions follow the system, not the site. A **token rename or a removed
primitive** bumps the major, because those are the only two changes that can
break a site downstream. Everything else is additive.

## Unreleased — 1.1.0

The additive release. 1.0.1 was fixes only and added no class names; this is
where the components go, and `/v1/` picks it up without anyone changing a
`<link>`.

### Margin notes

**Admitted ahead of the two-build rule, deliberately.** They exist on Working
Notes and nowhere else, so by the rule that kept v1 small they should still be
waiting. Recording the exception rather than quietly making it:

The rail is already half of this component. Rule 04 is a sticky column beside
the content carrying mono metadata; a margin note is the same column carrying
prose. The structural work — the grid, the stickiness, the `align-self: start`
that makes it work at all, the collapse to a line above the content below 52rem
— is built, shipped and documented. What is missing is a second thing to put in
a column that already exists.

That is the difference between this and the other held-back components. Tables
and form controls would each be new machinery. This is a second tenant for
machinery the system already carries, which is a much weaker claim on the
system's size, and the two-build rule exists to police size.

The rule still stands for everything else. An exception that is written down,
with its reasoning, is a different object from a rule that quietly stopped
being followed.

### The rest

Each of these reached two builds honestly, most of them across `specimen.css`
and the v1.0.1 review page.

- **A sub-heading inside `.body`.** An `<h3>` currently measures 19.89px at
  weight 400 against 17px body text, which is a difference no reader sees. One
  class, not a scale — a scale is the beginning of a framework.
- **Tables.** Held at one build in v1.0.0 with the note that the specimen
  styled them in its own stylesheet. That was right then. Hairlines only, a 2px
  ink head rule, and no zebra fill, because the system has one fill and it is
  the row hover.
- **A bordered text control.** Rule 08 describes the pattern and ships half of
  it: `.theme` is the icon form and lives in the system, `.skinbtn` is the text
  form and lives in `specimen.css`. Pressed state is a border in ink.
- **Lists and blockquotes as styled components.** v1.0.1 fixed their spacing
  inside `.body` but gave them no treatment of their own.
- **A container query for the rail.** The 52rem collapse is measured against
  the viewport, so the rail stays a 10rem column inside a 24rem sidebar. Add
  `@container` alongside the media query rather than replacing it.
- **`forced-colors` and `prefers-contrast`.** The gap that sits least
  comfortably beside Rule 07. A system that fails its own build over 4.5:1 has
  nothing to say about Windows High Contrast, where the grain overlay, the
  hairline redraw on `.row::after` and the 1px borders are exactly what forced
  colours disturb.
- **`::selection`.** Two declarations from existing tokens. Currently the
  browser default blue is the one colour on the page the palette did not
  choose.

### Still held

- **Form controls.** No site in the family has a form, and a control set is
  where this stops being a document system.
- **Grid utilities.** The system has one layout. A second is a framework.

## 1.0.1 — 7 September 2026

A review release. No new class names, no new components, and four more rules
turned from prose into tests.

### Why a patch and not a minor

The review that produced this release found five component gaps that the
"earns its place after two builds" rule would arguably now admit — tables, a
sub-heading, a bordered text button. None of them shipped here.

A patch that adds five primitives teaches every downstream reader that the
version number does not mean anything, and `/v1/` picks up additive releases
automatically, so there was no distribution reason to smuggle components into
a patch. The distinction between a patch and a minor was undefined in v1.0.0.
It is defined now: **a patch fixes what is already claimed; a minor adds what
is not.** The components are queued for 1.1.0.

### Rule 09 was false for the entire life of v1.0.0

The serious one. `@media print` redefines the palette on `:root`, and a media
query does not change specificity — so the print block scored (0,1,0) and lost
to `:root[data-theme="dark"]` and to every skin selector at (0,2,0).

Measured in a browser, with the print block evaluated as written:

| Root state | `--ink` on paper | Rule 09 |
| --- | --- | --- |
| no attributes | `#000` | held |
| `[data-theme="dark"]` | `#ededed` | failed |
| `[data-skin="green"]` | `#16181a` | failed |
| `[data-skin="clay"]` + dark | `#ece7dc` | failed |

Browsers do not print background colours by default, so `--paper` mostly did
not matter. `--ink` did: a reader who chose dark and pressed print got
`#ededed` body text on white paper, at about 1.1:1. An effectively blank page.
Two of the three documented skins failed it in **light** mode too.

The specimen was affected. `demo.js` sets `data-skin` on the root when a
visitor picks green or clay, so chapbook.page itself printed in screen colours
— the system documenting itself, breaking its own ninth rule, for eight months,
on the page whose whole job is to demonstrate the rules.

Every token in the print block now carries `!important`. Raising the selector
to (0,3,0) would have worked that day and broken again the first time a skin
added a third attribute; `!important` is the one mechanism specificity cannot
outrank, which makes it the correct tool rather than a shortcut. The block has
to beat every palette that will ever be written against this system, including
palettes that do not exist yet.

The corollary is now documented and checked: **a skin must never mark a token
`!important`**, because it would win that fight and print itself.

### Two rules were false by default

Not bugs in anything written — bugs in what was *not* written.

- **Rule 01.** `monospace` is a keyword, not a face. An unstyled `<code>`
  rendered in whatever mono the browser nominated, at whatever size it
  nominated — a second monospace, on a page whose first rule is that the mono
  is the constant. `code`, `kbd` and `samp` now take `var(--mono)` at `0.9em`.
- **Rule 03.** The UA draws `<hr>` as an inset border in a grey the palette
  never chose. That is a third rule weight, arriving in a system whose whole
  claim is that it has two. `<hr>` is now one 1px `--rule` hairline.

Both are three or four declarations. Neither is a component. Each is a sentence
in the specification becoming true.

### The reset was larger than the documentation said

The README, the stylesheet header and system.md all said "no reset beyond
`box-sizing`". The base layer also set `p { margin: 0 }`, `margin: 0` and
`font-weight: 400` on `h1`–`h4`, `color: inherit` on `a`, smooth scrolling on
`html`, and six declarations on `body`.

The code is fine and has been left alone — scoping the reset now would change
rendering on every existing build, which is a minor rather than a patch. The
sentence was wrong, so the sentence changed. All three documents now carry the
full list.

The reachable consequence was fixed: `p { margin: 0 }` is global but the
compensating `.body > * + *` only reaches direct children, so two paragraphs
inside a `<blockquote>` or an `<li>` measured a **0px** gap and ran together
into one block.

### The vertical rhythm was asymmetric

`.body > * + *` sets the top margin only, and beat the UA stylesheet while
leaving its bottom margin in place. A `<ul>` in `.body` carried 21.6px above
and 17px below, so a list closed at 38.6px and opened at 21.6px. Blockquotes
and figures did the same and additionally sat on a 40px UA indent — px, in a
system whose token table says rem everywhere.

The UA's contribution is now zeroed inside `.body` and the rhythm rule is the
only thing that spaces the column. `:where()` rather than `:is()` does it, and
that detail is load-bearing: `:is()` carries the specificity of its most
specific argument, which would have scored (0,1,1), beaten the rhythm rule at
(0,1,0) and collapsed every gap in the column to zero. `:where()` contributes
nothing, so the reset ties and loses on source order, which is what a reset
should do.

### Four more rules are now enforced by the build

The pattern behind every defect above: **the two rules the build enforced were
the two rules that had not broken.** Rules 06 and 07 were code. Rule 09 was a
comment, and it was false on the system's own website for eight months because
nothing was looking.

`src/rules.js` adds four static checks, and `build.js` exits non-zero on any of
them exactly as it does for a failing contrast ratio:

| Rule | Check |
| --- | --- |
| 01 | Every `font-family` is one of the three face tokens |
| 02 | No `border-radius`, no `box-shadow` |
| 03 | Border widths are 1px or 2px, and 2px only ever with `var(--ink)` |
| 09 | The print palette beats every rival declaration, by specificity or by `!important` |

Three of the four passed on the day they were written. That is the point rather
than an anticlimax: they cost nothing now and they catch the edit that would
otherwise cost an afternoon in a year. The Rule 09 check reports 70 problems
against the v1.0.0 stylesheet, naming all eight rival selectors.

Rules **04, 05 and 08** are about markup and meaning — whether a rail sticks
beside its content, whether every list on a site shares one row anatomy,
whether a control that *does* something is bordered. None of it is visible in a
stylesheet and a check that pretended otherwise would be theatre. They stay
with the skill. **Six enforced by the build, three by the skill, nine
accounted for.**

### `light-dark()` was considered and declined

Rule 06 exists for one reason: CSS could not express two themes in one
declaration, so the palette is written three times and the build diffs the
copies. `light-dark()` reaches Baseline widely available on 13 November 2026
and would collapse that to one declaration per token.

Declined, for now, and worth recording why. The triple declaration looks like
redundancy but it is *checked* redundancy, and a checked redundancy costs
nothing. Adopting `light-dark()` would delete the rule and its test together,
in exchange for a fallback cliff — below Safari 17.5 an unsupported value
leaves the token unset and the page unreadable. For a file whose entire pitch
is "vendor this, it will outlive my domain", boring CSS is a feature.

It would halve the work of authoring a skin, which is real. It is not worth
trading a loud build failure for a silent rendering one. Revisit for 2.0.

### Also

- `text-rendering: optimizeLegibility` removed from `body`. A long-standing
  footgun rather than a bug — it forces kerning and optional ligatures across
  the whole document, has a history of layout and performance regressions, and
  gained nothing the browser was not already doing at these sizes. It was the
  one line in the file that was a habit rather than a decision.
- The line count in the header, the README and llms.txt said "about 500 lines"
  and asked the reader to read all of them. The file was 875. The instruction
  is the point, so the number should be right; the build now prints the real
  count on every run.
- `_headers` no longer hard-codes `/v1.0.0/*`. The build discovers every frozen
  directory on disk and emits an immutable block for each, so the release that
  adds a version cannot forget the line that caches it.
- `/v1.0.0/` is untouched and still serves the original bytes, as promised.

## 1.0.0 — 7 September 2026

The first written form of a system that had been running, undocumented, on two
sites for months.

### Why now

It existed as CSS comments in two repositories — good comments, better than
most style guides, but only inside the files that implemented them. The two
copies had already drifted:

- `--rail` was `9rem` on one site and `154px` on the other.
- The gutter clamps disagreed: `clamp(1.25rem, 5vw, 2.5rem)` against
  `clamp(20px, 4vw, 44px)`.
- One site was rem throughout and the other px throughout.

Nothing was broken. It just meant there was no answer to "what is the rail
width", and a third build was about to be done by eye.

### The reconciliation

| Token | Was | Now |
| --- | --- | --- |
| `--gut` | `clamp(1.25rem, 5vw, 2.5rem)` / `clamp(20px, 4vw, 44px)` | `clamp(1.25rem, 5vw, 2.75rem)` |
| `--rail` | `9rem` / `154px` | `10rem` |
| `--wrap` | `60rem` / — | `62rem` |
| `--measure` | — | `34em` |
| units | rem / px | rem everywhere |

### The name

A chapbook was a small, cheaply printed booklet sold by pedlars — plain type,
cheap paper, no ornament, bought for a penny and passed on. The system is the
same object: small, plainly set, and meant to be taken.

The working name during the extraction was "Plain Text System", which was
wrong in a way worth recording. "Plain text" means *unformatted*, and this is
the most typographically opinionated thing in the family — three ink weights, a
display face, tracked mono at four sizes, a grain overlay and a measured
palette. The name described the restraint and denied the craft.

It also failed the test in note 002: a name is a filter on what can join the
thing later, and "plain text" filters out anything visually considered, which
the system already is.

Ruled, hairline and house style were the runners-up, and all three lost for one
reason: each is a phrase somebody might reasonably type meaning something else.
"Hairline" is an established CSS technique, "ruled" is an ordinary adjective,
and "follow the house style" already means an organisation's own conventions.
A name that doubles as an instruction cannot work as a retrieval key — which
matters more than usual here, because half the intended audience is agents.

### Token names

Standardised on the names weindie.com already shipped: `--paper`, `--sunk`,
`--rule`, `--ink`, `--muted`, `--faint`, `--accent`, `--accent-deep`.

aarontaylor.me was the outlier, using `--bg`, `--grey` and `--grey-soft` and
having no accent tokens at all. It has been migrated. Two of the three sites
already agreed, so the names were discovered rather than invented — which is
the only reason it is safe to freeze them in a v1.

### What ships

- `chapbook.css` — the system. Tokens, primitives, components, print.
- `chapbook-skins.css` — two worked palettes, from real sites.
- `chapbook-theme.js` — the theme bootstrap, 24 lines.
- `system.md` and `llms.txt` — the specification, for people and for agents.
- `skill/chapbook/` — the same system as an agent skill.

### Decisions worth recording

**System font stacks are the default.** A system that ships pointing at
`/fonts/something.woff2` is not stealable; it is a copy of one site.
Self-hosting is a documented upgrade, not the starting position.

**The neutral skin collapses `--accent` onto `--ink`.** A monochrome page has
no hue to spend, so a link announces itself by decoration. The token still
exists because it is part of the contract, and a coloured skin separates the
two.

**The build measures contrast and fails on AA.** Rule 07 said the measurement
should be written down. Writing it down by hand means it is right on the day
it is written and slowly stops being true. `build.js` recomputes every ratio
from the shipped stylesheet and exits non-zero below 4.5:1, so a failing token
cannot reach the site and the published table cannot go stale.

**The build also checks Rule 06.** The dark palette is declared twice — once in
a media query, once on an attribute — and nothing in CSS makes the two agree.
A value edited in one and not the other gives a site whose toggle disagrees
with its own system preference, which is close to undebuggable by eye. It is
now a build error.

**Contrast is measured against the worst-case grain pixel.** Not against
`--paper`. The grain overlay sits between the text and the page and moves the
surface toward the text in both themes, so a ratio taken against the flat
ground flatters itself. This closed the one measurement the original design
review had left open: clay's `--faint` in dark comes out at 4.92:1 — clearing
AA, and the tightest number anywhere in the system.

### Deliberately not in v1

Each of these is a real gap. None has been built twice, and the rule that
keeps the system small is that a component earns its place after two
independent builds rather than one.

- **Margin notes.** The obvious next component. They exist on Working Notes
  and are worth keeping. One build.
- **Tables as a styled component.** The specimen needed them and styled them
  in its own stylesheet, which is the recommended pattern and also the
  evidence that they are not yet system-wide.
- **Form controls.** No site in the family has a form.
- **Grid utilities.** The system has one layout — the rail — and adding a
  second would be the beginning of a framework.
