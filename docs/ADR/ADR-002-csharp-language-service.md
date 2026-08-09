# ADR-002 — C# / Roslyn language service

- Status: Accepted (interim for M1)
- Date: 2026-08-09

## Context

Full Roslyn Language Server packaging has license, binary size, update, and signing implications.

## Decision (M1 interim)

1. Ship **C# TextMate grammar** (`extensions/csharp`) for highlighting and snippets.
2. Use **`dotnet build`** via the Community `pnp` CLI for compile diagnostics in M1.
3. Defer embedding a full Roslyn LS / OmniSharp binary into the product until a dedicated distribution and update story exists.
4. Extension setting `pcl.community.dotnetPath` configures the SDK used for environment checks.

## Follow-up

- Evaluate C# Dev Kit licensing (not acceptable for pure OSS product binary without clear terms).
- Prefer an OSS Roslyn LS or `csharp-ls` style server with explicit version pinning in M2/M3.

## Consequences

- M1 exit criteria focus on project + package pipeline correctness, not full IntelliSense parity with Visual Studio.
