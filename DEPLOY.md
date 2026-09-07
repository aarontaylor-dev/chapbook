# Deployment

Static files in `public/`, served by Cloudflare Pages on
`chapbook.page`. `node build.js` renders them; there are no
dependencies to install.

This is the third Pages project on the `aarontaylor.me` zone, after the apex
and the notes site. The procedure below is the apex's, minus the one trap that
does not apply here — and it is worth knowing *why* it does not apply.

## chapbook.page is its own zone

The first plan was a subdomain of `aarontaylor.me`. It ended up a domain of
its own, registered at Hover on 7 September 2026 and moved onto Cloudflare
DNS the same day. That changes the procedure in one important way, and
removes a trap.

**The trap that no longer applies.** Deploying the apex of `aarontaylor.me`
hit a failure that looks like a Cloudflare bug: a Redirect Rule covering a
hostname prevents Pages from verifying a custom domain on it, because the rule
runs at the edge ahead of Pages and the verification probe never reaches the
project. The domain then sits on **Verifying** indefinitely.

`chapbook.page` is a fresh zone with no rules on it at all, so the custom
domain activated in under two minutes. Nothing here needs doing in a special
order.

**Registration stays at Hover.** Only DNS moved. A registrar transfer would
have been the wrong tool and would have been refused anyway — ICANN blocks
transfers within 60 days of registration.

## Order of operations

### 1. Create the repository, public

```bash
gh repo create aarontaylor-dev/chapbook --public \
  --source . --remote origin --push \
  --description "A small CSS system for documents that want to read like documents."
```

**Public matters.** The whole point of this repo is that people take the
files. The `aarontaylor.me` repo is private, which is why the system could not
live inside it.

### 2. Move the domain onto Cloudflare DNS

Cloudflare → Add a site → **Connect a domain**. Not *Transfer a domain*: that
moves the registration and costs money.

Free plan. Then Cloudflare assigns two nameservers, and they replace Hover's
at Hover → the domain → Nameservers → Edit:

```txt
ns1.hover.com          ->   etienne.ns.cloudflare.com
ns2.hover.com          ->   gene.ns.cloudflare.com
```

The TLD delegation updated within about two minutes. Watch it directly at the
registry rather than through a caching resolver, which will hold the old
answer:

```bash
dig NS chapbook.page @$(dig +short NS page. | head -1) +noall +authority
```

**Delete the wildcard Cloudflare imports.** Hover's defaults include
`* A 216.40.34.41`, its parking IP. Exactly the same record turned up in the
`aarontaylor.me` migration, and it is worth removing for the same reason: it
makes *every* possible subdomain resolve and serve a Cloudflare **522**,
proxying to a parking IP that no longer answers. Deleting it means unknown
subdomains return `NXDOMAIN`, which is what they should do.

If a subdomain is ever needed, add it explicitly. Do not restore the wildcard.

The apex `A` record is left alone at this stage — Pages replaces it in step 5.

### 3. AI policy is set at zone creation

Cloudflare's onboarding sets **Block training in robots.txt** on by default.
It is deliberately **off** here, matching the decision recorded for
`aarontaylor.me`.

This site exists to be read by agents: `llms.txt` and `system.md` are half its
reason for existing, and the licence is MIT with no attribution required.
Blocking training on it would contradict both.

Search and Agent policies are left at **Allow**.

### 4. Create the Pages project

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

Set the build command **at creation**. The apex project was created without
one and needed it later, and a forgotten build command fails *silently* — the
committed generated files deploy fine, just stale.

Here the failure mode is worse than stale: the build is what enforces WCAG AA
on the tokens and checks Rule 06. Without it a contrast regression deploys
without complaint.

The Pages GitHub app is scoped to selected repositories. If the repo does not
appear, add it at
[github.com/settings/installations](https://github.com/settings/installations)
→ Cloudflare Workers and Pages → Configure → Save. The Save button is easy to
miss.

### 5. Attach the custom domain

Pages project → Custom domains → Set up a custom domain → `chapbook.page`.

Cloudflare shows exactly what it will change, and it is one record:

```txt
A      @   216.40.34.41        ->   CNAME  @   chapbook.pages.dev
```

Root CNAME flattening is what lets a root record coexist with other records at
the apex. It went **Active** in under two minutes.

## Verify

```bash
curl -sS -o /dev/null -w "site    %{http_code}\n" https://chapbook.page/
curl -sS -o /dev/null -w "css     %{http_code}\n" https://chapbook.page/chapbook.css
curl -sS -o /dev/null -w "frozen  %{http_code}\n" https://chapbook.page/v1.0.0/chapbook.css
curl -sS -o /dev/null -w "spec    %{http_code}\n" https://chapbook.page/system.md
curl -sS -o /dev/null -w "llms    %{http_code}\n" https://chapbook.page/llms.txt
curl -sS -o /dev/null -w "404     %{http_code}\n" https://chapbook.page/nope
curl -sS -o /dev/null -w "apex    %{http_code}\n" https://aarontaylor.me/
curl -sS -o /dev/null -w "notes   %{http_code}\n" https://notes.aarontaylor.me/
```

The last two matter: two other Pages projects share this zone and nothing here
should have touched either. Check them anyway.

### The CSP carries two script hashes

The specimen inlines two scripts — the theme bootstrap and the skin picker —
and both are admitted by hash rather than by `'unsafe-inline'`:

```bash
curl -sSI https://chapbook.page/ | grep -i content-security-policy
```

Both hashes in the header must match the scripts in the page:

```bash
curl -sS https://chapbook.page/ | python3 -c "
import sys, re, hashlib, base64
for s in re.findall(r'<script>(.*?)</script>', sys.stdin.read(), re.S):
    print('sha256-' + base64.b64encode(hashlib.sha256(s.encode()).digest()).decode())"
```

If they differ, the deployed HTML and the deployed headers came from different
builds. Rebuild and redeploy; do not hand-edit `_headers` to match.

## www

Hover's import left `www A 216.40.34.41`, pointing at the same dead parking IP
as the wildcard. Proxied, that serves a Cloudflare **522** to anyone who types
it.

Deleting it would have been the wrong fix, for the reason recorded on the
`aarontaylor.me` zone: **a Redirect Rule only fires if DNS resolves the
hostname to Cloudflare's edge.** Deleting the record does not tidy `www` — it
breaks it, because the rule never runs.

So `www` is a proxied `CNAME` to the apex, and a redirect rule sends it there:

```txt
DNS     www   CNAME   chapbook.page          Proxied
Rule    www to apex
        match    URI Full wildcard  "https://www.*"
        action   301 -> https://${1}
        preserve query string
```

301 rather than 302: this canonicalisation is genuinely permanent, which is
the distinction the apex notes draw. Reserve 302 for a redirect you expect to
remove.

**Change the record before deploying the rule, not after.** Cloudflare checks
whether `www` is proxied at deploy time and warns that the rule may not apply.
If the record is already a proxied CNAME the warning is stale and *Ignore and
deploy rule anyway* is correct — taking the offered *Create a new proxied DNS
record* instead would add a duplicate.

Verified:

```txt
https://www.chapbook.page/                   301 -> https://chapbook.page/
https://www.chapbook.page/system.md          301 -> https://chapbook.page/system.md
https://www.chapbook.page/llms.txt?ref=test  301 -> https://chapbook.page/llms.txt?ref=test
```

## Mail: a domain that receives but never sends

`chapbook.page` has an `MX` pointing at Hover's forwarding, so it *receives*.
Nothing sends as it: no mailbox was bought, and the project's contact address
is `hi@aarontaylor.me`. Forwarding relays inbound mail onward without putting
`chapbook.page` in the envelope sender, so a hard SPF fail does not break it.

That makes this a **non-sending domain**, which has a settled configuration:

```txt
TXT  @        v=spf1 -all                      no host may send as this domain
TXT  _dmarc   v=DMARC1; p=reject; sp=reject;   reject anything that fails
```

Without these, anyone can put `@chapbook.page` in a From header and a
receiving server has nothing to check it against. `-all` rather than `~all`,
and `p=reject` rather than `p=none`, because the domain genuinely sends
nothing — there is no legitimate mail to soft-fail.

`sp=reject` covers subdomains, which otherwise inherit nothing.

No `rua=` reporting address. Aggregate reports for a domain that sends nothing
are noise, and pointing `rua` at an address on another domain would need an
authorisation record on *that* zone as well.

**If a mailbox is ever added at this domain, both records must change first.**
`-all` will hard-fail the new sender, and `p=reject` will tell receivers to
drop it. That is the whole point of them, and it is also the trap.

Verified in public DNS rather than in the dashboard:

```bash
dig +short TXT chapbook.page            # "v=spf1 -all"
dig +short TXT _dmarc.chapbook.page     # "v=DMARC1; p=reject; sp=reject;"
```

The `MX` was left exactly as imported. Adding TXT records at the apex and at
`_dmarc` cannot affect it, and the `aarontaylor.me` zone is a separate zone
entirely — its six `MX` records and its DKIM fingerprint (`3a045d2a…`) were
confirmed unchanged before and after.

### Not done

A `*._domainkey` record with an empty public key (`v=DKIM1; p=`) would
explicitly revoke DKIM for a domain that has no keys. It is a reasonable third
step for a non-sending domain and would need removing the moment real DKIM is
set up. Left off as more trouble than it is worth here.

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

## The first push did not deploy, and why

Immediately after the project was created the dashboard showed **"This project
is disconnected from your Git account."** The settings page contradicted it:
the repository was attached, automatic deployments were enabled, and the first
build had run from the repo without trouble.

The banner was right and the settings page was misleading. A push to `main`
produced no deployment at all — confirmed by polling the live page for four
minutes and by the deployments list, which still showed only the build from
project creation.

**The cause was the GitHub App's repository scope, not a broken connection.**
The Cloudflare Workers and Pages app is installed with **Only select
repositories**, and `chapbook` was not one of them.

The confusing part is why it half-worked. That setting carries the note *"Also
includes public repositories (read-only)"*, and this repo is public — so
Cloudflare could list it in the create-project flow and clone it for the first
build. What read-only access does **not** give is the push webhook. Hence a
project that builds once, on demand, and then never again.

The fix is one checkbox:

```txt
github.com/settings/installations
  -> Cloudflare Workers and Pages -> Configure
  -> Only select repositories -> add aarontaylor-dev/chapbook
  -> Save
```

The `aarontaylor.me` deploy notes already warned that the Save button is easy
to miss. The sharper lesson is the one above it: **a public repository will
appear in the Pages create flow whether or not the app has been granted it**,
and the first build will succeed either way. Do not treat a successful first
deployment as proof that the integration is wired up. Push something and watch.

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

- **`style.aarontaylor.me` is not set up.** Canonical is `chapbook.page`.
  Whether the personal-site route becomes a redirect here, or a page of its
  own, is undecided. It is a `CNAME` plus a redirect rule on the
  `aarontaylor.me` zone whenever it is wanted.
- **The `MX` record still points at Hover's mail forwarding.** Untouched on
  purpose: nothing here needs mail, and mail config is not this project's to
  guess at.
- No sitemap yet. `robots.txt` references one. Either add it or drop the line.
- The specimen self-hosts no fonts, by design: the system defaults to system
  stacks, and the specimen demonstrates the default rather than an upgrade.
