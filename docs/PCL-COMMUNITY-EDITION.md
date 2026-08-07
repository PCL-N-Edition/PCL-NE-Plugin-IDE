# PCL NE Plugin IDE Community Edition — Repository Boundary

## Purpose

This document defines the scope of the public `PCL-N-Edition/PCL-NE-Plugin-IDE` repository.

This repository is the **source, development, issue-tracking, and release repository for PCL NE Plugin IDE Community Edition only**.

## Edition ownership

| Edition | Managed by this repository | Public source obligation from this repository |
|---|:---:|:---:|
| Community Edition | Yes | Yes, subject to the repository license |
| Ultimate Edition | No | No |
| Teams Edition | No | No |
| Developer Edition | No | No |

## In scope

The following are in scope when they are part of Community Edition or are required to maintain its open-source foundation:

- Code - OSS upstream integration and maintenance;
- Community Edition branding and product configuration;
- Community plugin-development workflows;
- public PCL-N Plugin SDK integration;
- Roslyn/LSP-based C# development support used by Community Edition;
- Manifest, AXAML, localization, analyzer, build, packaging, signing, and validation tooling exposed by Community Edition;
- Developer Sidecar Standard integration exposed by Community Edition;
- standard debugging, logging, plugin reload, lifecycle, and inspection capabilities;
- public documentation, tests, CI, and release automation for Community Edition.

## Explicitly out of scope

The following are not owned, released, or required to be open-sourced by this repository:

### Ultimate Edition

- Ultimate-specific feature modules;
- Developer Sidecar Advanced distribution logic specific to Ultimate;
- premium diagnostic and inspection features;
- paid/sponsor entitlement implementation;
- Ultimate release artifacts and release pipelines.

### Teams Edition

- team collaboration services;
- organization administration and policy systems;
- shared workspaces, shared sandboxes, review/approval infrastructure, and team-specific cloud services;
- Teams entitlement, billing, deployment, and release infrastructure.

### Developer Edition

Developer Edition is intended for internal PCL-N platform development. This repository does not publish or promise publication of:

- PCL-N internal development tooling;
- private PCL-N or `PCL.Plugin` implementation access;
- Internal Developer Sidecar modules;
- raw internal IPC/protocol tooling;
- private debug symbols or internal service graphs;
- internal feature flags, recovery tools, migration tools, or privileged test infrastructure;
- internal CI/CD and release infrastructure.

## Shared technology does not change repository scope

Different editions may share:

- Code - OSS upstream code;
- public interfaces and protocols;
- SDK contracts;
- file formats;
- selected reusable components;
- concepts such as Sidecar connectivity, workspaces, debugging, or design tooling.

Such sharing does not make non-Community editions derivatives that must be distributed from this repository, nor does it make their private modules part of Community Edition.

A component belongs to this repository only when it is intentionally included in the Community Edition source distribution or is required to maintain that distribution under its applicable license.

## Sidecar boundary

Community Edition may integrate with **Developer Sidecar Standard** as part of the public plugin-development workflow.

Support for or protocol compatibility with more privileged Sidecar editions does not imply that their implementation, binaries, signing infrastructure, authorization logic, or release system belongs in this repository.

In particular:

- Standard functionality exposed to Community Edition should depend only on public or explicitly Community-facing contracts;
- Advanced and Internal capabilities must not be required to build or use Community Edition;
- Community builds must not accidentally package private Advanced/Internal modules or secrets.

## Release boundary

GitHub Releases, packages, CI artifacts, update manifests, and other distribution channels owned by this repository must be treated as **Community Edition channels** unless explicitly documented otherwise for repository maintenance purposes.

No workflow in this repository should publish Ultimate Edition, Teams Edition, or Developer Edition binaries.

## Contribution boundary

Issues and pull requests are welcome when they affect Community Edition or the shared open-source foundation required by Community Edition.

Requests whose primary purpose is to obtain, publish, or modify private implementation details of Ultimate Edition, Teams Edition, or Developer Edition are outside this repository's scope.

## Security and accidental disclosure

Contributors and maintainers should avoid committing any non-Community material, including:

- private signing keys or credentials;
- entitlement-service secrets;
- internal endpoints;
- non-public Developer Sidecar modules;
- Teams service credentials or configuration;
- private PCL-N implementation code not intended for Community Edition;
- internal release artifacts or debug symbols.

If such material is accidentally committed, treat it as a security incident rather than as an implicit decision to publish that edition.

## Licensing and upstream attribution

This repository remains subject to the licenses of Code - OSS and all other incorporated third-party components. This edition boundary does not override any applicable open-source license obligation for code actually distributed in this repository.

Conversely, the fact that Community Edition is open source does not by itself impose a publication commitment on separately developed non-Community components that are not governed by such an obligation.

## Summary

`PCL-N-Edition/PCL-NE-Plugin-IDE` means:

> **PCL NE Plugin IDE Community Edition and the open-source foundation required to build, maintain, and distribute it.**

It does **not** mean a monorepo or public release channel for Ultimate Edition, Teams Edition, or Developer Edition.
