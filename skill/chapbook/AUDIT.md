# Auditing a page against Chapbook

You are ranking a document, section by section, against the nine rules of the
system it is built on. Read this whole file before you score anything.

## What is already decided, and what is yours

Three checks run before you do, and you should not repeat their work:

| Who | Covers | How |
| --- | --- | --- |
| `build.js` | 01, 02, 03, 06, 07, 09 | Reads the stylesheet. Exits non-zero. |
| `audit.js` | The decidable half of 04, 05, 08 | Reads the markup. Exits non-zero. |
| **You** | The rest of 04, 05, 08 | Reads the meaning. Nothing else can. |

If `audit.js` reported a problem, it is a fact and it is already counted. Do
not re-litigate it and do not soften it. Your job starts where it stops.

## The three rules you are judging

### Rule 04 — The numbered rail

The mechanical part — does a `.rail` exist, does it carry a number and an
`<h2>` — is already checked. What is yours:

- **Does the number mean anything?** A rail numbered 01…07 on sections that
  have no order is decoration wearing the costume of structure. Numbering is
  only honest when the sequence carries information: a real process, a
  versioned history, a document meant to be read through. A set of peers that
  could be shuffled without loss should not be numbered.
- **Does the heading name the section, or describe it?** "Tokens" is a name.
  "Some notes about the colour system" is a caption, and it belongs in the
  body.

### Rule 05 — One row anatomy, and the row is a link

`audit.js` reports how many distinct anatomies the document uses and fails if
there is more than one.

**Scope first, before you score anything.** The rule governs the index row —
the one that navigates. A repeated block that does not link is a different
object and is not in scope: do not score it, and do not report it as a
violation. `.rule` and `.forrow` on the specimen are both of that kind.

What is yours:

- **Is each part honest?** `.row-label` is a status, not a category dressed as
  one. `.row-meta` is where something goes or when it happened. A row that
  puts prose in `.row-label` has kept the shape and lost the rule.
- **Is the anatomy the right one for this content?** One anatomy across the
  document is the rule. If the single anatomy in use fits some rows badly, the
  fault is the anatomy, not the rows.
- **Is there a second link row wearing a different class?** This is the one
  the scanner cannot see. It matches `.row`; a navigational row built without
  that class is a real violation it will report as nothing.

### Rule 08 — A bordered control, not another word in a row of words

`audit.js` fails any `<button>` without a bordered class. What is yours:

- **Does anything that acts look like text?** An `<a>` that triggers a change
  rather than navigating is a control with no border, and the scanner cannot
  tell those apart. Read the labels.
- **Does anything bordered not act?** A border is the system's way of saying
  "this does something." Spending it on a static element is the same error in
  the other direction.

## The scale

Score every section on each of the three rules:

| | Meaning |
| --- | --- |
| **3** | Follows the rule, and the reason it exists is visible in the result. |
| **2** | Follows the rule. Nothing to fix, nothing exemplary. |
| **1** | Technically passes; the intent is not served. Numbering that means nothing, a label that is a category. |
| **0** | Breaks the rule. `audit.js` will usually have caught this one already. |

`n/a` where the rule does not apply — a section with no rows has no Rule 05
score, and inventing one to fill the column is noise.

## The output

One table, most-broken first. Then the three worst findings, with the fix.

```
SECTION            04   05   08   NOTE
03 Tokens           3    2    3   —
06 Take it          2   n/a   1   the skin buttons read as links until pressed
01 What it is for   1   n/a  n/a  numbered, but the four sections have no order
```

Rank by the lowest score, then by how load-bearing the section is. A weak
score on the first section a reader meets matters more than the same score on
the last.

## Two failure modes to avoid

**Do not award 3s for compliance.** A 3 means the rule's purpose is visible in
the result, not that a class name is present. Most honest work scores 2.

**Do not invent findings to fill the table.** A document that scores 2 across
the board and has nothing wrong with it is a real outcome, and reporting it
plainly is more useful than manufacturing three observations. If the page is
sound, say so and stop.
