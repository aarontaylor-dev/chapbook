# Changelog

What changed, and why. The reasoning is the point — a list of versions with
"various improvements" beside each one is not a changelog.

Versions follow the system, not the site. A **token rename or a removed
primitive** bumps the major, because those are the only two changes that can
break a site downstream. Everything else is additive.

Every section here is a released version. Plans for the next one are kept out
deliberately: this file ships inside the npm tarball, so an "Unreleased"
section is published *as part of* the release above it, where it reads as a
promise the tarball does not keep. Work that is queued rather than shipped
belongs in an issue.

## 1.2.2 — 8 September 2026

The stylesheet's own header said v1.0.1 for three releases. Correcting it is
the whole of the product change — one line of a comment, no rule, no token, no
primitive — and it could not be corrected without cutting this release, because
a shipped file cannot move while its version is tagged. Everything else here
is the machinery that let a version string rot in the open, and the reason it
could.

### The spec now says which of its claims are measured

Rule 04 says `align-self: start` is required and names what happens when it
goes: the rail silently stops moving. The reset in `.body` fails in exactly
that way and the spec never mentioned it. `:is()` takes the specificity of its
most specific argument and outranks the rhythm rule where `:where()` ties and
loses on source order, so swapping one for the other collapses every gap in the
column to zero, in every engine, with no console warning.

This was measured rather than assumed. Three readers given the spec as it stood
and asked to review that swap: one of the three would have merged it.

The second finding was the opposite one, and it is the more useful half. All
three refused a harmless `--grain` change, because "Lower `--grain` in dark"
sits in the skin checklist as an imperative with nothing marking it a
preference. One of them refused on a genuinely good argument — raising dark
grain moves the worst-case pixel, so the documented dark ratios go stale —
which is a reason to re-measure and not a reason to say no. A specification
that cannot tell a measurement from a judgement does not only let bad changes
through. It makes a careful reader refuse changes that were always free,
confidently, and for reasons that sound right.

So the palette ratios are now written down as measurements taken against one
`--paper` on one date and re-measured rather than carried, and the grain split
is named as the untested judgement it is.

An earlier draft marked every claim with a formal witness — measured,
judgement, carried, rejected — in the manner of a critical apparatus. It scored
no better than plain sentences carrying the same facts, so the facts shipped
and the notation did not.

### The version is checked now

Five files name it and nothing read any of them, which is how three of them
came to sit a year behind while the build measured every colour token to two
decimal places. `build.js` fails when `package.json`, `public/system.md`'s
heading or the skill's frontmatter disagree with `src/content.js`, which is the
source because it is what names the frozen directory.

`chapbook.css` is checked only while the version is unreleased. Once the tag
exists the header cannot be corrected without a bump, so failing on it then
would be a build nobody could make pass. This release is the moment that check
was waiting for.

### The freeze guard had never run in CI

It refuses to rewrite a release that is already tagged and published, and it
asks git which versions are tagged. `actions/checkout` fetches no tags, so
every version looked new and the check quietly skipped — for three releases, on
the two paths where rewriting a published file actually matters. It failed
open, which is why nothing broke and nothing said so. `build.yml` and
`release.yml` now fetch tags, as `release-drift.yml` already did.

The frozen-copy check in `build.yml` also built its directory name from
`package.json` while `build.js` names that directory from `src/content.js` —
two files asked the same question, correct only for as long as they agreed, and
nothing verified that they did. It reads the source now.

## 1.2.1 — 7 September 2026

Release plumbing only. `chapbook.css`, `chapbook-skins.css` and
`chapbook-theme.js` are byte-identical to 1.2.0, which is why this is a patch —
and cutting it is itself the test, because the two things fixed below only run
on a tag push and had therefore never run.

### A tag is not a release

`git push --tags` creates a ref and nothing else. For three versions this
repository had tags, published packages and a deployed site, and a Releases
page holding one entry made by hand for v1.0.1 — which still described itself
as the latest, eight months of work later. Nothing was broken. There was
simply nothing there, which is why nothing caught it.

`release.yml` now opens the Release itself, after the publish rather than
before: a Release announcing a version that failed to reach the registry is
worse than no Release, because it is a link people follow to something that is
not there. Notes come from `--notes-from-tag`, so the annotated tag's message
is the release notes verbatim and the two cannot drift. That makes the tag
having a message a requirement rather than a courtesy, and the workflow header
and README both say so now.

The workflow's `contents` permission goes from `read` to `write`, which buys
exactly one thing: the Release object. The tag already exists by the time it
runs, and nothing in it pushes code.

### The notes were wrapped for the wrong reader

The first version of this used `gh release create --notes-from-tag`, which
passes the tag message through unchanged, and the two formats disagree about
newlines.

A git tag message is hard-wrapped near 76 columns because it is read in a
terminal by `git show`, which does not reflow. GitHub renders a release body
as Markdown with hard line breaks **preserved** — a single newline becomes a
`<br>`. So a message wrapped for the terminal arrived on the releases page as
ragged forced breaks at a width the reader never chose, and every release read
as though it had been typed into a narrow box. The tag also opened by naming
itself, directly under a title that already did.

Neither format is wrong; they are for different readers.
`scripts/release-notes.js` translates between them — dropping the redundant
title line, joining wrapped prose so the browser can wrap it instead, and
leaving lists, quotes, tables and fenced code alone, because their line breaks
mean something. The four existing releases were reflowed through it.

The workflow now fails outright on a lightweight tag rather than opening an
empty Release, since the notes have nowhere else to come from.

### The drift guard checks for a Release too

`release-drift.yml` gains the same check. It verified the tag and the registry
and would have gone on passing forever with an empty Releases page, so it now
fails on a missing Release too, and its failure summary prints the one-line
`gh release create` when the tag and the package are the halves that already
exist.

## 1.2.0 — 7 September 2026

The components release, finally. Every name below is new; nothing was renamed
and nothing was removed, which is what makes this a minor rather than a major.

### Margin notes

**Admitted ahead of the two-build rule, and the exception is recorded rather
than quietly made.** They exist on Working Notes and nowhere else, so by the
rule that kept v1 small they should still be waiting.

The argument for going early is that almost none of it is new. Rule 04 is
already a sticky column beside the content carrying mono metadata; a margin
note is the same column carrying prose. The grid, the stickiness, the
`align-self: start` that makes it work at all and the collapse below 52rem are
built, shipped and documented. What was missing was a second tenant for
machinery the system already carries — a much weaker claim on the system's
size than tables or form controls, each of which would be new machinery.

The rule still stands for everything else.

### Tables, and the text control

Both existed in `specimen.css` and were therefore not part of anything anyone
could take. Promoted into the system, which is the whole difference between a
component and a thing one site happens to do.

`.tbl` is hairlines and one 2px ink head rule, with no zebra fill — the system
has one fill and it is the row hover, so a striped table would be the second,
and a second fill is how a system starts drawing cards without noticing.

`.btn` is the text form of Rule 08, which had shipped half-built since v1.0.0:
`.theme` was the icon form and lived in the system, while the text form lived
in the specimen as `.skinbtn`. A border, never a fill, and `aria-pressed`
deepens it to ink rather than filling the box.

### A sub-heading, lists and quotations

An `<h3>` arrived at 19.89px against 17px body text at the same weight, which
is a difference no reader sees — a heading in the markup and not on the page.
Mono and tracked instead, matching the rail's own heading, because a
sub-heading names the part of the document you are in rather than saying
something. One treatment, not a scale; a scale is the beginning of a framework.

Lists get `--faint` markers, because a bullet is punctuation rather than
content. A blockquote gets the document weight on its left and nothing else —
no fill, no italic.

### The rail collapses on its own width

`.wrap` is now a container, so `.blk` responds to the width of the column it
is in rather than the window's. The media query measured the viewport, so a
`.wrap` dropped into a 24rem sidebar on a wide screen kept a 10rem rail beside
14rem of content and the text stopped being readable.

Both are kept, deliberately. The media query is the floor for browsers without
container queries, and the two agree at the same 52rem, so no browser gets a
different layout — only a less precise reason for it.

### forced-colors and prefers-contrast

The gap that sat least comfortably beside Rule 07. A system that fails its own
build over 4.5:1 had nothing at all to say about Windows High Contrast, where
the user has replaced the palette outright and every token in the table stops
applying.

Three things this system does are exactly what forced colours disturb, and
each is addressed rather than left to luck: the grain is a background image
over content in a mode that exists to remove decoration, so it goes off; the
row's hover hairline is a background on a pseudo-element rather than a border,
so forced colours leaves it whatever it was and it is repainted in
`CanvasText`; and the controls take `ButtonBorder`, `ButtonText` and
`Highlight` so a forced palette can paint them rather than guess.

`prefers-contrast: more` drops the grain and moves the tuned-for-calm tokens
to the ends of their range.

### ::selection

Two declarations from existing tokens. The browser's default blue was the one
colour on the page the palette had not chosen.

### The freeze guard was firing on work in progress

Found by using it. 1.1.0's guard compared the working files against
`public/vX.Y.Z/` and refused if they differed — but the first build of an
*unreleased* version writes that directory, so every build after the first one
during development failed. That is not drift, it is work, and a guard that
goes red while a release is going right is the fastest way to teach someone to
stop reading it.

Only a released version is immutable, and the tag is what releases: the tag is
what `release.yml` triggers on. The guard now checks for `v<version>` before
comparing, and skips silently when git cannot be reached rather than failing a
build over a missing tool.

### Print treatment for what was promoted

`.tbl` and `.btn` were moved into the system, and their print rules were left
behind in `specimen.css` — so anyone linking `chapbook.css` alone got a table
that clipped at the page edge and a button that printed as an empty box.
Both now print from the system: controls are hidden alongside `.theme`, tables
wrap instead of scrolling, and rows and margin notes are kept whole.

## 1.1.1 — 7 September 2026

Documentation only. No CSS changed, no class name added or removed, and the
three shipped files are byte-identical to 1.1.0 — which is why this is a patch.

### Rule 05 said more than it meant

**"One row anatomy, everywhere."** The body never matched the title. Every
clause of it is about a link: the row *is* the anchor, the mark points at a
destination, the hover is navigational affordance, and `↗` against `→`
distinguishes leaving the site from staying on it. The rule governs the index
row. The word *everywhere* claimed the whole page.

That gap cost a full review pass. `.forrow`, added to the specimen in 1.1.0,
was flagged as a possible violation, and only re-reading the rule's body
settled that it is outside the rule's scope rather than an exception to it —
the same standing `.rule` has held since v1.0.0 without anyone calling it a
breach. A rule whose name has to be argued past is a rule that will be
re-derived by whoever reads it next.

Now **"One row anatomy, and the row is a link."** `system.md` gains a section
saying what the rule covers and, more usefully, what it does not: the rule is
that there is *one* such anatomy, not that every repeated block must adopt it.

### The audit was pointing at the wrong hole

`audit.js` warned that its row count matches `.row` only, and told the reader
to look at "the repeated structures this table does not name" — which, under
the corrected scope, are not violations and never were. The genuine blind spot
is narrower and worth stating precisely: **a second link row built without the
`.row` class** is navigational, in scope, and reported as nothing.

`skill/chapbook/AUDIT.md` gains a scope gate ahead of its rubric, so an agent
settles what is in scope before it starts scoring rather than after.

## 1.1.0 — 7 September 2026

The additive release, and it turned out not to be about components at all.
Rule 09 was half a rule, the anti-goals were missing, and the frozen version
directories were being quietly rewritten on every build. The component queue
was held rather than allowed to delay any of that.

### The sheet is set

**Rule 09 was half a rule.** v1.0.1 proved the print palette wins the cascade,
which was a real bug and worth catching. It said nothing about whether the page
was *typeset* — so a document could pass every check the build had and still
come off the printer with a heading stranded at the foot of a sheet, a
paragraph leaving one line behind, and a margin decided by whichever print
dialogue the reader happened to open.

Three declarations, each owning a decision the stylesheet was handing to the
browser:

- **`@page { margin: 18mm }`**, outside `@media print` because `@page` only
  ever applies to paged media. The margin is the most consequential
  measurement on a sheet and it was the one nobody was making. Left unset it is
  a per-installation default, which means the same document printed in two
  offices is set two different ways — precisely the outcome a system like this
  exists to prevent.
- **`orphans: 3; widows: 3`** on `p`, `li`, `dd` and `blockquote`. Three is the
  conventional floor: two admits a stranded pair that still reads as broken,
  four starts pushing whole paragraphs across for one line.
- **`break-after: avoid`** on `h1`–`h4`. A heading at the foot of a sheet with
  its section overleaf has stopped doing its job.

`src/rules.js` grows `checkPaged()`, and the build now fails on a stylesheet
that claims Rule 09 while leaving the page unset. Presence is checked rather
than value — 18mm is a judgement a fork may reasonably disagree with; declaring
nothing is not a judgement. The build also reports the sheet on every run, next
to the contrast measurements, because the sheet is a measurement too.

### What it is for, and what it is not

The specimen gains a first section, and the anti-goals are the half that was
missing. "Not a framework, no JavaScript, no utility classes" describes what
the file does not contain, which is a different question from *who should not
use this* — and leaving the second unanswered means the wrong people arrive,
ask for cards and form controls, and conclude the system is unfinished rather
than aimed somewhere else.

Stated plainly now: not for applications, not for looking unique, not for teams
wanting configuration, not a brand. The name settles it. A chapbook was a
distribution technology and not a look — standard formats, shared stock, no
design per title, cheap enough to give away. Looking distinctive was never
among its aims and it is not among these.

### A colophon

`/colophon` — the note at the back saying who set the thing, in what, and on
what. A real convention of the object this system is named after, and the
natural home for the facts true of the whole system rather than of any one
section: the faces, the sheet, every measured contrast floor, the licence.
Generated, so none of its numbers can go stale.

### The audit — the third part that was never written

The README has said since v1.0.0 that rules 04, 05 and 08 are "the skill's
job. Six here, three there." The third part did not exist. `audit.js` is it.

It splits a built page into sections and reports two kinds of thing, and never
mixes them. **Problems** are decidable — a section with no rail, two row
anatomies in one list, a `<button>` carrying no bordered class, an inline
style with a radius — and they exit non-zero. **Evidence** is not: whether a
row's label is honest, whether a control earned its border, whether the number
on a rail means anything. That needs a reader, and pretending otherwise would
be the theatre the build's own comments refuse.

`skill/chapbook/AUDIT.md` carries the rubric and a 0-3 scale, so two agents
scoring the same page are held to the same standard. `npm test` now runs both.

It found something immediately, on a page written the same afternoon: the new
colophon numbered three sections that are peers. The setting, the
measurements and the licence can be shuffled without loss, and numbering them
dressed them as a sequence. The numbers are gone.

### The social card

`build.js` reads `public/og.png`, checks the PNG header for 1200×630 and emits
the `og:image` tags. The card *type* is conditional on the file existing:
`summary_large_image` promises an image, and a page claiming it while serving
none renders as a broken panel on some networks and degrades silently on
others. The claim and the asset now come from one fact and cannot drift. A
missing card is reported and the build continues; a wrong-shaped one fails it.

The asset itself is not in this release — the slot is.

### The favicon has a dark palette

`public/favicon.svg` declared one ground, `#fcfcfc`, so on a dark browser tab,
in dark GitHub and in every dark-mode bookmark bar it rendered as a white
block. It now carries both palettes behind `prefers-color-scheme`. Verified
under the site's real Content-Security-Policy, where an SVG loaded as an image
turns out not to be subject to the response policy — the inline `<style>`
applies.

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
