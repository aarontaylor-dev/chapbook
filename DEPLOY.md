# Deployment

Static files in `public/`, served by Cloudflare Pages on
`style.aarontaylor.me`. `node build.js` renders them; there are no
dependencies to install.

This is the third Pages project on the `aarontaylor.me` zone, after the apex
and the notes site. The procedure below is the apex's, minus the one trap that
does not apply here — and it is worth knowing *why* it does not apply.

## The redirect-rule trap does not apply here

Deploying the apex hit a failure that looks like a Cloudflare bug: **a Redirect
Rule covering a hostname prevents Pages from verifying a custom domain on that
hostname.** The rule runs at the edge, ahead of Pages, so the verification
probe gets a 301 and never sees the project, and the domain sits on
**Verifying** indefinitely.

The only redirect rule on this zone is `www to apex`, filtered to
`http.host eq "www.aarontaylor.me"`. It does not touch `style`, so this deploy
can be done in the obvious order.

Confirm before starting, rather than trusting this paragraph:

```bash
dig +short style.aarontaylor.me
```

`NXDOMAIN` or empty is the expected answer — the wildcard `A` record was
deleted during the apex deploy precisely so that unknown subdomains fail
cleanly instead of serving a 522. A new subdomain must be added explicitly.

## Order of operations

### 1. Create the repository, public

```bash
gh repo create aarontaylor-dev/plain-text-system --public \
  --source . --remote origin --push \
  --description "A small CSS system for documents that want to read like documents."
```

**Public matters.** The whole point of this repo is that people take the files.
The apex repo is private, which is why the system could not live inside it.

### 2. Grant the Cloudflare Pages GitHub app access

Cloudflare's GitHub app is scoped to **selected repositories**, so a new repo
is invisible to the create-project flow until it is added at
[github.com/settings/installations](https://github.com/settings/installations)
→ Cloudflare Workers and Pages → Configure → Select repositories → **Save**.

The Save button is easy to miss. The repo appears in the list as soon as it is
ticked, which looks finished, but nothing persists until Save.

### 3. Create the Pages project

Workers & Pages → Create → Pages → Connect to Git.

```txt
Repository:              aarontaylor-dev/plain-text-system
Project name:            plain-text-system
Production branch:       main
Framework preset:        None
Build command:           node build.js
Build output directory:  public
Root directory:          (leave empty)
```

Set the build command **at creation**. The apex was created without one and
then needed it later, and a forgotten build command fails silently — the
committed generated files deploy fine, just stale.

Here the failure mode is worse than stale: the build is what enforces WCAG AA
on the tokens. Without it, a contrast regression deploys without complaint.

### 4. Prove the deployment on its own URL

```bash
curl -sS -o /dev/null -w "root   %{http_code}\n" https://plain-text-system.pages.dev/
curl -sS -o /dev/null -w "css    %{http_code}\n" https://plain-text-system.pages.dev/plain-text.css
curl -sS -o /dev/null -w "frozen %{http_code}\n" https://plain-text-system.pages.dev/v1.0.0/plain-text.css
curl -sSI https://plain-text-system.pages.dev/plain-text.css | grep -i 'access-control\|cache-control'
curl -sS -o /dev/null -w "404    %{http_code}\n" https://plain-text-system.pages.dev/nope
```

Expect `200` throughout, `404` last, and the CSS carrying
`Access-Control-Allow-Origin: *` — which proves `_headers` was picked up from
the output directory.

The CORS header is not decoration. A `<link rel="stylesheet">` does not need
it, but an agent reading the system with `fetch()` does, and that is half the
audience.

### 5. Add the DNS record

DNS → Records → Add record.

```txt
Type:    CNAME
Name:    style
Target:  plain-text-system.pages.dev
Proxy:   Proxied
TTL:     Auto
```

### 6. Attach the custom domain

Pages project → Custom domains → Set up a domain → `style.aarontaylor.me`.

It should go **Active / SSL enabled** within a minute or two, because nothing
at the edge is answering for that hostname first.

## Verify

```bash
curl -sS -o /dev/null -w "site    %{http_code}\n" https://style.aarontaylor.me/
curl -sS -o /dev/null -w "css     %{http_code}\n" https://style.aarontaylor.me/plain-text.css
curl -sS -o /dev/null -w "frozen  %{http_code}\n" https://style.aarontaylor.me/v1.0.0/plain-text.css
curl -sS -o /dev/null -w "spec    %{http_code}\n" https://style.aarontaylor.me/system.md
curl -sS -o /dev/null -w "llms    %{http_code}\n" https://style.aarontaylor.me/llms.txt
curl -sS -o /dev/null -w "404     %{http_code}\n" https://style.aarontaylor.me/nope
curl -sS -o /dev/null -w "apex    %{http_code}\n" https://aarontaylor.me/
curl -sS -o /dev/null -w "notes   %{http_code}\n" https://notes.aarontaylor.me/
```

The last two matter: two other Pages projects share this zone and nothing here
should have touched either. Check them anyway.

### The CSP carries two script hashes

The specimen inlines two scripts — the theme bootstrap and the skin picker —
and both are admitted by hash rather than by `'unsafe-inline'`:

```bash
curl -sSI https://style.aarontaylor.me/ | grep -i content-security-policy
```

Both hashes in the header must match the scripts in the page:

```bash
curl -sS https://style.aarontaylor.me/ | python3 -c "
import sys, re, hashlib, base64
for s in re.findall(r'<script>(.*?)</script>', sys.stdin.read(), re.S):
    print('sha256-' + base64.b64encode(hashlib.sha256(s.encode()).digest()).decode())"
```

If they differ, the deployed HTML and the deployed headers came from different
builds. Rebuild and redeploy; do not hand-edit `_headers` to match.

## Mail is not in scope

Adding a `CNAME` at `style` cannot affect mail on this zone. Mail records live
at the apex and at `_dmarc` / `google._domainkey`, none of them is a wildcard,
and a new subdomain record does not shadow any of them.

The apex deploy did need a mail baseline, because it changed a record at the
apex. That procedure lives in the private repo for this zone, which is where
it belongs.

## Publishing to npm

```bash
npm publish --access public
```

`prepack` runs the build and copies `system.md` and `llms.txt` to the root, so
the tarball cannot go out with a stale spec or a token below AA.

Check what would ship first:

```bash
npm pack --dry-run
```

Ten files, about 23 kB. If it is much larger, something has been added to
`files` that should not be there.

## Rollback

Pages keeps every deployment. Roll back in the dashboard: project →
Deployments → the last good one → **Rollback**.

Nothing else in the zone depends on this hostname, so a rollback here cannot
affect the apex or the notes site. A published npm version cannot be rolled
back — publish a patch instead.

## Known loose ends

- No sitemap yet. `robots.txt` references one. Either add it or drop the line.
- The specimen self-hosts no fonts, by design: the system defaults to system
  stacks, and the specimen demonstrates the default rather than an upgrade.
