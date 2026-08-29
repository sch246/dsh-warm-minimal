# dsh-warm-minimal

[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-4c7dff)](https://github.com/deepseek-ai/deepseek-harness)
[![GitHub release](https://img.shields.io/github/v/release/sch246/dsh-warm-minimal)](https://github.com/sch246/dsh-warm-minimal/releases)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**温暖极简模式（warm-minimal）** 是 DeepSeek Harness 的实验性 agent preset。它保留 deepseek-v4-pro 敏感的极简初始界面，并在之后把主代理收窄为协调者，把更宽泛的发现与执行能力交给子代理。

## 行为

默认情况下，插件会在第一条真实用户输入前执行一轮真实 bootstrap：

```text
检查当前工作目录，确认后仅回复 Ready.
```

这轮请求的完整 system prompt 只有 `You are a helpful software engineer assistant.`，工具只有平台 shell 与 `str_replace_editor`。模型、工具调用、工具结果和回复都来自普通 agent loop；插件不伪造任何 assistant 或 tool 事件。必要工具缺失或来源不明确时，bootstrap 会明确失败，不会退化为未过滤请求，也不会丢失暂存的用户输入。

bootstrap 之后，或关闭 bootstrap 后从首轮开始：

- 主代理默认拥有 persona、AGENTS、持久 shell、编辑器、窄用途 skill、目标/计划、委派/工作流、用户交互和 todo；
- 子代理默认使用复制的 Standard persona，并拥有 AGENTS、持久 shell、编辑器、skill、文件系统发现、搜索、后台 jobs 与 Web；
- 未知来源默认仅对子代理开放；
- 隐藏只影响模型可见的 prompt、context 和 tool schema，不改变可执行工具注册表，也不会拒绝主代理显式形成的调用。

主代理会收到一条很短的协调提示：

```text
Delegated agents have broader tools. Own local inspection, integration, coordination, and user interaction.
```

warm-minimal 自己维护完整 roster，不继承或运行时组合 Standard preset。

## 配置

Web UI 的 **设置 → 插件 → Warm minimal** 保留一个紧凑摘要卡；点击“打开完整配置”后进入宽配置窗口：

- 是否执行 bootstrap；
- bootstrap 的用户消息；
- bootstrap 后的主代理协调提示；
- prompt/context 来源分配；
- tool 来源分配。

Prompt/context 与工具来源列表可以独立展开。每个来源使用三个并列的单选项选择 `仅主代理`、`仅子代理` 或 `通用`，不使用下拉框；工具行显示模型可见的工具名与说明预览，完整 source ID 只在展开详情中显示。保存值只包含 bootstrap 三项与两张稳定 source ID 到分配值的映射。已知来源的默认值由运行时 roster 的同一解析器提供，未知来源才回落为 `仅子代理`。来源名称、工具说明和其它 inventory 元数据由 Host 只读查询返回，不会被浏览器草稿写回配置。

## 安装

前置条件：

- Node.js `^22.19.0 || >=24.0.0`；
- 一个与本插件目标版本兼容的 DeepSeek Harness Git checkout。

```bash
git clone https://github.com/sch246/dsh-warm-minimal.git
cd dsh-warm-minimal
DSH_CHECKOUT=/root/deepseek-harness bash scripts/setup.sh

# Windows PowerShell:
# $env:DSH_CHECKOUT = "C:\path\to\deepseek-harness"
# powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

安装器先验证并应用 `patches/deepseek-harness.patch`，再安装 package-owned preset 并注册插件。补丁已经存在时不会重复应用；目标源码发生漂移且无法精确应用时会停止。脚本不安装依赖、不构建 Harness，也不重启服务，完成后应按部署自己的流程构建并重启。

## 实现

- Host 为 prompt section、context 和单个 tool schema 提供不进入模型 wire 的稳定来源 ID。
- `SystemPrompt.admitSources()` 在 complete prompt 选择和动态内容求值前执行来源准入；工具按 schema 独立过滤。
- preset projection 使用 Loader tree 的精确 entry ID 建立已知来源默认值，不从贡献名称猜测归属。
- 运行时根据当前 agent 关系区分主代理与子代理，并在 assembly waterfall 后处理监听器新加入的未知来源。
- Plugins 配置卡通过 Typert Remote 做 scope-only assembly，读取 inventory 时不创建 session、turn 或模型请求。
- bootstrap 的消息 ID 使用 `dsh-warm-minimal:bootstrap:` 前缀；Chat、Trajectory、持久化与恢复沿用 Harness 原生事件顺序。

## 开发与聚焦验证

```bash
bash scripts/build-host.sh
bash scripts/build-client.sh
node --test \
  tests/index.test.mjs \
  tests/roster.test.mjs \
  tests/remote.test.mjs \
  tests/client/controller.test.mjs \
  tests/client/component.test.mjs \
  tests/lifecycle.test.mjs
```

这些测试只覆盖当前主线：bootstrap 与角色可见性、独立 roster、只读 inventory、官方 Plugins 配置卡，以及 Host 补丁安装/卸载生命周期。

## 卸载

```bash
DSH_CHECKOUT=/root/deepseek-harness bash scripts/uninstall.sh
```

卸载器只有在能够证明目标源码仍与 package-owned 补丁精确匹配时才会反向应用补丁；发生漂移时会在移除插件和 preset 前停止。它不会删除不能证明属于本包的内容，也不会重启服务。

## 数据与限制

- bootstrap 是真实 provider turn，会进入 transcript 与 token 计量。
- 工作目录和工具输出按普通会话规则保存在本地 transcript。
- 模型是否实际委派仍受模型行为、推理强度和 Host 委派策略影响。
- `AGENTS.md` 由 durable user-role 消息注入，不经过当前 system-prompt 来源准入；父子代理目前实际共享这项能力。实现“主代理有限 AGENTS、子代理完整 AGENTS”仍需要 Host 提供 durable model-input 来源准入，配置页不会把它伪装成已按角色分离。
- LSP 尚未加入默认 worker roster；当前 stdio provider 没有 sandbox confinement，不能作为 worker-safe 默认能力。
- Harness 升级后需要重新验证补丁、来源 ID、preset roster 和配置投影兼容性。

## License

MIT。
