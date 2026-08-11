# PCL Developer Studio — AXAML Designer 架构补充说明

> 本文作为 PCL Developer Studio 总体架构的补充文档，定义 AXAML 可视化设计器的技术基线、进程边界、编辑模型、预览运行时、Code-OSS 集成方式，以及各 Edition 后续扩展策略。

---

## 1. 目标

PCL Developer Studio 需要提供一套面向 Avalonia / AXAML 的可视化设计能力，满足：

- AXAML 实时预览；
- WYSIWYG 可视化编辑；
- 控件选中、拖动、缩放；
- Toolbox；
- Structure Tree；
- Properties；
- AXAML 与 Designer 双向定位；
- 自定义控件加载；
- 插件项目资源加载；
- 安全隔离用户代码；
- 与 Monaco / Code-OSS Undo、Redo、Dirty State、Git Diff、Teams Workspace 协同；
- 后续支持 Ultimate / Teams / Developer Edition 的高级调试与内部能力。

核心原则：

> **AXAML 始终是唯一 Source of Truth。Designer 只是 AXAML 的结构化编辑视图，不维护第二份设计文件。**

---

# 2. 技术基线

建议以以下两个开源项目作为技术参考与代码来源：

## 2.1 XamlPlayground

作为主要 Designer Engine 技术基线。

重点复用：

- AXAML AST / structural mapping；
- Preview；
- Visual Tree hit testing；
- Designer selection；
- Drag / Resize；
- Toolbox insertion；
- Structure operations；
- Property mutation；
- AXAML ↔ Designer selection synchronization；
- Designer Overlay；
- 设计时控件定位与结构映射。

不直接沿用其完整产品 UI。

原则：

```text
XamlPlayground
    ↓
提取核心设计能力
    ↓
PCL.Axaml.Designer.Core
```

而不是：

```text
XamlPlayground
    ↓
改 Logo
    ↓
PCL Designer
```

---

## 2.2 AvaloniaVSCode ARCHIVE

主要用于参考：

- VS Code / Code-OSS Extension 集成；
- Previewer process 管理；
- 项目识别；
- Solution / Project parsing；
- `.axaml` Editor integration；
- IDE ↔ Avalonia Previewer 通信模式。

不作为 Designer Engine 本体。

---

# 3. 总体架构

建议采用独立 Designer 子系统：

```text
PCL Developer Studio
Code-OSS / Electron
        │
        │ Designer Protocol
        ▼
PCL.Axaml.Designer.Host
.NET
        │
        ├─ Document Model
        ├─ AXAML AST
        ├─ Mutation Engine
        ├─ Property Metadata
        ├─ Toolbox Metadata
        ├─ Structure Model
        └─ Session Manager
                │
                │ Preview Protocol
                ▼
PCL.Axaml.Preview.Worker
Avalonia / .NET
        │
        ├─ Load Assembly
        ├─ Load Resources
        ├─ Instantiate View
        ├─ Layout
        ├─ Render
        ├─ Visual Tree
        └─ Hit Test
```

Studio 不直接依赖 XamlPlayground 内部类型。

Studio 只依赖稳定的：

```text
PCL.Axaml.Designer.Protocol
```

这样未来即使替换 Designer Engine，也不会迫使整个 Studio 重构。

---

# 4. 项目拆分

建议建立：

```text
src/
└─ designer/
   ├─ PCL.Axaml.Designer.Contracts/
   ├─ PCL.Axaml.Designer.Core/
   ├─ PCL.Axaml.Designer.Host/
   ├─ PCL.Axaml.Preview.Worker/
   ├─ PCL.Axaml.Designer.Protocol/
   └─ PCL.Axaml.Designer.Tests/

extensions/
└─ pcl-axaml-designer/
   ├─ src/
   │  ├─ extension.ts
   │  ├─ designerEditor.ts
   │  ├─ designerSession.ts
   │  ├─ documentSync.ts
   │  ├─ propertyView.ts
   │  ├─ toolboxView.ts
   │  ├─ structureView.ts
   │  └─ hostManager.ts
   └─ package.json
```

职责：

| 项目 | 责任 |
|---|---|
| `Contracts` | 稳定公共接口 |
| `Core` | AXAML AST、Mutation、Selection、Designer Model |
| `Host` | Designer Session、项目解析、IPC、生命周期 |
| `Preview.Worker` | 加载用户程序集和 Avalonia Runtime |
| `Protocol` | Studio ↔ Host / Host ↔ Worker DTO 与 RPC |
| `Tests` | AST、Mutation、映射、协议和 Worker 回归测试 |
| `pcl-axaml-designer` | Code-OSS 前端集成 |

---

# 5. Contracts

建议优先稳定以下接口：

```csharp
public interface IDesignerSession;
public interface IDesignerDocument;
public interface IDesignerSelectionService;
public interface IDesignerMutationService;
public interface IDesignerToolboxService;
public interface IDesignerPropertyService;
public interface IDesignerStructureService;
public interface IDesignerPreviewService;
public interface IDesignerProjectContext;
public interface IDesignerDiagnosticService;
```

协议层避免暴露第三方实现细节，例如：

```text
XamlPlayground.SomeAstNode
Avalonia.Controls.Control
```

不得直接进入 Studio Protocol。

所有跨进程结构使用 PCL 自己定义的 DTO。

---

# 6. AXAML 是唯一 Source of Truth

禁止维护：

```text
MainPage.axaml
MainPage.designer.json
```

这样的双数据源。

统一模型：

```text
                AXAML
               /     \
              ▼       ▼
          Monaco      AST
                       │
                       ▼
                   Designer
```

Designer 的任何修改都最终转化为：

```text
TextEdit[]
```

然后由 Code-OSS 应用。

例如：

```text
Designer:
Move Button
    ↓
Mutation Engine
    ↓
AXAML AST mutation
    ↓
TextEdit[]
    ↓
WorkspaceEdit
    ↓
Monaco Document
```

这样 Designer 自动继承：

- Undo；
- Redo；
- Dirty State；
- Save；
- Auto Save；
- Git Diff；
- File Watcher；
- Teams File Lease；
- Workspace Revision。

Designer 不维护独立 Undo Stack。

---

# 7. 编辑模式

`.axaml` 编辑器建议提供三个一级模式：

```text
Code
Design
Split
```

## Code

标准 Monaco AXAML Editor。

## Design

完整可视化设计界面。

## Split

```text
┌──────────────────────┬──────────────────────┐
│                      │                      │
│        AXAML         │       Designer       │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

Designer 内部另有：

```text
PreviewMode
├─ Design
└─ Run
```

因此：

```text
EditorMode
×
PreviewMode
```

属于两个独立维度。

---

# 8. Designer UI

不直接复用 XamlPlayground 产品 UI。

由 PCL Developer Studio 使用 Code-OSS Workbench 组件统一实现：

```text
┌─────────────────────────────────────────────────────┐
│ MainPage.axaml                                      │
├────────────┬─────────────────────────┬──────────────┤
│ TOOLBOX    │                         │ PROPERTIES   │
│            │                         │              │
│ Layout     │      DESIGN SURFACE     │ Layout       │
│ Grid       │                         │ Width        │
│ Canvas     │    ┌──────────────┐     │ Height       │
│            │    │    Button    │     │ Margin       │
│ Controls   │    └──────────────┘     │ Classes      │
│ Button     │                         │              │
│ Border     │                         │ Appearance   │
├────────────┼─────────────────────────┼──────────────┤
│ STRUCTURE  │ Code / Design / Split   │ EVENTS       │
└────────────┴─────────────────────────┴──────────────┘
```

由 Studio 负责：

- Toolbox View；
- Structure View；
- Properties View；
- Search；
- Commands；
- Context Menu；
- Keybindings；
- Problems；
- Undo / Redo；
- Workspace Integration。

Designer Engine 只提供数据、mutation 和 preview。

---

# 9. Designer Host 与 Preview Worker 分离

不建议只使用单一 `DesignerHost.exe`。

推荐：

```text
Designer Host
│
├─ Project Resolver
├─ Document Model
├─ AXAML AST
├─ Mutation Engine
├─ Metadata
├─ Structure
└─ Session Manager
        │
        ▼
Preview Worker
│
├─ 用户 Assembly
├─ 自定义 Control
├─ ResourceDictionary
├─ Theme
├─ Converter
├─ MarkupExtension
├─ Avalonia Runtime
└─ Native Dependency
```

原因：

用户项目代码属于不可信执行环境。

可能发生：

- 静态构造死循环；
- Avalonia 初始化崩溃；
- Native crash；
- 自定义控件异常；
- UI Thread 卡死；
- ALC unload failure；
- 后台线程泄漏；
- Runtime resource 泄漏。

因此：

> **Designer Host 长期运行，Preview Worker 可随时销毁重建。**

例如：

```text
用户重新 Build
      ↓
Assembly 已变化
      ↓
旧运行时无法安全卸载
      ↓
Kill Worker
      ↓
Create New Worker
```

不依赖复杂 ALC 卸载保证。

---

# 10. Preview Worker 粒度

推荐按：

```text
Project
+
Target Framework
+
Configuration
```

创建 Preview Runtime。

例如：

```text
PCL.Plugin
net10.0
Debug
    │
    └─ Preview Worker #1
       ├─ MainPage.axaml
       ├─ SettingsPage.axaml
       └─ AboutPage.axaml
```

另一个项目使用独立 Worker。

这样可以共享：

- Theme；
- Resource；
- Assembly；
- Fonts；
- DI；
- UserControl；
- Styles。

同时又不会让多个项目污染同一个 Runtime。

---

# 11. Designer Element Identity

禁止使用：

```text
line:column
```

作为 Designer Element 的稳定身份。

建议建立：

```text
DesignerElementId
```

由以下信息组合：

```text
StructuralPath
+ x:Name
+ Node Fingerprint
+ Parent Identity
+ Source Range
```

例如：

```text
Window
└─ Grid[0]
   ├─ Border[0]
   └─ StackPanel[1]
      └─ Button[2]
```

结构变化后由 Designer Core 尝试重新绑定 Element Identity。

用途包括：

- Preview Control ↔ AST Node；
- Selection；
- Properties；
- Drag / Resize；
- Structure Tree；
- Monaco Selection；
- Diagnostics。

---

# 12. Designer Protocol

建议协议至少包含：

```text
Session
├─ OpenProject
├─ CloseProject
├─ OpenDocument
├─ CloseDocument
└─ RestartPreview

Document
├─ UpdateSource
├─ GetStructure
├─ GetDiagnostics
└─ GetDesignerState

Selection
├─ SelectElement
├─ SelectSourceRange
└─ HitTest

Mutation
├─ MoveElement
├─ ResizeElement
├─ InsertElement
├─ DeleteElement
├─ ReparentElement
├─ ReorderElement
├─ SetProperty
└─ ResetProperty

Preview
├─ StartPreview
├─ StopPreview
├─ SetViewport
└─ SetPreviewMode
```

Mutation Result：

```text
MutationResult
├─ TextEdit[]
├─ NewSelection
├─ Diagnostics
└─ PreviewInvalidation
```

Studio 只负责应用 `TextEdit[]`。

---

# 13. 通信层

建议分为两个平面。

## Control Plane

负责低带宽结构化消息：

```text
OpenDocument
Selection
Mutation
Properties
Structure
Diagnostics
HitTest
```

建议使用：

```text
JSON-RPC
```

早期阶段优先保证简单、可调试。

后期可评估 MessagePack RPC。

---

## Frame Plane

负责高带宽预览内容：

```text
Preview Frame
Dirty Rect
Overlay Geometry
```

避免使用：

```text
RGBA
→ Base64
→ JSON-RPC
→ Electron
```

长期建议：

```text
Shared Memory
+
Local IPC Notification
```

或者平台相关的高效本地 Surface 传输。

第一版允许使用较简单实现，但协议层应提前与 Control Plane 分离。

---

# 14. Preview Rendering

第一阶段目标优先是稳定，而不是追求极限 FPS。

阶段划分：

## Phase 1

```text
Preview Worker
→ bitmap/frame
→ Studio
```

满足：

- 实时更新；
- 点击；
- Selection；
- Drag；
- Resize。

## Phase 2

加入：

- Dirty Rect；
- Frame Coalescing；
- Adaptive FPS；
- Preview Idle Throttling。

## Phase 3

评估：

- Shared Memory；
- GPU surface sharing；
- 平台专用零拷贝方案。

不要在第一版为零拷贝投入过多复杂度。

---

# 15. Project Resolver

Designer 不能只解析单个 `.axaml` 文件。

需要理解：

```text
.csproj
TargetFramework
PackageReference
ProjectReference
Avalonia Version
OutputPath
Assets
Resource
Theme
Assembly
```

建议：

```text
PCL.Axaml.Designer.Host
└─ Project Resolver
```

统一解析：

```text
AXAML File
    ↓
Owning Project
    ↓
Build Target
    ↓
Runtime Assemblies
    ↓
Preview Worker
```

后续 Developer Edition 可增加：

- 多 Target；
- 多 Sidecar；
- Internal Assembly；
- PR Build Target；
- SDK Nightly Target。

---

# 16. Build 集成

默认不要在每一次按键时执行完整：

```text
dotnet build
```

建议区分：

```text
Markup-only update
```

与：

```text
Runtime-affecting update
```

## Markup-only

例如：

```text
Margin
Width
Grid.Row
Background
Content
```

直接更新 AXAML / Preview。

## Runtime-affecting

例如：

```text
.cs
.csproj
PackageReference
Custom Control
Converter
Resource assembly
```

触发：

```text
Build
    ↓
Restart / Reload Worker
```

避免无意义的完整 rebuild。

---

# 17. 安全模型

Preview Worker 运行用户代码，因此最低要求：

- 与 Studio 主进程隔离；
- 与 Designer Host 隔离；
- crash 不影响 Studio；
- 可强制 kill；
- 有启动超时；
- 有心跳；
- 可限制 IPC 能力；
- 不允许 Worker 任意调用 Studio 内部命令。

Ultimate 后续可增加：

- Sandbox Worker；
- 文件访问限制；
- 网络限制；
- CPU / Memory Limit；
- Fault Injection。

Community 第一阶段只需要保证进程隔离和可恢复。

---

# 18. Edition 扩展策略

Designer Core 尽量保持公共。

## Community

完整基础 Designer：

- Code / Design / Split；
- 实时 Preview；
- Toolbox；
- Structure；
- Properties；
- Drag / Resize；
- Selection Sync；
- Standard Diagnostics；
- Standard Sidecar Integration。

---

## Ultimate

在 Community Designer 上增加：

- Advanced Runtime Inspector；
- Binding Inspector；
- Property Source；
- Command Routing；
- Resource Resolution；
- Preview Performance；
- Visual Tree Advanced View；
- Sandbox Preview；
- Fault Injection；
- Multi-version Compatibility Preview。

---

## Teams

继承 Ultimate，并增加：

- Online Workspace Designer；
- File Lease Integration；
- Shared Designer Presence；
- Shared Preview State；
- Shared Inspector；
- Shared Test Session；
- Revision-aware Designer；
- 解锁后即时同步 AXAML。

由于 Teams 不允许多人同时编辑同一个文件，因此 Designer 不实现 CRDT / OT。

在线状态下：

```text
Acquire File Lease
      ↓
Designer Editable
```

其他成员：

```text
Read Only Preview
```

释放时：

```text
Commit AXAML
    ↓
Release Lease
    ↓
Workspace Revision
    ↓
Immediate Sync
```

---

## Developer / Internal

Developer Designer 与项目模式结合。

### Plugin Mode

增加：

- Internal Surface；
- Private API；
- Internal Capability；
- Experimental SDK；
- Internal Sidecar Target。

### Host Mode

增加：

- PCL-N Host Surface；
- Navigation / Surface Registry；
- Internal Resource；
- Host Runtime；
- 多 Sidecar Target Preview。

### Sidecar Mode

增加：

- Internal Sidecar Surface；
- Raw Runtime Data；
- Host Bridge；
- Internal UI Registration；
- Protocol Debug。

Internal 所有项目模式均支持：

```text
Online
Offline
```

继承 Teams Collaboration Core。

---

# 19. 上游同步策略

不建议将 XamlPlayground 作为长期直接 NuGet 依赖。

更适合：

```text
upstream/xaml-playground
        ↓
vendor / subtree / patch stack
        ↓
PCL.Axaml.Designer.Core
```

建议维护：

```text
docs/designer/upstream-divergence.md
```

记录：

```text
XP-001 AST abstraction
XP-002 Remove standalone editor
XP-003 Remove Dock UI
XP-004 PCL Protocol layer
XP-005 Worker isolation
...
```

原则：

> 尽量保持核心算法可与上游同步，但 PCL 自己的 Protocol、Host、Worker、Studio UI 不依赖上游产品结构。

---

# 20. 第三方许可证策略

XamlPlayground 与旧 AvaloniaVSCode ARCHIVE 均按其各自开源许可证要求处理。

建议：

```text
THIRD-PARTY-NOTICES.md
```

独立记录：

- 项目名称；
- 上游仓库；
- commit；
- 使用范围；
- 修改说明；
- License 文本。

Community 开源仓库保留完整 notices。

Ultimate / Teams / Developer 的闭源发行包同样保留必要第三方 notices。

---

# 21. 实施阶段

## Phase 0 — Spike

目标：

- 跑通 XamlPlayground 核心；
- 跑通旧 AvaloniaVSCode preview integration；
- 验证 Studio ↔ .NET Host；
- 验证 bitmap preview；
- 验证 AXAML mutation。

不追求产品 UI。

---

## Phase 1 — Community MVP

完成：

- `.axaml` Custom Editor；
- Code / Design / Split；
- Preview Worker；
- Selection；
- Toolbox；
- Structure；
- Properties；
- Drag；
- Resize；
- AST mutation；
- TextEdit；
- Undo / Redo；
- Diagnostics；
- Worker crash recovery。

达到可替代传统基础 AXAML Previewer 的水平。

---

## Phase 2 — Community 完整版

增加：

- Resource / Theme；
- Custom Controls；
- Project Reference；
- Better Property Metadata；
- Event Handler Navigation；
- Binding Diagnostics；
- Grid / Canvas 专用操作；
- Designer Guidelines；
- Performance 优化。

---

## Phase 3 — Ultimate

增加：

- Advanced Inspector；
- Sandbox；
- Fault Injection；
- Compatibility Matrix；
- Preview Performance；
- Multi-runtime Preview。

---

## Phase 4 — Teams

增加：

- Online Workspace；
- File Lease；
- Shared Preview；
- Shared Inspector；
- Revision Integration；
- Shared Test Session。

---

## Phase 5 — Developer/Internal

增加：

- Host Mode；
- Sidecar Mode；
- Plugin Mode Internal extensions；
- Internal Surface；
- Multi-Sidecar Target；
- Raw Protocol / Runtime integration。

---

# 22. 最终边界

最终应形成：

```text
                    PCL Developer Studio
                           │
                           ▼
                  AXAML Designer Extension
                           │
                           ▼
                 Designer Protocol Layer
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
             Designer Host      Preview Worker
                  │                 │
                  ▼                 ▼
              AXAML AST       Avalonia Runtime
                  │                 │
                  └────────┬────────┘
                           ▼
                     Designer Core
                           │
                           ▼
                       TextEdit[]
                           │
                           ▼
                     Monaco / AXAML
```

关键设计结论：

1. **AXAML 是唯一 Source of Truth。**
2. **Studio 不直接依赖 XamlPlayground 内部实现。**
3. **Designer 修改统一返回 `TextEdit[]`。**
4. **Undo / Redo / Git / Teams Sync 全部复用 Code-OSS。**
5. **用户程序集仅进入 Preview Worker。**
6. **Designer Host 与 Preview Worker 分离。**
7. **Preview Worker 可随时销毁重建。**
8. **Community 提供完整基础 Designer。**
9. **Ultimate 增加深度调试与 Sandbox。**
10. **Teams 增加文件级在线协作，不引入 CRDT。**
11. **Developer/Internal 在同一 Designer Core 上扩展 Host / Sidecar / Plugin 三种项目模式。**
12. **XamlPlayground 是技术基线，不是产品架构依赖。**

