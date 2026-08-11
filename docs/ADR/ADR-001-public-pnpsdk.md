# ADR-001 — Public PNPSDK, Analyzer, and template distribution

- Status: Accepted (Community M1 implemented)
- Date: 2026-08-11

## Context

M1 requires a real, publicly restorable project rather than a placeholder CLI or an IDE-specific package format. The canonical public toolchain is the .NET SDK plus the `PCLN.Plugin.*` NuGet packages.

## Decision

1. Generated projects target .NET 10 and pin Public PNPSDK `0.2.5`.
2. Projects reference `PCLN.Plugin.Abstractions`, `PCLN.Plugin.Sdk`, `PCLN.Plugin.Analyzers`, and `PCLN.Plugin.Sdk.Build` through NuGet.
3. Restore, build, development signing, and `.pnp` generation run through the package-provided MSBuild targets. Community does not ship a replacement `pnp` CLI.
4. The built-in `pcl-community` extension invokes `dotnet` without a shell, exposes the path through `pcl.community.dotnetPath`, maps Analyzer output to Problems, and validates the resulting ZIP structure.
5. `fixtures/hello-pcl` is the versioned golden project used by both PowerShell and Bash end-to-end tests.

## Consequences

- The IDE exercises the same public SDK path as third-party plugins.
- A successful M1 test proves restore, compile, Analyzer execution, development OpenPGP signing, packaging, and structural validation.
- Production signing, Registry publication, and private/internal SDKs remain out of scope.
