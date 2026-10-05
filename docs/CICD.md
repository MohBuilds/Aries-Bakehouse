# CI/CD

One workflow, `.github/workflows/ci-cd.yml`, ships everything.

| Event | What runs |
|---|---|
| Pull request, push to `staging` | Lint, build, migration check (if SQL changed), Vercel **preview** |
| Push to `main` | Lint, build, migration check → **migrate production DB** (if new migrations) → **deploy edge functions** (if changed) → **Vercel production deploy** |

The order is deliberate: the database is migrated before the new code goes live,
so the app never runs against a schema it doesn't match. Write migrations to be
backward compatible (add columns/tables first, remove old ones in a later
release) so the old code keeps working during the short gap.

Vercel's own Git deploys are turned off (`vercel.json`); Actions is the single
deploy path. That is what guarantees the ordering above.

## One-time setup

### 1. GitHub secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create (scope: your team) |
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens → Generate |
| `SUPABASE_DB_PASSWORD` | Supabase project → Settings → Database → database password (reset it there if unknown) |

### 2. GitHub variables (same page → Variables)
Already set by the initial setup: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`,
`SUPABASE_PROJECT_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`. (All public values. CI only uses them to
validate the build; Vercel builds production with its own stored variables.)

### 3. Baseline the production database (once)

> **Done on 2026-10-05:** the 14 original migrations were recorded as applied and
> `20261005000100_ordering_hardening` was pushed. Skip this step unless you create a new
> Supabase project.
Production was built by hand-running SQL, so its migration history is empty. Until
it's recorded, the migrate job refuses to run (it would otherwise try to re-apply
the whole schema to live data).

1. Actions → **Database baseline** → Run workflow with *record* **off**. Open the
   run summary: it shows any differences between the live schema and
   `supabase/migrations`. No differences means the migrations describe production exactly.
2. If the diff is empty (or only harmless noise), run it again with *record* **on**.
   This only writes rows to the migration history table; no schema or data changes.

From then on, every migration you push to `main` is applied automatically.

## Day to day

```bash
supabase migration new add_something      # creates supabase/migrations/<timestamp>_add_something.sql
# edit it, commit, open a PR: CI replays all migrations on a fresh database
# merge to main: it is applied to production, then the app deploys
```

## Optional hardening
- Branch protection on `main` (Settings → Branches): require the *Lint & build* and
  *Migrations apply cleanly* checks before merging.
- Add an approval gate to production by giving the `migrate` / `deploy-production`
  jobs a GitHub Environment with required reviewers (needs a paid GitHub plan for private repos).
