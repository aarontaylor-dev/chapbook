/*
 * The manifest. Everything that is not layout lives here.
 *
 * Copy authored in this file is trusted and interpolated as written, so it
 * may contain entities. Anything measured is computed at build time and
 * never typed by hand — see src/measure.js and Rule 07.
 */

export const site = {
  url: 'https://chapbook.page/',
  repo: 'https://github.com/aarontaylor-dev/chapbook',
  title: 'Chapbook',
  brand: 'chapbook',
  version: '1.2.1',
  /* Alt text for the social card. Networks surface this, and so do readers
     who never see the image — so it describes the system, not the picture. */
  cardAlt:
    'Chapbook — a small CSS system for documents that want to read like documents.',
  description:
    'A small CSS system for documents that want to read like documents. Monospace carries structure, a second face carries language, and separation comes from rules and space rather than from cards. Nine rules, six of them enforced by the build, no build step to use it, MIT.',
};

export const hero = {
  eyebrow: `v${site.version} · MIT · no dependencies`,
  name: 'Chapbook',
  intro:
    'A small CSS system for documents that want to read like documents. Monospace carries structure, a second face carries language, and separation comes from rules and space rather than from cards.',
  aside: {
    lead: 'This page is the specimen.',
    rest: 'It is set in the system it documents, using the same stylesheet you are invited to take &mdash; so every component below is the real implementation rather than a picture of one. The theme toggle is real. So is the print stylesheet &mdash; <b>press print and read the result</b>, because paper is a target here rather than a courtesy. Change the skin in section 03 and watch nothing structural move.',
  },
};

/*
 * What the system is for, and what it is not.
 *
 * The anti-goals are the half that was missing. "Not a framework, no
 * JavaScript, no utility classes" describes what the file does not contain,
 * which is a different question from who should not use it — and leaving the
 * second question unanswered means the wrong people arrive, ask for cards and
 * form controls, and conclude the system is unfinished rather than aimed
 * somewhere else.
 *
 * The name settles it. A chapbook was a distribution technology and not a
 * look: standard formats, shared stock, no per-title design, cheap enough to
 * give away. Looking distinctive was never among its aims, and it is not
 * among these.
 */
export const purpose = {
  lede:
    'A chapbook was a distribution technology rather than a look &mdash; standard formats, shared stock, no design per title, cheap enough to give away. This system inherits that, including the parts that sound like limitations.',
  claim:
    'Chapbook is not a way to make your documents look distinctive. It is a way to stop having the conversation, so the writing can start &mdash; and it holds up when the page leaves the screen.',
  for: [
    ['Documents that are read', 'Specifications, notes, changelogs, internal docs, a personal site that is mostly writing.'],
    ['Anything that leaves the screen', 'Paper, PDF, an archive, a printer in an office. Rule 09 is load-bearing, not a courtesy.'],
    ['A settled default', 'For a person or an agent, so that no time at all is spent deciding how it should look.'],
    ['Being taken and edited', 'One file, no build, no configuration, MIT. Editing it <em>is</em> the configuration.'],
  ],
  not: [
    ['Applications', 'No form controls, no grid utilities, no cards. A dashboard wants a different tool, not this one with additions.'],
    ['Looking unique', 'An explicit anti-goal. Two sites built on this should look related; if that is a problem, the problem is the choice of system.'],
    ['Teams wanting configuration', 'There are no options and there is no theme API. The file is the API.'],
    ['Being a brand', 'It is stock, in the printer&rsquo;s sense &mdash; shared inventory rather than identity.'],
  ],
};

/*
 * The nine rules. These are the system; the CSS is only their implementation.
 *
 * They were not invented for this document. Each one was already being
 * followed by two independently built sites, which is the test that matters —
 * a rule that has survived one build is a preference.
 */
export const rules = [
  {
    n: 1,
    title: 'Two faces, and the mono is the constant',
    body: 'One monospace sets every label, number, address, breadcrumb, button and footer line &mdash; anything that tells you <em>what kind of thing</em> you are looking at rather than <em>saying something</em>. A second face carries the language, and it is the site&rsquo;s own. If a piece of text tells you what kind of thing you are looking at, it is mono, uppercase and tracked. That single test decides every case.',
    spec: '--mono is shared across sites · --language is not · 0.68&ndash;0.75rem · 0.08&ndash;0.16em tracking',
  },
  {
    n: 2,
    title: 'No cards',
    body: 'No radius, no fill, no shadow to say &ldquo;separate object&rdquo;. Objects are separated by a hairline and by space. The only fill in the system is the row hover at about 1.07:1 &mdash; felt rather than seen. If you can identify its colour, it is too strong. The single exception is a code field, which earns its border by genuinely being a different surface.',
    spec: 'border-radius: 0 everywhere · one fill, --sunk · zero box-shadow',
  },
  {
    n: 3,
    title: 'Two weights of rule, and they mean different things',
    body: 'A 1px hairline separates peers. A 2px ink rule opens and closes the document: under the masthead, above the first block, above the footer. Those three lines are what hold a page together at a glance. Do not add a third weight &mdash; the moment there are three, none of them mean anything.',
    spec: '1px var(--rule) between peers · 2px var(--ink) at the document edges',
  },
  {
    n: 4,
    title: 'The numbered rail',
    body: 'A sticky left column carrying a number and a mono section name, content on the right. It stays beside its content for as long as that content is on screen, and collapses to a line above the content on narrow viewports. <code>align-self: start</code> is required, or there is nothing to stick within &mdash; a grid item stretches to the row height by default, and a stretched item cannot be sticky. Remove that one line and the rail silently stops moving, with no error anywhere.',
    spec: 'grid: var(--rail) minmax(0, 1fr) · position: sticky · align-self: start',
  },
  {
    n: 5,
    title: 'One row anatomy, and the row is a link',
    body: 'Mono label left, title in the display face, mark right, then an optional description and a mono line carrying the destination. The whole row is the link and the mark is decorative. On hover the hairline redraws in ink from the left and the mark nudges up and right. Use <b>&#8599;</b> for a destination that leaves the site and <b>&#8594;</b> for one that does not, so the mark keeps meaning something. The rule governs <em>this</em> row &mdash; the one that navigates. A repeated block that does not link is a different object and does not owe it an anatomy.',
    spec: 'rules bleed 0.75rem past the text so the hover fill has somewhere to sit',
  },
  {
    n: 6,
    title: 'Tokens declared three times',
    body: 'Bare <code>:root</code> is the light palette and the fallback. The media query is guarded with <code>:not([data-theme="light"])</code> so an explicit choice beats the system preference. <code>[data-theme="dark"]</code> restates it so the toggle wins in both directions. Never style a component from inside one of those blocks &mdash; a rule written there exists in one theme and not the other, and you will not notice for weeks.',
    spec: ':root · @media (prefers-color-scheme: dark) · :root[data-theme="dark"]',
  },
  {
    n: 7,
    title: 'Contrast is measured, and the measurement is written down',
    body: 'Every text token carries its ratio, measured against the <em>worst-case surface</em> rather than the flat background &mdash; the grain overlay sits between the text and the page and moves the surface toward the text in both themes. Ink is never pure black on pure white; at 21:1 that pairing glares on long text. In this repo the measuring is done by the build, and a token below AA fails it.',
    spec: 'WCAG AA 4.5:1 for text · hairlines and fills exempt · measured, not estimated',
  },
  {
    n: 8,
    title: 'A bordered control, not another word in a row of words',
    body: 'The theme toggle is a 2rem square with a hairline border, because it <em>does</em> something where the links beside it only <em>go</em> somewhere. It ships with the <code>hidden</code> attribute set and is revealed by script, so a visitor without JavaScript is never offered a button that cannot work.',
    spec: '2rem square · 1px border · hidden until bootstrapped',
  },
  {
    n: 9,
    title: 'It prints',
    body: 'Ink on white, controls gone, every panel open, and link destinations expanded after the link text &mdash; a printed page has no hover and no address bar, so a bare &ldquo;read more&rdquo; prints as a dead end. The sheet is set rather than surrendered: <code>@page</code> owns the margin instead of the print dialogue, paragraphs carry orphans and widows, and a heading never ends a sheet with its section overleaf. Print is the target this system is actually for &mdash; try it on this page.',
    spec: '@page 18mm · 10.5pt on 1.4 · orphans 3 widows 3 · --grain: 0 · href expanded',
  },
];

/* The three sites the system already runs on. Structure identical, colour
   deliberately not — which is the claim the skin switcher exists to prove. */
export const skins = [
  {
    id: 'neutral',
    label: 'Neutral',
    where: 'aarontaylor.me',
    note: 'Monochrome, no accent. The hub is an index of other work, so it stays neutral and lets each project keep its own colour.',
  },
  {
    id: 'green',
    label: 'Green',
    where: 'weindie.com',
    note: 'Warm paper, deep green, Newsreader. Shipped &mdash; these are the values running on the site today.',
  },
  {
    id: 'clay',
    label: 'Clay',
    where: 'notes.aarontaylor.me',
    note: 'Warmer paper, clay accent, Source Serif&nbsp;4. Clay is the colour of a correction, and the site is a notebook of them.',
  },
];

export const typeScale = [
  ['Page title', 'Display', 'clamp(2.5rem, 8vw, 4rem)', 'lh 1.02 · ls &minus;0.032em'],
  ['Row title', 'Display', 'clamp(1.15rem, 3vw, 1.45rem)', 'lh 1.2 · ls &minus;0.02em'],
  ['Intro', 'Language', '1.125rem', '--muted · max 32em'],
  ['Lede', 'Language', '1.1rem', '--muted · max --measure'],
  ['Body', 'Language', '1.0625rem', 'lh 1.6'],
  ['Row description', 'Language', '0.97rem', '--muted · lh 1.5'],
  ['Section head', 'Mono 500', '0.7rem', 'ls 0.13em · uppercase'],
  ['Label / meta', 'Mono 400', '0.7rem', 'ls 0.11em · uppercase · --faint'],
  ['Rail number', 'Mono 400', '0.7rem', 'tabular-nums · --accent'],
  ['Code', 'Mono 400', '0.8125rem', 'lh 1.65 · --sunk field'],
];

/* Rendered with the same row anatomy as everything else — Rule 05 applies to
   the page that documents Rule 05. */
export const files = [
  {
    status: 'Required',
    title: 'chapbook.css',
    href: '/chapbook.css',
    desc: 'The system. Tokens, primitives, components, print. Around 500 lines, and you are expected to read them.',
    meta: 'chapbook.page/chapbook.css',
  },
  {
    status: 'Optional',
    title: 'chapbook-skins.css',
    href: '/chapbook-skins.css',
    desc: 'Two worked palettes, taken from sites actually running this system. Load after the base file and set data-skin.',
    meta: 'chapbook.page/chapbook-skins.css',
  },
  {
    status: 'Optional',
    title: 'chapbook-theme.js',
    href: '/chapbook-theme.js',
    desc: 'The theme bootstrap in 24 lines. Inline it in the head, or the stored preference flashes the wrong colour on every load.',
    meta: 'chapbook.page/chapbook-theme.js',
  },
  {
    status: 'For agents',
    title: 'system.md',
    href: '/system.md',
    desc: 'The whole system as plain text: the nine rules, the token contract, the markup for every component, and the rules for extending it without drift.',
    meta: 'chapbook.page/system.md',
  },
  {
    status: 'For agents',
    title: 'llms.txt',
    href: '/llms.txt',
    desc: 'The short brief. What this is, the nine rules in one line each, and where the files are. Start here if you have a small context window.',
    meta: 'chapbook.page/llms.txt',
  },
  {
    status: 'Source',
    title: 'GitHub',
    href: site.repo,
    desc: 'The repository. Everything on this page is in it, including the build that measures the contrast and refuses to publish a failing token.',
    meta: 'github.com/aarontaylor-dev/chapbook',
  },
];
