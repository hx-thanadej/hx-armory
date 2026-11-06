# Armory

## Goal

A developer opens a web page, ticks the infrastructure pieces they want (Terraform
resources, Helm charts, Kubernetes YAML, plain CLI commands), fills in a few fields,
and gets back files and commands to copy. This removes the wait on the infra team.

## Decisions already made (by the user, do not revisit)

- Brand new standalone app. No auth, no login, no backend, no database.
- Nothing is executed or applied by the app. It only produces text: files and shell
  commands the developer runs themselves. So there are no credentials anywhere.
- Static single page app. Vite + React + TypeScript, deployable to any static host.
- The infra team adds an item by adding one entry to the catalog. No code changes
  elsewhere.

## Data shape

`src/catalog/types.ts` is the contract. A `CatalogItem` is plain data: typed `params`,
`files` (path + template) and `commands` (templates). `kind` is a label used for
grouping and badges, not a branch point in the renderer. All four kinds render the
same way, so there is one render path and no per-kind `if` chains.

Template syntax, deliberately tiny:

- `{{key}}` substitutes a param value or a Context value (`project`, `env`,
  `namespace`) or `dir` (the item id, its output directory).
- `{{#if key}}...{{/if}}` includes the block when a boolean param is true.
- An unknown key throws `TemplateError` naming the item and key. Never render a
  silent blank.

## Modules

- `src/catalog/types.ts` already written. Do not change a type without saying why.
- `src/catalog/template.ts` the template engine above, pure.
- `src/catalog/render.ts` `render(selections, ctx): Bundle`. Pure. Validates values
  against `Param` (required, pattern, min/max, select options) and returns errors as
  data rather than throwing for user input. Output file path is `<item.id>/<file.path>`.
  `Bundle.script` is a `deploy.sh` with `set -euo pipefail` that writes every file with
  a quoted heredoc and then runs each item's commands under a `# --- <name> ---` header.
- `src/catalog/items/*.ts` one file per item or per group, plus `src/catalog/index.ts`
  exporting `catalog` and failing at import time on duplicate ids or on a param key
  that collides with a Context key.
- `src/App.tsx` and small components. Layout: left, catalog grouped by category with
  search and kind filter, each row a checkbox. Middle or top, shared context fields.
  Per selected item, a card with its param form. Right or bottom, the output: file tabs
  with Copy and Download per file, a commands list with Copy, and a "Download deploy.sh"
  button. Selection and values live in the URL hash so a link reproduces the page.
- Keep state in one reducer. No state library.

## Starter catalog (real, correct, runnable)

Terraform: AWS S3 bucket (versioning, encryption, public access block), AWS SQS queue
with optional DLQ, AWS RDS PostgreSQL (small defaults), Tencent COS bucket
(`tencentcloud_cos_bucket`).
Helm: Bitnami Redis, Bitnami PostgreSQL, ingress-nginx.
Manifest: Deployment + Service (+ optional Ingress), CronJob, NetworkPolicy default deny.
Command: create namespace, create image pull secret.

Only use resource and chart arguments you are sure exist. A wrong example is worse
than no example.

## Tests (vitest), behavior only

- Every catalog item renders with its defaults and produces non-empty files.
- Template: substitution, `#if` on and off, unknown key throws with item and key.
- Render: validation errors for a bad pattern, an out of range number, a bad select
  option; output paths; `deploy.sh` contains each file's heredoc and each command.
- Catalog import fails on a duplicate id and on a param key that shadows a Context key.

## Done means

`pnpm test`, `pnpm lint` (tsc --noEmit is fine), and `pnpm build` pass, and
`pnpm dev` serves a page where ticking two items shows both outputs and the downloaded
`deploy.sh` passes `bash -n`.

## Style

No comments except a non-obvious why. No long dashes in prose or strings. Small files.
