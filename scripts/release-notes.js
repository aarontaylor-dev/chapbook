#!/usr/bin/env node
/*
 * Turn an annotated tag's message into GitHub release notes.
 *
 *   git tag -l --format='%(contents)' v1.2.0 | node scripts/release-notes.js v1.2.0
 *
 * WHY THIS EXISTS
 *
 * `gh release create --notes-from-tag` passes the tag message through
 * unchanged, and the two formats disagree about newlines.
 *
 * A git tag message is hard-wrapped near 76 columns, because it is read in a
 * terminal by `git show` and `git log`, neither of which reflows. GitHub
 * renders a release body as Markdown with hard line breaks PRESERVED — a
 * single newline becomes a <br> rather than a space. So a message wrapped for
 * the terminal arrives on the releases page as ragged forced breaks at
 * whatever width it happened to be written to, ignoring the reader's window.
 *
 * Neither format is wrong. They are for different readers, and the fix is to
 * translate rather than to pick one and let the other look broken.
 *
 * WHAT IT DOES
 *
 *   - drops a leading "Chapbook vX.Y.Z" line, which the release title above it
 *     already says
 *   - joins hard-wrapped prose back into one line per paragraph, so the
 *     browser wraps it to the reader's width
 *   - leaves anything that is not prose alone: list items, indented blocks,
 *     fenced code, quotes, headings, and tables all mean something by their
 *     line breaks, and reflowing them would corrupt them
 *
 * No dependencies. Reads stdin, writes stdout.
 */

/* A line whose break carries meaning, and which must therefore survive. */
const STRUCTURAL = /^(?:\s{4,}|\t|[-*+]\s|\d+[.)]\s|#{1,6}\s|>\s?|\||```|~~~)/;

/* A list item, which may have been wrapped like any other prose. */
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/;

export function toReleaseNotes(message, tag) {
  const lines = message.replace(/\r\n/g, '\n').split('\n');

  /* The tag message opens by naming itself, because in a terminal there is no
     title above it. On the releases page there is, immediately above. */
  const titleLine = new RegExp(`^\\s*Chapbook\\s+${tag ? tag.replace(/[.\\+*?[^\\]$(){}=!<>|:#-]/g, '\\$&') : 'v[\\d.]+'}\\s*$`, 'i');
  while (lines.length && (titleLine.test(lines[0]) || lines[0].trim() === '')) {
    if (lines[0].trim() !== '' && !titleLine.test(lines[0])) break;
    lines.shift();
  }

  const out = [];
  let paragraph = [];
  let fenced = false;

  const flush = () => {
    if (paragraph.length) out.push(paragraph.join(' '));
    paragraph = [];
  };

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      flush();
      fenced = !fenced;
      out.push(line);
      continue;
    }
    if (fenced) {
      out.push(line);
      continue;
    }
    if (line.trim() === '') {
      flush();
      out.push('');
      continue;
    }
    if (STRUCTURAL.test(line)) {
      flush();
      out.push(line);
      continue;
    }

    /* A wrapped list item continues on an indented line that is not itself a
       new item. Joining it to the item above keeps the list one list; letting
       it start a paragraph would break the item in two on the page. */
    if (/^\s+\S/.test(line) && out.length && !paragraph.length && LIST_ITEM.test(out[out.length - 1])) {
      out[out.length - 1] += ' ' + line.trim();
      continue;
    }

    paragraph.push(line.trim());
  }
  flush();

  /* Collapse the runs of blank lines the shifts above can leave behind. */
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/* --------------------------------------------------------------- as a CLI -- */

if (import.meta.url === `file://${process.argv[1]}`) {
  const tag = process.argv[2];
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => (input += c));
  process.stdin.on('end', () => process.stdout.write(toReleaseNotes(input, tag)));
}
