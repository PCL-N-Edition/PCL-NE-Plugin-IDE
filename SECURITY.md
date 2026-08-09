<!-- Community Edition security policy for PCL-N-Edition/PCL-NE-Plugin-IDE -->

## Security

The PCL NE Plugin IDE Community Edition maintainers take security seriously.

**Please do not report security vulnerabilities through public GitHub issues.**

### Reporting a vulnerability

Email security reports related to **this Community Edition repository** to the maintainers via a private channel:

1. Prefer [GitHub Security Advisories](https://github.com/PCL-N-Edition/PCL-NE-Plugin-IDE/security/advisories/new) for this repository when available.
2. If private advisories are unavailable, open a minimal public issue titled `SECURITY CONTACT REQUEST` without vulnerability details and wait for a maintainer to establish a private channel.

Include:

- affected version / commit SHA
- environment (OS, arch)
- reproduction steps
- impact assessment
- whether the issue is inherited from Code - OSS / Electron / dependencies

### Scope

In scope for this repository:

- Community Edition product builds and update artifacts published from this repository
- Community built-in extensions (including `pcl-community`)
- Reference CLI under `tools/pnp-community-cli`
- Packaging scripts and GitHub Actions workflows owned by this repository

Out of scope:

- Ultimate / Teams / Developer Edition products
- Private Sidecar implementations not distributed here
- Upstream Code - OSS issues that should be reported to [microsoft/vscode](https://github.com/microsoft/vscode/security) when they are not introduced by Community-specific changes

### Artifact expectations

Community release artifacts must not contain:

- private signing keys or entitlement secrets
- non-Community edition modules
- hardcoded private API endpoints

CI runs a package content scan as part of the M1 fixture e2e path.

### Upstream attribution

Portions of this repository are derived from Code - OSS. Upstream security guidance remains relevant for inherited components:

- [Microsoft SECURITY.md](https://aka.ms/SECURITY.md)
