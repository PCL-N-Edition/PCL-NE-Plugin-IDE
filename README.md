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

This project is **not** Microsoft Visual Studio Code and is not distributed under the Microsoft Visual Studio Code product license. Access to the Microsoft Visual Studio Marketplace or proprietary Microsoft extensions is not implied by this repository.

## Development status

PCL NE Plugin IDE is under active development. The repository currently retains substantial upstream Code - OSS code while PCL-N-specific product layers are introduced and unnecessary distribution components are evaluated for exclusion or removal.

The preferred trimming policy is:

1. disable or stop shipping an unwanted feature first;
2. retain upstream source temporarily when that materially reduces upstream-sync cost;
3. physically remove code only after its dependency and maintenance impact is understood.

The objective is a focused Community distribution without creating an unnecessarily difficult-to-maintain fork.

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
