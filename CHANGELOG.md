# Changelog

What changed, and why. The reasoning is the point — a list of versions with
"various improvements" beside each one is not a changelog.

Versions follow the system, not the site. A **token rename or a removed
primitive** bumps the major, because those are the only two changes that can
break a site downstream. Everything else is additive.

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

### Token names

Standardised on the names weindie.com already shipped: `--paper`, `--sunk`,
`--rule`, `--ink`, `--muted`, `--faint`, `--accent`, `--accent-deep`.

aarontaylor.me was the outlier, using `--bg`, `--grey` and `--grey-soft` and
having no accent tokens at all. It has been migrated. Two of the three sites
already agreed, so the names were discovered rather than invented — which is
the only reason it is safe to freeze them in a v1.

### What ships

- `plain-text.css` — the system. Tokens, primitives, components, print.
- `plain-text-skins.css` — two worked palettes, from real sites.
- `plain-text-theme.js` — the theme bootstrap, 24 lines.
- `system.md` and `llms.txt` — the specification, for people and for agents.
- `skill/plain-text/` — the same system as an agent skill.

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
