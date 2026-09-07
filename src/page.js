/*
 * The specimen template. One function per region, composed at the bottom.
 *
 * Everything here emits a string; there is no DOM and no framework. Copy from
 * content.js is trusted and interpolated as written; measured values arrive
 * from src/measure.js and are numbers.
 */

import { site, hero, rules, skins, typeScale, files } from './content.js';

const esc = (s) =>
  String(s)
    .replace(/&(?![a-z#0-9]+;)/gi, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const n2 = (n) => String(n).padStart(2, '0');
const r2 = (n) => n.toFixed(2);

/* ---------------------------------------------------------------- chrome -- */

/*
 * A contrast mark, not a sun and moon. A time-of-day metaphor would be
 * borrowed from a site that has a time of day; what this control does is flip
 * the polarity of the page, so that is what it draws. One circle, half
 * filled, and the fill rotates to the other side. Two elements, no mask.
 */
const themeButton = () => `
      <button class="theme" id="theme" type="button" hidden>
        <svg class="tsvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle class="ring" cx="12" cy="12" r="8.4" fill="none"/>
          <path class="half" d="M12 3.6 A8.4 8.4 0 0 1 12 20.4 Z"/>
        </svg>
        <span class="vh">Switch theme</span>
      </button>`;

const masthead = (links) => `
    <header class="wrap bar">
      <a class="brand" href="/">${site.brand}</a>
      <div class="bar-end">
        <nav class="barlinks" aria-label="Sections">
${links.map(([href, text]) => `          <a href="${href}">${text}</a>`).join('\n')}
        </nav>
${themeButton()}
      </div>
    </header>`;

const block = ({ n, id, heading, body }) => `
      <section class="blk" id="${id}">
        <div class="rail">${n ? `\n          <p class="n">${n2(n)}</p>` : ''}
          <h2>${heading}</h2>
        </div>
        <div class="body">
${body}
        </div>
      </section>`;

const row = ({ status, title, href, desc, meta, external }) => `
            <a class="row" href="${href}"${external ? ' rel="noopener"' : ''}>
              <span class="row-label">${status}</span>
              <span class="row-title">${title}</span>
              <span class="row-mark" aria-hidden="true">${external ? '&#8599;' : '&#8594;'}</span>${
                desc ? `\n              <span class="row-desc">${desc}</span>` : ''
              }${meta ? `\n              <span class="row-meta">${meta}</span>` : ''}
            </a>`;

const code = (text) => `<pre class="code">${esc(text)}</pre>`;

/* -------------------------------------------------------------- sections -- */

const heroBlock = () => `
      <div class="hero">
        <p class="eyebrow">${hero.eyebrow}</p>
        <h1 class="name">${hero.name}</h1>
        <p class="intro">${hero.intro}</p>
        <p class="aside"><b>${hero.aside.lead}</b> ${hero.aside.rest}</p>
      </div>`;

/*
 * The nine rules. Not an index — nothing here is a link — so it uses the row
 * anatomy without the row's affordances: mono number, title in the display
 * face, prose, and a mono line carrying the implementation.
 */
const rulesBlock = () =>
  block({
    n: 1,
    id: 'rules',
    heading: 'The rules',
    body: `          <p class="lede">Nine rules, each already followed by two independently built sites before it was written down here. A rule that has survived one build is a preference; these survived two, with different palettes and different faces.</p>
          <div class="rules">
${rules
  .map(
    (r) => `            <article class="rule">
              <p class="rule-n">Rule ${n2(r.n)}</p>
              <h3 class="rule-title">${r.title}</h3>
              <p class="rule-body">${r.body}</p>
              <p class="rule-spec">${r.spec}</p>
            </article>`
  )
  .join('\n')}
          </div>`,
  });

/*
 * The token table, rendered from measurements taken by the build. Nothing in
 * this table is typed by hand — that is the whole of Rule 07, applied to the
 * page that states Rule 07.
 */
const paletteTable = (p) => `
            <div class="tablewrap">
              <table class="tbl">
                <caption class="vh">Colour tokens for the ${esc(p.label)} skin, light and dark, with contrast measured against the worst-case grain pixel</caption>
                <thead>
                  <tr>
                    <th scope="col">Token</th>
                    <th scope="col">Light</th>
                    <th scope="col">On surface</th>
                    <th scope="col">Dark</th>
                    <th scope="col">On surface</th>
                    <th scope="col">Role</th>
                  </tr>
                </thead>
                <tbody>
${p.tokens
  .map(
    (t) => `                  <tr>
                    <th scope="row"><code>--${t.token}</code></th>
                    <td><span class="chip" style="--c:${t.light}"></span>${t.light}</td>
                    <td class="num">${t.lightRatio}</td>
                    <td><span class="chip" style="--c:${t.dark}"></span>${t.dark}</td>
                    <td class="num">${t.darkRatio}</td>
                    <td class="role">${t.role}</td>
                  </tr>`
  )
  .join('\n')}
                </tbody>
              </table>
            </div>`;

const tokensBlock = (palettes) =>
  block({
    n: 2,
    id: 'tokens',
    heading: 'Tokens',
    body: `          <p class="lede">Eight colour tokens, and the names are the contract. Change every value you like; keep the names, so a diff between two sites built on this system shows only the differences that were intended.</p>

          <div class="skinpick">
            <p class="label" id="skinlabel">Skin</p>
            <div class="skinbtns" role="group" aria-labelledby="skinlabel">
${skins
  .map(
    (s, i) => `              <button class="skinbtn" type="button" data-skin-set="${s.id}"${i === 0 ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${s.label}</button>`
  )
  .join('\n')}
            </div>
          </div>
${skins
  .map(
    (s, i) => `          <div class="skinpanel" data-skin-panel="${s.id}"${i === 0 ? '' : ' hidden'}>
            <p class="small skinnote"><b>${s.where}</b> &mdash; ${s.note}</p>
${paletteTable(palettes.find((p) => p.id === s.id))}
          </div>`
  )
  .join('\n')}

          <p class="small footnote">Ratios are measured against the <b>worst-case grain pixel</b>, not against <code>--paper</code>. The overlay sits between the text and the page and moves the surface toward the text in both themes, so a ratio taken against the flat ground flatters itself. <code>--rule</code> and <code>--sunk</code> are exempt: they are edges and fills, and WCAG does not ask a hairline to be legible.</p>

          <p class="small footnote">The build recomputes every number on this page from the stylesheet it ships, and <b>exits non-zero if any text token drops below 4.5:1</b>. A failing token cannot reach the site, and this table cannot go stale.</p>

          <p class="small footnote">Layout tokens, reconciled across the three sites &mdash; they had drifted, and these are the settled values:<br>
            <code>--gut</code> clamp(1.25rem, 5vw, 2.75rem) &middot;
            <code>--wrap</code> 62rem &middot;
            <code>--rail</code> 10rem &middot;
            <code>--measure</code> 34em &middot;
            <code>--ease</code> cubic-bezier(0.22, 0.61, 0.36, 1). Rem everywhere.</p>`,
  });

const typeBlock = () =>
  block({
    n: 3,
    id: 'type',
    heading: 'Type',
    body: `          <p class="lede">Two faces do all the work. If a piece of text tells you <em>what kind of thing</em> you are looking at, it is mono, uppercase and tracked. If it <em>says something</em>, it is the language face. That test decides every case, which is why the system needs no third face.</p>

          <div class="tablewrap">
            <table class="tbl">
              <caption class="vh">The type scale</caption>
              <thead>
                <tr><th scope="col">Role</th><th scope="col">Face</th><th scope="col">Size</th><th scope="col">Detail</th></tr>
              </thead>
              <tbody>
${typeScale
  .map(
    ([role, face, size, detail]) =>
      `                <tr><th scope="row">${role}</th><td>${face}</td><td class="num">${size}</td><td class="role">${detail}</td></tr>`
  )
  .join('\n')}
              </tbody>
            </table>
          </div>

          <p class="small footnote">Sizes live on classes, never on elements. A base <code>h1</code> rule gets overridden on every page that uses it, and at that point it is not a base rule &mdash; it is a default nobody wants, written once and fought four times.</p>

          <p class="small footnote">Three faces are declared: <code>--mono</code>, <code>--language</code>, and <code>--display</code>, which defaults to <code>--language</code> so most sites never think about it. Set it separately only when titles genuinely want a different face &mdash; the hub does, because Archivo Black sets its titles and Roboto sets its prose.</p>`,
  });

const componentsBlock = () =>
  block({
    n: 4,
    id: 'components',
    heading: 'Components',
    body: `          <p class="lede">Every component below is live. Hover a row to see Rule 05, press the toggle in the masthead to see Rule 06, and print the page to see Rule 09.</p>

          <p class="label">The index row</p>
          <nav class="index" aria-label="Example rows">
${row({ status: 'Internal', title: 'A row that stays on the site', href: '#components', desc: 'Mono label left, title in the display face, mark right, then this description and a mono line carrying the destination. The whole row is the link.', meta: 'the mark is &#8594; because this one does not leave' })}
${row({ status: 'External', title: 'A row that leaves', href: site.repo, desc: 'Same anatomy. Only the mark changes, so the mark keeps meaning something rather than being decoration that happens to point.', meta: 'github.com/aarontaylor-dev/plain-text-system', external: true })}
          </nav>

          <p class="label footnote">The code field</p>
          ${code(`.row:hover::after { transform: scaleX(1); }`)}
          <p class="small">The one bordered, filled object in the system. It earns the exception in Rule 02 by genuinely being a different surface, rather than being a card drawn around ordinary content.</p>

          <p class="label footnote">The rail</p>
          <p class="small">You are looking at it. The number and the section name to the left of this text are sticky, and stay beside their content for as long as that content is on screen. On a narrow viewport they collapse into a single line above the content &mdash; resize the window and watch the grid change rather than the type shrink.</p>

          <p class="label footnote">Not in v1</p>
          <p class="small">Margin notes are the obvious next component &mdash; they exist on Working Notes and are worth keeping &mdash; but they have shipped on one build rather than two, so they are a candidate for v1.1 rather than part of v1. The rule that keeps this system honest is the same one that keeps it small: two independent builds, or it is a preference rather than a rule.</p>`,
  });

const takeBlock = () =>
  block({
    n: 5,
    id: 'take',
    heading: 'Take it',
    body: `          <p class="lede">There is no install step, no package to configure and nothing to initialise. Link one file and use the class names.</p>

          ${code(`<link rel="stylesheet" href="https://style.aarontaylor.me/v${site.version}/plain-text.css">`)}
          <p class="small">Two version paths, and they are not the same promise. <code>/v${site.version}/</code> is exact: it never changes, and it is cached for a year. <code>/v${site.version.split('.')[0]}/</code> follows the major line and picks up additive releases, cached for a day. Link the exact one unless you specifically want the updates.</p>

          <p class="label footnote">Or vendor it, which is better</p>
          ${code(`curl -O https://style.aarontaylor.me/plain-text.css`)}
          <p class="small">Copying the file into your own repo costs one request less, survives this domain disappearing, and lets you edit it &mdash; which you are meant to do. A system you cannot change is a dependency.</p>

          <p class="label footnote">Or from npm</p>
          ${code(`npm i plain-text-system`)}

          <p class="label footnote">The minimum page</p>
          ${code(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>A page</title>
  <link rel="stylesheet" href="/plain-text.css">
</head>
<body>
  <header class="wrap bar">
    <a class="brand" href="/">site name</a>
  </header>

  <main class="wrap">
    <div class="hero">
      <p class="eyebrow">Label</p>
      <h1 class="name">The title</h1>
      <p class="intro">One sentence saying what this is.</p>
    </div>

    <section class="blk">
      <div class="rail">
        <p class="n">01</p>
        <h2>Section</h2>
      </div>
      <div class="body">
        <nav class="index">
          <a class="row" href="/somewhere">
            <span class="row-label">Status</span>
            <span class="row-title">The thing</span>
            <span class="row-mark" aria-hidden="true">&rarr;</span>
            <span class="row-desc">What it is.</span>
            <span class="row-meta">where it goes</span>
          </a>
        </nav>
      </div>
    </section>
  </main>

  <footer class="wrap">
    <div class="foot"><b>site name</b><span>A line.</span></div>
  </footer>
</body>
</html>`)}

          <p class="label footnote">Working with an agent</p>
          <p class="small">Point it at <a href="/system.md">system.md</a>, which is the whole system as plain text &mdash; the nine rules, the token contract, the markup for every component, and the rules for extending it without drift. <a href="/llms.txt">llms.txt</a> is the short version for a small context window. There is also a skill, in the format <a href="https://weindie.com" rel="noopener">weindie.com</a> uses, in <code>skill/</code> in the repository.</p>

          <nav class="index" aria-label="Files">
${files.map((f) => row({ ...f, external: f.href.startsWith('http') })).join('\n')}
          </nav>`,
  });

const versionBlock = () =>
  block({
    n: 6,
    id: 'version',
    heading: 'Version',
    body: `          <p class="lede">The <em>system</em> carries the version, not the site. <code>/v${site.version}/</code> never changes, so a page that links it never breaks.</p>

          <p class="small">One rule decides a major bump: <b>a token rename or a removed primitive</b>. Those are the only two changes that can break a site downstream &mdash; everything else is additive, and additions ship as a minor version at the same URL.</p>

          <p class="small footnote">What is deliberately not here: margin notes, tables as a styled component, form controls, and any kind of grid utility. Each is a real gap. None of them has been built twice yet, and the system stays small by refusing to describe anything it has not had to do.</p>

          <p class="small footnote">The changelog is in the repository, and it records why a thing changed rather than only that it did.</p>

          <nav class="index" aria-label="Version">
${row({ status: `v${site.version}`, title: 'Changelog', href: `${site.repo}/blob/main/CHANGELOG.md`, desc: 'What changed, when, and the reasoning that produced it.', meta: 'CHANGELOG.md', external: true })}
          </nav>`,
  });

/* ----------------------------------------------------------------- shell -- */

const head = ({ title, description, canonical, noindex, themeScript }) => `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${noindex ? '<meta name="robots" content="noindex">' : `<meta name="description" content="${description}">\n<link rel="canonical" href="${canonical}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.title}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">

<link rel="icon" href="/favicon.svg" type="image/svg+xml">

<!-- Applies a stored theme before first paint. Inlined rather than fetched
     because a round trip here is a flash of the wrong colour; the CSP carries
     its hash, so this costs no 'unsafe-inline'. -->
<script>${themeScript}</script>

<link rel="stylesheet" href="/plain-text.css">
<link rel="stylesheet" href="/plain-text-skins.css">
<link rel="stylesheet" href="/specimen.css">`;

const shell = ({ headHtml, bodyHtml, demoScript }) => `<!doctype html>
<html lang="en-GB">
<head>
${headHtml}
</head>
<body>

<a class="skip" href="#main">Skip to content</a>
${bodyHtml}
${demoScript ? `\n<script>${demoScript}</script>\n` : ''}
</body>
</html>
`;

const footer = () => `
    <footer class="wrap">
      <div class="foot">
        <b>${site.brand} v${site.version}</b>
        <span>MIT. Take it, change it, do not credit me.</span>
      </div>
    </footer>`;

/* ----------------------------------------------------------------- pages -- */

export function indexPage({ palettes, themeScript, demoScript }) {
  return shell({
    headHtml: head({
      title: `${site.title} — a small CSS system`,
      description: site.description,
      canonical: site.url,
      themeScript,
    }),
    bodyHtml: `${masthead([
      ['#rules', 'Rules'],
      ['#tokens', 'Tokens'],
      ['#components', 'Components'],
      ['#take', 'Take it'],
    ])}

    <main class="wrap" id="main">
${heroBlock()}
${rulesBlock()}
${tokensBlock(palettes)}
${typeBlock()}
${componentsBlock()}
${takeBlock()}
${versionBlock()}
    </main>
${footer()}`,
    demoScript,
  });
}

export function notFoundPage({ themeScript }) {
  return shell({
    headHtml: head({
      title: `Not found — ${site.title}`,
      description: 'That page does not exist.',
      canonical: `${site.url}404`,
      noindex: true,
      themeScript,
    }),
    bodyHtml: `${masthead([['/#rules', 'Rules'], ['/#take', 'Take it']])}

    <main class="wrap" id="main">
      <div class="hero">
        <p class="eyebrow">404</p>
        <h1 class="name">Nothing here.</h1>
        <p class="intro">That page doesn&rsquo;t exist. The system is one click away.</p>
      </div>
${block({
  id: 'try',
  heading: 'Try',
  body: `          <nav class="index" aria-label="Try">
${row({ status: 'Back', title: 'The system', href: '/', meta: 'style.aarontaylor.me' })}
${row({ status: 'Required', title: 'plain-text.css', href: '/plain-text.css', meta: 'the whole thing' })}
${row({ status: 'For agents', title: 'system.md', href: '/system.md', meta: 'the plain-text spec' })}
          </nav>`,
})}
    </main>
${footer()}`,
  });
}
