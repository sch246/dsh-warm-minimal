# dsh-warm-minimal

[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-4c7dff)](https://github.com/deepseek-ai/deepseek-harness)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**温暖极简模式（warm-minimal）** 是 [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 的实验性 agent preset：新会话先保持官方空白启动界面；用户发送第一条真实消息后，插件在 agent loop 唤醒前同步写入一条高质量首轮轨迹（`we` / `let's` 思维链、无 `let me`），真实输入随后作为第二轮执行。

- 首轮推理以 `We need to confirm the current working directory first.` 开头；
- 首轮唯一 synthetic tool trace 是 `pwsh Get-Location`，结果取自会话真实工作目录；
- 真实消息进入时模型已是"热身"状态，风格提示要求首句 `we need to ...`、避开 `let me`。

## 安装

前置：可运行的 dsh Git checkout（`dsh web`）、Node.js `^22.19.0 || >=24.0.0`。当前 candidate realization 会对指定 checkout 施加一个由本包追踪的兼容 patch；不会创建 Harness fork 或提交。

### 方式一：clone + setup 脚本（推荐）

```bash
git clone https://github.com/sch246/dsh-warm-minimal.git
cd dsh-warm-minimal
DSH_REPO=/path/to/deepseek-harness bash scripts/setup.sh
# Windows PowerShell:
# $env:DSH_REPO='C:\path\to\deepseek-harness'; powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

脚本做三件事：对 `DSH_REPO` 施加 lock-declared host patch 并在目标仓库 `.git/` 中记录 ownership receipt；把 `presets/warm-minimal` 复制进 `<dsh home>/.agent-presets/`；若 `dsh` 在 PATH 上，自动执行 `dsh plugin --profile web add .` 把本包注册为 bundle。之后在 Harness 根目录执行 `pnpm run build` 并**重启 dsh web**。

安装器默认拒绝认领已存在但没有 receipt 的 patch，也拒绝覆盖无 ownership marker 或已发生内容漂移的同名 preset。只有在确认它们确实来自旧版安装后，迁移时才分别设置 `DSH_WARM_ADOPT_HOST_PATCH=1` 和 `DSH_WARM_ADOPT_PRESET=1`；只有审查过 package-owned preset 的差异后，升级时才可设置 `DSH_WARM_REPLACE_DRIFTED_PRESET=1`。

### 状态与卸载

```bash
DSH_REPO=/path/to/deepseek-harness node scripts/host-patch.mjs status
DSH_REPO=/path/to/deepseek-harness bash scripts/uninstall.sh
```

卸载先校验 preset、receipt 和反向 patch；任一 package-owned hunk 或 preset 文件发生漂移都会停止，不覆盖后来的编辑。卸载成功后也需要重新构建并重启 Harness。`DSH_HOME` / `DSH_PROFILE` 环境变量对安装和卸载均生效。

## 使用

重启后新建会话，在 preset 选择器里选 **「温暖极简模式」**，直接发第一条消息即可。

普通 Chat 不显示 synthetic warm-up turn。模型上下文仍包含这一轮；现有 Trajectory/debug 界面会完整保留并显示来源为 `dsh-warm-minimal` 的准备上下文、`we` / `let's` 推理、synthetic `Get-Location` trace 和 `Ready.`，便于调试与审计。首次真实 provider request 的 `Initial System Prompt` 属于真实请求 turn，不属于此前的 warm-up turn。

## 目录结构

```
dsh-warm-minimal/
├── package.json              # dsh.bundle.patch 声明；main -> index.mjs
├── cordis.patch.yml          # bundle 层：profile boot 挂载 bootstrap-seed-host
├── index.mjs                 # host 半身：首条真实消息入 inbox 后写入首轮
├── realization/             # baseline-bound Harness patch + manifest
├── presets/warm-minimal/
│   ├── preset.yml            # 选择器展示文案
│   ├── agent.cordis.yml      # standard 底子 + reasoning-style 的组合
│   └── reasoning-style.mjs   # oh-we-need 风格提示（system section order 0）
├── scripts/
│   ├── setup.sh              # 复制 preset + 自动注册 bundle
│   ├── setup.ps1
│   ├── host-patch.mjs        # receipt / drift-aware install + uninstall
│   ├── uninstall.sh
│   └── uninstall.ps1
└── tools/
    └── mine-first-rounds.mjs # 从 session 日志挖掘高质量首轮模板
```

## 工作原理

- **bundle 行在 profile boot 挂载**：`cordis.patch.yml` 把本包自身插为一行 `bootstrap-seed-host`。它监听同步的 `agent/inbox/inserted`：创建会话不会写历史，第一条真实用户消息进入 inbox 后才触发 seed，随后 agent loop 才被唤醒。
- **seed 写的是 durable session events**：`turn/start → user/message → assistant/message（推理 + tool-call）→ tool/call → tool/result → "Ready." → step/end → turn/end`，并按事件类型要求携带稳定 `id`、合法 `role` 与 `surfaceOp`。模型上下文与 API transcript 都能看到这一轮；真实输入因此是第二轮，`agent-instructions`（AGENTS.md）、运行时上下文快照与 skill catalog 落在第二轮。
- **来源可辨**：种子消息 `source = { kind: 'plugin', plugin: 'dsh-warm-minimal' }`，不伪装成真实用户消息；评估/回放可按 source 过滤。
- **风格提示**：`reasoning-style.mjs` 以 `systemPrompt.section(order: 0)` 注入 [oh-we-need](https://github.com/scp3500/oh-we-need) 规范（MIT，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)）。

## 数据与隐私

仓库文件不含任何机器、用户名、项目路径或内部部署信息。种子模板是固定文本；唯一运行时值来自 `Get-Location`——它会把**会话工作目录**写进该会话的 transcript（本地日志），请勿直接外发完整 session 日志。

## 已知限制

- 原型阶段：只有 1 条通用开局模板；后续按任务类别（build / fix / weak）扩模板，`tools/mine-first-rounds.mjs` 已就绪：
  ```bash
  node tools/mine-first-rounds.mjs ~/.dsh/sessions --top 5
  ```
  质量门槛：`let me == 0`、`we + let's >= 8`、至少一次工具调用、至少一条 assistant 消息、无 `tool/error`。
- 伪首轮会进入 API transcript 与 token 计量；这是设计取舍，不是意外。
- preset 组合以官方 `standard` 为底子；升级 dsh 后如标准组合变化，可能需要同步更新 `presets/warm-minimal/agent.cordis.yml`。

## License

MIT。首轮风格提示词来自 [scp3500/oh-we-need](https://github.com/scp3500/oh-we-need)（MIT），版权声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
