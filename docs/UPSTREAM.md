# Upstream Code - OSS tracking

## Baseline

| Field | Value |
|---|---|
| Upstream remote | `https://github.com/microsoft/vscode.git` |
| Upstream project | Microsoft Visual Studio Code / Code - OSS |
| Fork remote | `origin` → `https://github.com/PCL-N-Edition/PCL-NE-Plugin-IDE.git` |
| Baseline branch | `main` |
| Baseline date | 2026-08-09 |
| Baseline commit (at Community branding) | `28144426f94` (`chore: brand Community Edition product`) and subsequent Community CI commits |
| Product version field | Root `package.json` `version` tracks the Code - OSS version line (currently `1.133.0`) |

Community-specific commits after the branding baseline are intentional product divergence and must not be overwritten by a blind upstream reset.

## Recommended remotes

```bash
git remote add upstream https://github.com/microsoft/vscode.git   # once
git fetch upstream --tags
git log --oneline HEAD..upstream/main | head
```

## Sync process

1. **Read release notes / security advisories** for the upstream range being merged.
2. **Fetch** `upstream` and identify the target tag or commit (prefer upstream stable tags when possible).
3. **Merge** (not rebase of public `main`) into a topic branch:
   ```bash
   git checkout -b sync/upstream-YYYY-MM-DD
   git merge <upstream-tag-or-sha>
   ```
4. **Resolve conflicts** with preference for:
   - keeping Community `product.json`, docs, fixtures, `extensions/pcl-community`, and GitHub workflows under `.github/workflows/community-*`;
   - accepting upstream security fixes in `src/` unless a documented Community patch exists;
   - re-applying trim policy from `docs/PCL-TRIM-LIST.md` if upstream reintroduces excluded packaging paths.
5. **Validate**:
   - `npm ci` (or documented bootstrap)
   - `npm run typecheck-client` (when `src/` changed)
   - `npm run compile` when feasible
   - Community workflow `community-build-validation.yml`
   - `bash scripts/pcl-m1-e2e.sh` (or `pwsh scripts/pcl-m1-e2e.ps1`)
6. **Record** the merged upstream SHA in the PR description and update this file's baseline table.

## Do not

- Force-push `main` to rewrite published Community history.
- Reintroduce Copilot packaging, Marketplace-only proprietary endpoints, or non-Community edition modules.
- Drop MIT license headers or third-party notices required by upstream.

## Conflict hotspots

Expect frequent conflicts in:

- `product.json`
- `package.json` / `package-lock.json`
- `.github/workflows/*`
- `build/npm/dirs.ts`, `build/lib/extensions.ts`
- branding strings and about-dialog content
