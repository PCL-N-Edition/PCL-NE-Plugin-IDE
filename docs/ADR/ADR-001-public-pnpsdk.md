# ADR-001 — Public PNPSDK, Analyzer, and template distribution

- Status: Accepted (Community M1 baseline)
- Date: 2026-08-09

## Context

M1 requires project templates, Analyzer diagnostics, and build/package/validate tooling. The external Public PNPSDK package feed is not yet a frozen public product.

## Decision

1. Ship a **reference Community CLI** at `tools/pnp-community-cli` implementing the public command surface:
   - `pnp build`
   - `pnp sign` (development signature only)
   - `pnp package`
   - `pnp validate`
   - `pnp --version`
2. Treat `plugin.manifest.json` schema in `extensions/pcl-community/schemas/` as the **versioned public contract** (`schemaVersion: "1.0"`).
3. Built-in extension `pcl-community` auto-detects the in-repo CLI and allows override via `pcl.community.cliPath`.
4. When a real Public PNPSDK npm/nuget distribution is published, replace the reference CLI behind the same commands without breaking fixtures.

## Consequences

- Developers can complete create → build → package → validate without private packages.
- Production signing and marketplace registry remain out of scope (M4 / other editions).
- Analyzer diagnostics use a stable text pattern mapped into Problems (`path(line,col): severity PCLcode: message`).
