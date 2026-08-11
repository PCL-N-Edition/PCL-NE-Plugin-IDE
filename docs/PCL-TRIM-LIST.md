# Community Edition — packaging and feature boundary

Last audited: 2026-08-11 (M0–M1 release pass).

Community uses an explicit allowlist. A new upstream built-in extension is not shipped merely because it appears under `extensions/`.

## Product surface kept

| Area | Decision |
|---|---|
| Editor, workbench, Extension Host | Keep |
| Explorer, Search, Problems, Output | Keep |
| Terminal, Tasks, SCM/Git | Keep |
| Debug and Testing foundations | Keep for current and later PCL adapters |
| Webview and Custom Editor foundations | Keep for M3 authoring tools |
| Modern floating-panel UI | Always enabled; user toggle removed |
| Themes | Dark 2026, Light 2026, and High Contrast only |
| File icons | Modern icon theme with PCL/.NET mappings |
| `pcl-community` | Keep; owns M1 project and Public PNPSDK workflow |

## Built-in extension allowlist

The canonical list lives in `build/lib/extensions.ts` and currently contains 26 entries:

```text
configuration-editing  csharp                    debug-auto-launch
debug-server-ready     diff                      dotenv
git                    git-base                  ini
json                   json-language-features    log
markdown-basics        markdown-language-features media-preview
merge-conflict         pcl-community             powershell
references-view        search-result             shellscript
terminal-suggest       theme-defaults            theme-modern-icons
xml                    yaml
```

The build, npm, and media packaging lists are derived from this boundary. Community CI checks the product identity, M1 extension/schema, lack of a configured gallery/default chat agent, and absence of Copilot production dependencies or assets.

## Removed from the product

| Area | Status |
|---|---|
| `extensions/copilot/**` | Deleted |
| Copilot build/download/package tasks | Deleted |
| GitHub auth/GitHub product extensions | Not packaged |
| Chat view, Agent sessions view/window, title-bar Agent control, Chat auxiliary bar | Not registered |
| AI account/status entries and Agent welcome page | Not registered |
| Notebook, tunnel, remote-development, browser preview, Emmet, npm, extension-authoring, and unrelated language extensions | Not packaged |
| Legacy color/file-icon themes | Not packaged |
| VS Marketplace | Not configured; Extensions shows and searches local extensions |
| Telemetry | Disabled in `product.json` |

## Source retained only for upstream compatibility

Some Code - OSS Chat, MCP, Agent Host, and sessions source remains because editor/notebook service graphs still reference its service contracts. It has no Community navigation, view, status, account, default agent, process registration, or packaged Copilot extension.

`@github/copilot`, `@github/copilot-sdk`, and `@vscode/copilot-api` remain development-only type/compile dependencies for that retained upstream graph. They are not production dependencies and are not copied into the Community application package.

## Explorer defaults for PCL projects

The `pcl-community` built-in defaults `files.exclude` for generated directories (`bin`, `obj`, `dist`) and project metadata (`*.csproj`, `*.slnx`, `*.nplug`, `*.config`). Source, AXAML, localization resources, `plugin.json`, and documentation remain visible. Users can override the setting.

## Re-audit triggers

- Upstream baseline update
- Any built-in extension allowlist change
- New online endpoint, update channel, Registry, or Sidecar integration
- Any request to re-enable an AI/Agent UI surface
