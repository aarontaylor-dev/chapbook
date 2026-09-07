---
name: chapbook
description: Build or review a web page in the Chapbook — monospace carries structure, a second face carries language, and separation comes from rules and space rather than from cards.
license: MIT
metadata:
  version: "1.0.0"
  source: https://style.aarontaylor.me
---

# /chapbook

**Does this page follow the system, or does it just resemble it?**

The Chapbook is nine rules and about 500 lines of CSS. The rules are
the system; the CSS is only their implementation. A page can link the
stylesheet and still be off-system — cards creep in, a third rule weight
appears, a sans-serif starts doing the monospace's job — and none of that
shows up as an error.

This skill builds a page inside the system, or checks an existing one against
it.

## Useful when

- Building a site, page or document that should read like a document.
- A page links `chapbook.css` but does not look like the specimen.
- Adding a component the system does not have, without forking it.
- Choosing a palette, and needing the contrast to be right rather than close.
- Porting an existing design onto the system.

## Probably not needed when

- The project already has a design system it is committed to.
- The work is an application UI rather than a document. This system has no
  form controls, no modals and no data grid, and pretending otherwise
  produces a worse result than picking something else.
- You want a card layout. The system does not have cards, and adding them is
  not a customisation — it is a different system.

## The nine rules

**01 — Two faces, and the mono is the constant.** One monospace sets every
label, number, address, breadcrumb, button and footer line. A second face
carries the language. The test: if a piece of text tells you *what kind of
thing* you are looking at, it is mono, uppercase and tracked. If it *says
something*, it is the language face. There is no third face.

**02 — No cards.** No radius, no shadow, no container fill. Objects are
separated by a hairline and by space. The only fill is the row hover at about
1.07:1 — felt rather than seen. The one exception is a code field.

**03 — Two weights of rule.** 1px `--rule` separates peers. 2px `--ink` opens
and closes the document: under the masthead, above the first block, above the
footer. Never a third weight.

**04 — The numbered rail.** A sticky left column carrying a number and a mono
section name, content on the right. `align-self: start` is required, or it
silently does not stick.

**05 — One row anatomy, everywhere.** Mono label, display title, mark, optional
description, optional mono destination. The whole row is the link. `↗` leaves
the site, `→` stays.

**06 — Tokens declared three times.** `:root`, then the dark media query
guarded with `:not([data-theme="light"])`, then `[data-theme="dark"]`. Never
style a component inside those blocks.

**07 — Contrast is measured, and the measurement is written down.** Against the
worst-case grain pixel, not the flat background. Text clears 4.5:1. Never pure
black on pure white.

**08 — A bordered control, not another word in a row of words.** A control that
*does* something gets a border; a link that only *goes* somewhere does not. A
pressed state is a border in ink, never a fill.

**09 — It prints.** Ink on white, controls gone, structural blocks kept whole,
`href` expanded after content links.

## How to build a page

1. **Link the stylesheet and nothing else.**
   `https://style.aarontaylor.me/v1.0.0/chapbook.css`, or vendor the file.
2. **Use only the documented classes.** They are listed in `system.md` and the
   list is exhaustive. An invented class name is the first sign of a fork.
3. **Structure before colour.** Masthead, hero, numbered blocks, index rows,
   footer. Get the three ink rules in place first — they are what makes the
   page read as this system at a glance.
4. **Decide each piece of text by Rule 01** before styling it. Most mistakes in
   this system are a label set in the language face.
5. **Add what the system lacks in a separate stylesheet**, loaded after it.
   Never edit the base file to add a component.
6. **Check it in dark, at 375px, and on paper** before calling it done. All
   three are real targets, and the print one is the one everybody skips.

## How to review a page

Work through the rules in order and report per rule. The common failures, in
the order they actually turn up:

- A sans-serif or the language face doing the monospace's job on labels, nav,
  meta lines or buttons. **Rule 01.**
- `border-radius` or `box-shadow` anywhere. **Rule 02.**
- A third rule weight, or a 2px rule used between peers. **Rule 03.**
- A rail that does not stick, because `align-self: start` is missing.
  **Rule 04.**
- Rows that vary between sections, or a mark that points the same way whether
  or not the link leaves. **Rule 05.**
- Dark declared once instead of twice, or a component styled inside a theme
  block. **Rule 06.**
- Contrast measured against `--paper` rather than the worst-case grain pixel,
  or not measured at all. **Rule 07.**
- A filled pressed state, or a toggle offered without JavaScript. **Rule 08.**
- No print stylesheet. **Rule 09.**

## Reporting

- Report per rule, worst first, and name the rule number.
- Quote the offending declaration. "This is off-system" is not actionable;
  `border-radius: 8px` on `.panel` is.
- Separate a **violation** from a **gap**. A card is a violation. A component
  the system does not have is a gap, and the fix is a separate stylesheet, not
  an edit to the base file.
- Say when the page is right. A page that follows all nine is a valid and
  useful result, and saying so plainly is better than finding something.
- If a rule genuinely does not apply, say which and why, rather than scoring it.

## Measuring contrast

Do not estimate, and do not read a ratio off a checker that assumes a flat
background. The grain overlay sits between the text and the page:

- **Light:** the worst-case surface is `--paper` composited with black at
  `--grain`.
- **Dark:** the worst-case surface is `--paper` composited with white at
  `--grain`.

Measure every text token against that surface. `--rule` and `--sunk` are
exempt. The reference implementation is `src/measure.js` in the source
repository, and it is about 80 lines with no dependencies.

## Defaults you can change

- **Strictness.** Report every deviation from the nine rules, including ones
  that are invisible at a glance.
- **Scope.** Review the page's own CSS and markup; leave vendored copies of
  `chapbook.css` alone unless they have been edited.
- **Additions.** Treat a component the system does not have as a gap to be
  filled in a separate stylesheet, not as a reason to change the base file.
