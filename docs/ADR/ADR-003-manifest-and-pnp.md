# ADR-003 — Manifest schema and `.pnp` package contract

- Status: Accepted (Community M1 baseline)
- Date: 2026-08-09

## Decision

### Manifest

- File name: `plugin.manifest.json` at project root
- Schema id: `https://pcln.top/schemas/plugin.manifest.schema.json`
- Required fields: `schemaVersion`, `id`, `name`, `version`, `sdkVersion`, `entry.assembly`, `entry.type`
- `schemaVersion` constant: `"1.0"`

### Package

- Artifact name: `{id}-{version}.pnp` (marker JSON) plus content directory `{id}-{version}/`
- Content must include packaged `plugin.manifest.json` and entry assembly path
- Development signature file: `development.sig.json` (SHA-256 over identity payload; not a production PKI signature)

### Reproducibility

- Fixture `fixtures/hello-pcl` is the golden path
- CI runs `scripts/pcl-m1-e2e.sh` / `.ps1` and scans for private markers
