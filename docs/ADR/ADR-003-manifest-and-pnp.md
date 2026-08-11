# ADR-003 — Project metadata, manifest, and `.pnp` contract

- Status: Accepted (Community M1 implemented)
- Date: 2026-08-11

## Decision

### Project metadata

- `*.nplug` identifies a PCL plugin workspace and points to its `.csproj`, `.slnx`, and manifest.
- The M1 metadata schema is `extensions/pcl-community/schemas/nplug.schema.json` with `schemaVersion: "1.0"`.
- Explorer hides `bin`, `obj`, `dist`, `.csproj`, `.slnx`, `.nplug`, and `.config` entries by default so authoring files remain the primary surface. Users can override `files.exclude`.

### Manifest

- The package manifest is `plugin.json` at project root.
- Its public contract is validated by `extensions/pcl-community/schemas/plugin.schema.json` and by the PNPSDK Analyzer/MSBuild pipeline.
- The entry assembly is placed under `lib/net10.0/`.

### Package

- Public PNPSDK emits `{id}-{version}.pnp` as a ZIP-compatible archive.
- Community validation requires `plugin.json`, `META-INF/pnp.files.json`, `META-INF/pnp.signed.json`, an entry assembly, a development public key, and an OpenPGP signature.
- Development signing is suitable only for local/test workflows; no production key is stored in the repository or package.

### Reproducibility

- `fixtures/hello-pcl` is the golden path.
- CI runs `scripts/pcl-m1-e2e.sh` or `.ps1`, extracts the package, validates required entries, and scans text content for private-edition or private-key markers.
