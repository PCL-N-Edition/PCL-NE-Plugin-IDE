# Community Edition — keep / stop-packaging / delete list

Policy (from the Community plan): **stop packaging first**, retain upstream source when that reduces sync cost, **physically delete** only after dependency impact is understood.

Last audit: 2026-08-09 (M0 completion pass).

## Product surface (ship)

| Area | Decision | Notes |
|---|---|---|
| Editor / workbench / Extension Host | **Keep** | Code - OSS foundation |
| Terminal, SCM/Git, Debug UI, Testing UI, Search, Problems, Output | **Keep** | Plugin development basics |
| New UI themes (`Dark 2026`, `Light 2026`, High Contrast) | **Keep** | Default Community UI |
| `theme-defaults`, `theme-modern-icons`, `theme-seti`, solarized themes | **Keep** | Accessibility + modern icons |
| C# grammar (`extensions/csharp`) | **Keep** | Language baseline; full Roslyn LS tracked under ADR-002 |
| XML / YAML / JSON / Markdown / JS/TS / PowerShell / Shell / HTML / CSS / Diff / Log / Dotenv / Ini | **Keep** | Manifest, docs, scripts, config |
| `pcl-community` built-in extension | **Keep** | M1 project/build/package tooling |
| GitHub + authentication extensions | **Keep (packaged)** | Issue reporting / optional auth; no Copilot |
| Emmet, media-preview, merge-conflict, references-view, search-result, simple-browser, npm, configuration-editing, extension-editing, debug-auto-launch, debug-server-ready, terminal-suggest | **Keep** | General IDE quality |

## Stop packaging (sources may remain)

Configured in `build/lib/extensions.ts` → `excludedExtensions`.

| Extension group | Decision | Rationale |
|---|---|---|
| `copilot` | **Stop + deleted sources** | Not part of Community product |
| Notebooks (`ipynb`, `notebook-renderers`) | **Stop packaging** | Not required for PCL-N plugins |
| Unneeded languages (Python, Java, Go, Rust, …) | **Stop packaging** | C# / XML / JSON focused IDE |
| `grunt` / `gulp` / `jake` | **Stop packaging** | Rare for PCL-N plugin workflows |
| `tunnel-forwarding` | **Stop packaging** | Tunnel product surface not Community-critical |
| `mermaid-markdown-features`, `prompt-basics` | **Stop packaging** | Agent/docs adjacent; not required |
| Legacy color themes (abyss, monokai, …) | **Stop packaging** | New UI only |
| Test-only extensions | **Stop packaging** | Dev/test only |

## Deleted / no-op

| Path / feature | Status |
|---|---|
| `extensions/copilot/**` | **Deleted** from the tree |
| GitHub Actions: `chat-*`, `copilot-setup-steps`, `sessions-e2e` | **Deleted** |
| Azure `product-copilot*.yml` and `build/azure-pipelines/copilot/**` | **Deleted** |
| `downloadCopilotVsix.ts` | **No-op stub** for residual pipeline references |
| About dialog Copilot version lines | **Removed** |

## Deferred (source retained for upstream sync)

| Area | Status | Follow-up |
|---|---|---|
| `src/vs/workbench/contrib/chat/**` | Source remains; no Community `defaultChatAgent` product config | Evaluate feature-gating / later delete after isolation |
| `src/vs/platform/agentHost/**` | Source remains; depends on npm agent SDKs for compile | ADR for full agent stack removal |
| `@github/copilot*` npm dependencies | Still present for agentHost compile graph | Remove when agentHost is excised or stubbed |
| Microsoft Marketplace gallery endpoints | Not configured in Community `product.json` | Keep unset |
| Telemetry | `enableTelemetry: false` in `product.json` | Confirm runtime honors flags on all platforms |

## Authentication / update / tunnel audit

| Endpoint / system | Community stance |
|---|---|
| VS Marketplace | Not configured — Community does not promise Marketplace access |
| Update channel | Not yet configured (M4) |
| Tunnel application names | Present as identifiers only; tunnel extension not packaged |
| Telemetry | Disabled by product configuration |
| Report issue URL | Points at this GitHub repository |

## Re-audit triggers

- Upstream major merge
- Adding a new built-in extension
- Introducing network endpoints (Registry, Sidecar, update)
- Any request to re-enable Chat/Agent UI
