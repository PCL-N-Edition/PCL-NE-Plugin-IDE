# PCL NE Plugin IDE — Community Edition

> **This repository contains and publishes Community Edition only.**

PCL NE Plugin IDE Community Edition is the open-source Community distribution of the PCL-N plugin development environment, built on top of Microsoft [`Code - OSS`](https://github.com/microsoft/vscode).

The project provides a focused development environment for the PCL-N plugin ecosystem while retaining the editor, Extension API / Extension Host, source-control, terminal, debugging, settings, theme, and workbench foundations inherited from Code - OSS.

## Edition scope

This repository is the public source and release repository for **Community Edition**.

| Edition | Source / releases in this repository |
|---|---:|
| **Community Edition** | **Yes** |
| Ultimate Edition | No |
| Teams Edition | No |
| Developer Edition | No |

Ultimate Edition, Teams Edition, and Developer Edition are separate products and are **outside the scope of this repository**.

This repository does **not**:

- publish builds of Ultimate Edition, Teams Edition, or Developer Edition;
- contain or promise publication of source code for those editions;
- contain their private feature modules, entitlement systems, internal tooling, private release pipelines, or internal Sidecar implementations;
- act as the release channel or source-of-truth repository for any non-Community edition.

Shared protocols, concepts, interfaces, components, or upstream Code - OSS code between editions do not make this repository a source distribution for those other editions.

See [`docs/PCL-COMMUNITY-EDITION.md`](docs/PCL-COMMUNITY-EDITION.md) for the formal repository boundary.

See [`docs/PCL-COMMUNITY-PLAN.md`](docs/PCL-COMMUNITY-PLAN.md) for the Community product architecture, current coverage, delivery milestones, and acceptance gates.

## Community Edition goals

Community Edition is intended to provide a complete baseline workflow for normal third-party PCL-N plugin development. Planned Community-facing capabilities include:

- PCL-N plugin project and workspace support;
- C# language support using the project's Roslyn/LSP toolchain;
- PCL-N plugin Manifest editing and validation;
- AXAML editing and PCL-specific visual design / preview tooling;
- localization tooling;
- integration with the public PCL-N Plugin SDK and analyzers;
- `.pnp` build, development signing, validation, and packaging workflows;
- connection to **Developer Sidecar Standard**;
- standard plugin deployment, reload, logging, lifecycle inspection, and debugging workflows.

Advanced capabilities belonging to other editions are intentionally not defined as Community Edition deliverables by this repository.

## Relationship to Code - OSS

This project is based on the open-source Visual Studio Code repository, commonly referred to as **Code - OSS**.

Code - OSS provides the editor and workbench foundation. PCL-N-specific functionality is developed on top of that foundation, with the goal of keeping long-term divergence controlled enough to continue integrating upstream maintenance and security updates.

Current product version: **0.1.0-alpha**. Upstream Code - OSS/API compatibility version: **1.133.0**. These are intentionally separate so built-in extensions validate against the upstream API version while About and release artifacts identify the Community product version.

This project is **not** Microsoft Visual Studio Code and is not distributed under the Microsoft Visual Studio Code product license. Access to the Microsoft Visual Studio Marketplace or proprietary Microsoft extensions is not implied by this repository.

## Development status

**Current milestone delivery: M0 + M1 (Community Alpha).**

| Milestone | Status | Summary |
|---|---|---|
| **M0** Fork baseline | Done | Community identity, modern-only UI, allowlisted product surface, CI and security boundary |
| **M1** Plugin project alpha | Done | Create/open project → Roslyn → build → development sign → package → validate |
| M2 Runtime & debug | Planned | Sidecar Standard, install/reload, DAP |
| M3 Authoring | Planned | Manifest designer, AXAML |
| M4 Community 1.0 | Planned | Registry, installers, update channel |

### M1 quick start (plugin pipeline)

```bash
# Windows
pwsh -File scripts/pcl-m1-e2e.ps1

# macOS / Linux
bash scripts/pcl-m1-e2e.sh
```

In the IDE (after building from sources), use the **PCL** command palette entries from the `pcl-community` built-in extension.

### Trimming policy

1. disable or stop shipping an unwanted feature first;
2. retain upstream source temporarily when that materially reduces upstream-sync cost;
3. physically remove code only after its dependency and maintenance impact is understood.

See [`docs/PCL-TRIM-LIST.md`](docs/PCL-TRIM-LIST.md). Copilot product packaging and the `extensions/copilot` tree are removed. Retained upstream Chat/Agent service code is compile-only compatibility scaffolding: Community registers no Chat/Agent view, status, account entry, process, or `defaultChatAgent`.

## Contributing

Contributions to **Community Edition** are welcome. Issues and pull requests in this repository should concern:

- Community Edition features and fixes;
- the open-source foundation required by Community Edition;
- PCL-N plugin development tooling exposed by Community Edition;
- upstream integration work required to maintain this fork.

Requests for publication of Ultimate Edition, Teams Edition, or Developer Edition source code or releases are outside this repository's scope.

For code inherited directly from Code - OSS, the upstream development documentation remains useful:

- [Code - OSS repository](https://github.com/microsoft/vscode)
- [How to Contribute to Code - OSS](https://github.com/microsoft/vscode/wiki/How-to-Contribute)

## License and upstream attribution

The Code - OSS source base is licensed under the MIT License. See [`LICENSE.txt`](LICENSE.txt).

Original Code - OSS copyright notices and applicable third-party notices must be preserved in accordance with their licenses.

PCL-N-specific additions in this repository are distributed under the repository's applicable open-source licensing terms unless an individual file states otherwise.

---

**Important:** publication of Community Edition source code does not constitute an announcement, guarantee, or obligation to open-source or publish any other PCL NE Plugin IDE edition.
