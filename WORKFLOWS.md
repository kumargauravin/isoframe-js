# GitHub Workflows and Custom Actions

This repository uses standardized workflows and reusable actions for CI, npm publishing, release tagging, and GitHub Pages demo deployments.

## Workflow Overview

### `ci.yml`
- **Triggers**: push/pull_request to `main`
- **Purpose**: validate code quality and build readiness
- **Jobs**:
  - `lint`: runs `npm run lint`
  - `test`: runs `npm run test`
  - `build-packages`: builds all library packages
  - `build-demos` (matrix): attempts demo builds for `demo-react` (Next.js), `demo-angular`, and `demo-vue`

### `create-release-tag.yml`
- **Trigger**: manual (`workflow_dispatch`)
- **Purpose**: bump package versions, create git tag, create GitHub Release
- **Inputs**:
  - `version`
  - `release_notes`
  - `bump-strategy` (`single` or `monorepo`)
  - `package-path` (used for `single` strategy)

### `publish-npm.yml`
- **Triggers**: push tags `v*.*.*`, manual dispatch
- **Purpose**: publish npm packages using reusable publish action and trigger demo redeploy
- **Required secret**: `NPM_TOKEN`
- **Permissions**: `contents: write`, `id-token: write`, `actions: write`

### `deploy-pages.yml`
- **Triggers**: push to `main`, manual dispatch
- **Purpose**: build demos, combine outputs into one Pages artifact, deploy to GitHub Pages
- **Deployment layout**:
  - `/nextjs/` -> current Next.js demo (`apps/demo-react`)
  - `/angular/` -> planned Angular demo
  - `/vue/` -> planned Vue 3 demo
  - `/index.html` -> landing page (`apps/demo-landing/index.html`)

### `trigger-deploy.yml`
- **Triggers**: manual dispatch, successful completion of `publish-npm.yml`
- **Purpose**: dispatch `deploy-pages.yml`
- **Permissions**: `contents: read`, `actions: write`

---

## Reusable Custom Actions

### `.github/actions/setup-monorepo`
Standard setup action for monorepo workflows.

**Inputs**:
- `node-version` (default: `22`)
- `install-command` (default: `npm ci`)
- `cache-key` (optional placeholder)

**What it does**:
1. Sets up Node.js with npm cache
2. Installs dependencies
3. Verifies Nx CLI availability

### `.github/actions/deploy-demo`
Builds one demo app and reports whether it was skipped.

**Inputs**:
- `demo-name`
- `workspace-name`
- `build-command` (default: `build`)
- `output-path`
- `node-version`
- `base-path`
- `install-command`
- `build-packages-command`

**Outputs**:
- `artifact-path`
- `skipped`

### `.github/actions/publish-modules`
Publishes one or more npm packages only when target versions are not already in the registry.

**Inputs**:
- `npm-token`
- `node-version`
- `packages` (JSON array of package paths)
- `registry-url` (default npmjs)
- `install-command`
- `build-command`

**Behavior**:
1. Installs and optionally builds packages
2. Reads package name/version from each target package
3. Checks npm registry for existing version
4. Publishes with `--provenance` only when version does not exist

---

## Adding a New Demo Framework

1. Create `apps/<demo-name>` with `package.json` and a `build` script.
2. Confirm build output path.
3. Update matrix entries in:
   - `.github/workflows/ci.yml` (`build-demos`)
   - `.github/workflows/deploy-pages.yml` (`build-demos`)
4. Ensure landing page includes the framework link.

---

## Isomorphic Usage Patterns for Demos

Each demo should demonstrate:
1. **Browser-side usage** (client components/composables/services)
2. **Server-side usage** (SSR/server routes)
3. **Build-time usage** (static generation)
4. **Node backend usage** (API routes/server processing)

### Import patterns
- Keep shared isomorphic logic in the core packages (`@nice-tools/isoframe`, `@nice-tools/isocsv`, `@nice-tools/isojson`).
- Use framework-specific wrappers only where needed (`@nice-tools/isoframe-react`, future Angular/Vue wrappers).

---

## Troubleshooting

- **Demo skipped in matrix**: action could not find `apps/<demo-name>/package.json` yet.
- **Publish skipped**: target package version already exists in npm.
- **Publish fails with auth errors**: verify `NPM_TOKEN` is present and valid.
- **Pages deploy missing route**: ensure demo artifact exists and output path is correct.

---

## Repository Pattern Notes

- `isoframe-js`: multi-package monorepo, Node.js 22, `npm ci`
- `fake-llm`: single-package pattern, Node.js 20, often `npm install --legacy-peer-deps`

Use the same workflow structure across both repositories and vary only repository-specific configuration.
