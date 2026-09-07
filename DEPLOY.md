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
gh repo create aarontaylor-dev/chapbook --public \
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
Repository:              aarontaylor-dev/chapbook
Project name:            chapbook
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
curl -sS -o /dev/null -w "root   %{http_code}\n" https://chapbook.pages.dev/
curl -sS -o /dev/null -w "css    %{http_code}\n" https://chapbook.pages.dev/chapbook.css
curl -sS -o /dev/null -w "frozen %{http_code}\n" https://chapbook.pages.dev/v1.0.0/chapbook.css
curl -sSI https://chapbook.pages.dev/chapbook.css | grep -i 'access-control\|cache-control'
curl -sS -o /dev/null -w "404    %{http_code}\n" https://chapbook.pages.dev/nope
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
Target:  chapbook.pages.dev
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
curl -sS -o /dev/null -w "css     %{http_code}\n" https://style.aarontaylor.me/chapbook.css
curl -sS -o /dev/null -w "frozen  %{http_code}\n" https://style.aarontaylor.me/v1.0.0/chapbook.css
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

Releases go out from GitHub Actions, not from a laptop, so that npm can attest
**provenance** — a signed, verifiable link between the published tarball and
the exact commit and workflow that built it. The package page then shows a
Provenance panel pointing at this repository. That attestation can only be
produced by a trusted CI system with an OIDC identity, which is why
`.github/workflows/release.yml` requests `id-token: write`.

### One-time setup

1. **Create an npm Automation token.** npmjs.com → Access Tokens → Generate →
   **Automation**.

   It must be Automation rather than Publish. A Publish token still prompts for
   a one-time code when the account has 2FA on publishes, and there is nobody
   in CI to type one.

2. **Add it as a repository secret** named `NPM_TOKEN`, at Settings → Secrets
   and variables → Actions → New repository secret.

That is the whole setup. Nothing else needs configuring, and the token is the
only secret this repository has.

### Releasing

```bash
# 1. bump the version and record the release
#    - package.json  "version"
#    - CHANGELOG.md  a new section saying why, not only what
node build.js          # refreshes public/ and the frozen version directories

git add -A && git commit -m "Release v1.0.1"
git push

# 2. the tag is what publishes
git tag v1.0.1
git push --tags
```

Pushing to `main` never publishes. Only a `v*` tag does.

### What the release workflow refuses to do

- **Publish when the tag disagrees with `package.json`.** That would ship the
  wrong version under the right name, and npm versions cannot be reused.
- **Publish a version that already exists** on the registry.
- **Publish a token below WCAG AA**, or a Rule 06 disagreement — it runs the
  same `node build.js` gate as CI before it publishes.

### Checking what would ship

```bash
npm pack --dry-run
```

Twelve files, about 24 kB — README, changelog, licence, the three
distributables, `system.md`, `llms.txt`, the skill, and `measure.js`. If it is
much larger, something has been added to `files` that should not be there.

### Verifying provenance after a release

```bash
npm view chapbook dist.attestations
```

The package page at <https://www.npmjs.com/package/chapbook> should
show a **Provenance** panel naming this repository and the building commit.

## Continuous integration

`.github/workflows/build.yml` runs on every push to `main` and every pull
request. It is the same build, and it enforces three things:

- No text token below **4.5:1** against the worst-case grain pixel, and no
  Rule 06 disagreement between the two dark blocks.
- **`public/` is not stale.** This repository commits its generated files so a
  deploy works whether or not the build has run — an invariant that only holds
  if what is committed matches what the build produces. A dirty tree after
  `node build.js` means someone edited a source file and did not rebuild.
- **The frozen version directories match their source.** `/v1.0.0/` is served
  `immutable` and cached for a year; it had better be what it claims to be.

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
