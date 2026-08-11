# ADR-002 — C# / Roslyn language service

- Status: Accepted (Community M1 implemented)
- Date: 2026-08-11

## Context

Community needs Roslyn-based navigation, completion, diagnostics, and solution loading without depending on proprietary C# Dev Kit binaries.

## Decision

1. Keep the built-in C# TextMate grammar for syntax highlighting and snippets.
2. Pin the MIT-licensed `csharp-ls` tool at `0.26.0` and install it per IDE profile with `dotnet tool install --tool-path`.
3. Allow an explicit executable through `pcl.community.csharpLsPath`; otherwise use the managed install, then `PATH` as a final fallback.
4. Start the server only for trusted file workspaces and watch `.csproj`, `.slnx`, and `Directory.Build.*` changes.
5. Decode server stderr as UTF-8 and classify its structured `debug/info/warn/error` records by content. `csharp-ls` writes normal .NET logs to stderr, so stream choice alone must not mark them as errors.

## Consequences

- Community provides real Roslyn language features while keeping the binary out of the application package.
- First use requires network access unless the tool is already installed or a path is configured.
- The pinned version and per-profile install directory make upgrades explicit and reversible.
