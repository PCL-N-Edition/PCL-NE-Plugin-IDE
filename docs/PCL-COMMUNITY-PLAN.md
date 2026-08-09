# PCL NE Plugin IDE Community Edition — 基本规划

> 状态：初始规划；基线：`main`（2026-08-09）；适用范围：本仓库发布的 Community Edition

## 1. 规划结论

Community Edition 的首要目标不是成为一个通用 Code - OSS 换皮版本，而是提供一条完整、公开、可复现的 PCL-N 第三方插件开发链路：

```text
创建插件 → 编写代码与界面 → 校验 → 构建 → 打包 →
连接 Developer Sidecar Standard → 安装/运行 → 调试与查看日志 → 发布
```

Community Edition 应当是独立可用的基础开发环境，不以编辑器、构建、调试或正常插件发布能力作为其他 Edition 的入口。Ultimate、Teams 与 Developer Edition 的功能、授权和内部实现不在本仓库规划内；本仓库也不实现多 Edition 运行时切换。

## 2. 已确定的产品边界

### 2.1 Community Edition 必须覆盖

- Code - OSS 提供的编辑器、工作台、扩展宿主、终端、Git、调试和测试基础；
- PCL-N 插件项目创建、识别、工作区与模板；
- Public PNPSDK、Analyzer 和公共协议集成；
- C# / Roslyn 语言能力；
- Manifest、AXAML 与本地化开发工具；
- `.pnp` 构建、开发签名、打包与校验；
- Developer Sidecar Standard 连接；
- 插件安装、启停、重载、日志、生命周期查看和标准调试；
- 面向 Community 的文档、测试、CI、发行和更新链路。

### 2.2 本仓库明确不覆盖

- Ultimate 的高级诊断、性能分析或付费能力；
- Teams 的团队空间、在线协作、文件锁、审查和组织策略；
- Developer Edition 的 Host / Sidecar / Plugin 内部项目模式；
- Private API、Raw IPC、内部符号、恢复/迁移注入及内部 CI；
- 任何非 Community Edition 的授权、计费、构建或发布系统。

如果公共协议与其他 Edition 共用概念，只在 Community 所需的公开契约和能力范围内实现。

## 3. 当前基线与目标覆盖度

下表描述当前 `main` 的仓库状态，而不是产品承诺完成度。

| 能力组 | 当前状态 | Community 目标 | 说明 |
|---|:---:|:---:|---|
| Code - OSS 编辑器与工作台 | 已继承 | 完整 | 保留 editor / workbench / Extension Host 基础 |
| Explorer、Search、Problems、Output | 已继承 | 完整 | 作为插件开发的通用工作区能力 |
| Terminal、Git / SCM | 已继承 | 完整 | 不作为 Edition 差异点 |
| Debug UI、Testing UI | 已继承 | 完整 | PCL-N 适配器仍需实现 |
| Community 产品标识 | 基础完成 | 完整 | `product.json` 已设置产品名、应用 ID 与协议 |
| 仓库与 Edition 边界 | 基础完成 | 完整 | 已有公开边界文档和 Community CI 基线 |
| 内置扩展裁剪 | 已落地（停打包） | 精简可维护 | 见 `docs/PCL-TRIM-LIST.md`；Copilot 源码已删除，其余先停打包 |
| C# / Roslyn | 语法 + dotnet build | 完整 | M1 使用 grammar + CLI 构建诊断；完整 LS 见 ADR-002 |
| PCL-N 项目与模板 | 已实现（M1） | 完整 | `extensions/pcl-community` + Hello PCL 模板 |
| Public PNPSDK / Analyzer | 参考 CLI 已实现 | 完整 | `tools/pnp-community-cli`；正式包分发见 ADR-001 |
| Manifest / AXAML / 本地化工具 | Manifest 已实现 | 完整 | Manifest schema/校验已完成；AXAML 设计器属 M3 |
| `.pnp` 构建、签名与校验 | 已实现（开发签名） | 完整 | build/sign/package/validate + fixture e2e |
| Sidecar Standard 集成 | 未实现 | 完整 | 仅接入公开 Standard 能力 |
| PCL-N 安装、运行、调试与日志 | 未实现 | 完整 | 应通过公共协议和 Debug Adapter 接入 |
| PCL Extension Registry | 未实现 | 完整 | 只使用公开发布接口和 Community 身份 |
| Community 安装包与更新 | 基础设施待完善 | 完整 | 需建立独立发行通道和升级验证 |

状态判断依据是仓库内当前可见实现；当外部 SDK、Sidecar 或 Registry 仓库接入后应重新评估。

## 4. 目标架构

```text
┌─────────────────────────────────────────────────────────────┐
│ Community Product Shell                                    │
│ branding · onboarding · settings · update channel          │
├─────────────────────────────────────────────────────────────┤
│ Code - OSS Foundation                                      │
│ editor · workbench · terminal · SCM · debug · testing      │
├─────────────────────────────────────────────────────────────┤
│ PCL Community Built-in Extensions                          │
│ projects · authoring · build/package · runtime/debug       │
├─────────────────────────────────────────────────────────────┤
│ Public Integration Contracts                               │
│ manifest schema · PNPSDK · DAP · Sidecar Standard client   │
├─────────────────────────────────────────────────────────────┤
│ External Public Toolchain                                  │
│ .NET/Roslyn · PNPSDK tooling · Sidecar Standard · Registry │
└─────────────────────────────────────────────────────────────┘
```

### 4.1 实现原则

1. **优先使用扩展能力。** 项目识别、任务、调试适配器、Custom Editor、Tree View 和命令优先放在内置扩展；只有 Extension API 无法满足稳定需求时才修改 `src/vs`。
2. **控制上游分叉。** 对 Code - OSS 核心的修改保持小、可定位、可测试，持续记录上游基线和同步冲突。
3. **公共契约先行。** IDE 不直接依赖私有 PCL-N 类型、内部端点或 Raw IPC；Sidecar 连接必须进行协议版本和 capability negotiation。
4. **产品构建即 Community。** 不在公开二进制中隐藏其他 Edition 模块，也不通过授权开关把 Community 构建变成多版本容器。
5. **工具链可替换、故障可解释。** Roslyn、SDK、Sidecar 和 Registry 均通过适配层接入，缺失、版本不兼容和离线状态必须给出可操作诊断。
6. **先停止打包，再删除源码。** 裁剪上游能力时先通过产品配置和构建清单取消分发，确认依赖与同步成本后再物理删除。

### 4.2 建议的模块边界

模块名称是工作名，需在首个架构决策记录中确认。

| 模块 | 主要职责 | 优先承载方式 |
|---|---|---|
| PCL Projects | 项目识别、模板、工作区、SDK 版本解析 | 内置扩展 |
| PCL Authoring | Manifest、AXAML、本地化编辑与校验 | 内置扩展 + Language Server / Custom Editor |
| PCL Build | restore、build、开发签名、`.pnp` 打包与校验 | 内置扩展 + 公共 CLI |
| PCL Runtime | Sidecar Standard、安装/重载、生命周期、日志 | 内置扩展 + 公共协议客户端 |
| PCL Debug | 启动配置、断点会话、诊断映射 | Debug Adapter / 内置扩展 |
| PCL Welcome | 新手引导、环境检查、样例和文档入口 | 内置扩展 |

共享代码应保持为小型、无产品状态的库。不要为了复用而把 PCL 领域逻辑放进通用的 `vs/base` 或 `vs/platform`。

## 5. 交付路线

路线按依赖关系和可验收结果划分，不先绑定日历日期。外部公共契约冻结后再估算发布时间。

### M0 — Fork 基线可维护

目标：任何贡献者都能确认自己构建的是 Community，并获得可信的基础构建结果。

- [x] 定义 Community 仓库与非 Community Edition 边界；
- [x] 设置基础产品标识；
- [x] 建立适用于公开 Fork 的初始 CI；
- [x] 记录 Code - OSS 上游 remote、基线 tag/commit 与同步流程（`docs/UPSTREAM.md`）；
- [x] 审计内置扩展、认证、遥测、Marketplace、Tunnel、Agent 和更新端点（`docs/PCL-TRIM-LIST.md`）；
- [x] 形成“保留 / 停止打包 / 删除”的清单（`docs/PCL-TRIM-LIST.md`）；
- [x] Community 开发构建验证 CI（`community-build-validation.yml`；完整三平台安装包属于后续发行强化）；
- [x] 补充 Community 安全披露和制品检查（`SECURITY.md` + fixture 包扫描）。

退出条件：干净克隆可按文档构建，CI 能阻止非 Community 模块、密钥或错误产品配置进入制品。

### M1 — Plugin Project Alpha

目标：完成“创建、编辑、校验、构建、打包”的第一条纵向链路。

- [x] 项目模板与项目识别（`extensions/pcl-community`）；
- [x] .NET / PNPSDK 环境检测和版本诊断；
- [x] C# 语法高亮 + `dotnet build` 诊断（完整 Roslyn LS 见 ADR-002 后续）；
- [x] Manifest schema、补全和验证；
- [x] PNPSDK Analyzer 诊断接入 Problems；
- [x] build、development sign、package、validate 任务（`tools/pnp-community-cli`）；
- [x] 一个最小插件 fixture 和端到端测试（`fixtures/hello-pcl` + `scripts/pcl-m1-e2e.*`）。

退出条件：全新环境中的开发者可从模板创建插件并得到通过校验的 `.pnp` 制品，无需手工拼接命令。

### M2 — Runtime & Debug Beta

目标：完成“安装、运行、调试、观察、重载”的第二条纵向链路。

- Sidecar Standard 的发现、连接、认证和 capability negotiation；
- 测试环境选择与连接状态 UI；
- 插件安装、启用、禁用、卸载和重载；
- 标准生命周期、状态和日志查看；
- PCL-N Debug Adapter 与 launch 配置生成；
- 断连、协议不兼容、进程退出和插件崩溃诊断；
- Fake Sidecar 合约测试及真实 Sidecar 冒烟测试。

退出条件：开发者可以从 IDE 启动一次可重复的调试会话，并在修改后完成重载和日志定位。

### M3 — Authoring Preview

目标：让 PCL-N 特有文件的开发体验达到可日常使用水平。

- Manifest Designer 与源码双向同步；
- AXAML 语义补全、诊断、预览和设计器；
- 资源、主题和本地化编辑器；
- SDK Service Inspector 的公开能力；
- 预览隔离、错误边界和高耗时渲染取消；
- 典型插件样例与回归 fixture。

退出条件：Manifest、AXAML 与本地化的常见修改不必离开 IDE，源码始终是可审查、可恢复的事实来源。

### M4 — Community 1.0

目标：提供可公开下载、升级和发布插件的稳定 Community 版本。

- PCL Extension Registry 浏览与公开发布流程；
- 发布前兼容性、签名、权限和包内容检查；
- 首次启动、环境修复、文档和样例；
- 安装包、签名、更新通道、回滚与校验；
- 无障碍、性能、崩溃恢复和数据迁移验证；
- 支持策略、版本策略、贡献指南和安全响应流程。

退出条件：满足发布检查表，核心纵向链路在支持平台通过，升级不破坏现有插件工作区。

## 6. 首个实施切片

在引入完整设计器之前，先实现一个能持续扩展的最小闭环：

1. 冻结最小公开契约：Manifest schema、PNPSDK 版本、`.pnp` CLI 命令和 Sidecar Standard 最低版本；
2. 建立一个 PCL 内置扩展骨架，完成项目识别、环境检查和命令注册；
3. 加入 `Hello PCL` fixture，提供创建、build、package、validate 任务；
4. 把 CLI / Analyzer 的结构化诊断映射到 Problems；
5. 在 CI 中运行该 fixture 的端到端构建，并检查制品不包含私有模块和凭据；
6. 再以同一个 fixture 接入 Fake Sidecar，完成安装、启动、日志和重载。

这个切片完成后再拆分 Authoring、Build、Runtime 等扩展，避免在公共契约未稳定时形成大量空模块。

## 7. 必须先确认的架构决策

以下项目直接影响实现，不应在代码中靠临时约定固化：

| ADR | 要决定的问题 | 阻塞内容 |
|---|---|---|
| ADR-001 | Public PNPSDK、Analyzer 和模板的来源、版本与分发方式 | M1 全部 |
| ADR-002 | Roslyn Language Server 的实现、许可证、安装与更新方式 | C# 完整支持 |
| ADR-003 | Manifest schema、项目识别规则和 `.pnp` 可复现构建契约 | 项目、打包、校验 |
| ADR-004 | Sidecar Standard 的传输、认证、版本协商和测试替身 | M2 全部 |
| ADR-005 | AXAML 预览进程模型、隔离边界和设计时数据 | M3 设计器 |
| ADR-006 | Community Registry、更新、遥测和错误报告的公开端点策略 | M4 发行 |
| ADR-007 | 支持的 OS、CPU、.NET / PCL-N 版本矩阵 | CI 与发布门槛 |

每份 ADR 至少记录：上下文、选项、决定、兼容性、许可证/安全影响、回滚方式和测试策略。

## 8. 验证策略

### 每个功能的最低测试层级

- 纯逻辑：单元测试；
- Manifest / CLI / Sidecar：版本化 contract tests；
- 编辑器贡献点：扩展集成测试；
- 核心开发链路：从 fixture 创建到 `.pnp` 的端到端测试；
- Runtime：Fake Sidecar 必跑，真实 Standard Sidecar 作为受控冒烟测试；
- 产品构建：三平台启动、产品标识、内置扩展清单和敏感内容扫描。

### 合并门槛

- 不引入 Private API、内部端点或非 Community 制品；
- 不破坏 Code - OSS 分层和扩展宿主隔离；
- 用户可见文本可本地化；
- 外部进程、工作区信任、路径和包内容经过安全校验；
- 新增核心补丁必须说明为什么 Extension API 无法承载；
- 用户工作区格式和公共协议的破坏性变更必须有迁移与版本策略。

## 9. 主要风险与控制方式

| 风险 | 控制方式 |
|---|---|
| 与 Code - OSS 上游快速分叉 | 优先扩展实现、小核心补丁、固定同步节奏、冲突记录 |
| 公共 SDK / Sidecar 契约尚未稳定 | contract-first、版本协商、fixture、Fake Sidecar |
| 误把通用 XML/C# 基础当成完整 PCL 工具链 | 用纵向验收场景衡量，不按目录存在与否判定完成 |
| Community 制品混入私有能力或秘密 | 构建清单 allowlist、制品扫描、独立发布凭据 |
| 设计器拖慢首个可用版本 | M1/M2 先完成源码与运行闭环，设计器独立进入 M3 |
| 直接删除上游模块导致同步成本失控 | 先停止打包并观察，再按依赖证据删除 |
| 外部工具安装失败或离线 | 明确环境诊断、缓存策略、重试和手工修复路径 |

## 10. 规划维护规则

- 本文只追踪 Community Edition；其他 Edition 的路线图不得合并进本文件；
- 每个里程碑开始前，将功能拆为可验收 issue，并关联对应 ADR；
- “完整”必须由退出条件和自动化测试证明，而不是由 UI 入口存在证明；
- 每次 Code - OSS 基线升级、公共协议变更或支持平台变化后更新第 3、7、9 节；
- 实际完成状态以代码、测试和发布制品为准，本文不替代 issue tracker。
