# dsh-warm-minimal

[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-4c7dff)](https://github.com/deepseek-ai/deepseek-harness)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**温暖极简模式（warm-minimal）** 是 [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 的实验性 agent preset：模型配置与官方极简模式一致，新会话先保持官方空白启动界面；用户发送第一条真实消息后，插件在 agent loop 唤醒前同步写入一条固定的工作目录确认首轮，真实输入随后作为第二轮执行。

- 完整 system prompt 只有 `You are a helpful software engineer assistant.`；
- Linux 下模型工具只有 `bash` 与 `str_replace_editor`；
- 固定首轮来自用户选定的极简模式 donor session，运行时只把 synthetic tool result 替换为当前会话工作目录；
- 不注入 repository instructions、runtime context、skills、compaction 或其他 standard-mode CONTEXT。

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

普通 Chat 不显示 synthetic warm-up turn。模型上下文仍包含这一轮；现有 Trajectory/debug 界面会完整保留并显示来源为 `dsh-warm-minimal` 的固定用户消息、donor reasoning、synthetic `bash` trace 和 `Ready.`，便于调试与审计。首次真实 provider request 的 `Initial System Prompt` 属于真实请求 turn，不属于此前的 warm-up turn。

## 目录结构

```
dsh-warm-minimal/
├── package.json              # dsh.bundle.patch 声明；main -> index.mjs
├── cordis.patch.yml          # bundle 层：profile boot 挂载 bootstrap-seed-host
├── index.mjs                 # host 半身：首条真实消息入 inbox 后写入首轮
├── realization/             # baseline-bound Harness patch + manifest
├── presets/warm-minimal/
│   ├── preset.yml            # 选择器展示文案
│   └── agent.cordis.yml      # 官方 minimal 等价组合
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
- **seed 写的是 durable session events**：`turn/start → user/message → assistant/message（固定 donor reasoning + bash tool-call）→ tool/call → tool/result → "Ready." → step/end → turn/end`，并按事件类型要求携带稳定 `id`、合法 `role` 与 `surfaceOp`。模型上下文与 API transcript 都能看到这一轮，真实输入因此是第二轮。
- **真实请求保持极简**：persona 是 complete system prompt，并关闭 runtime context；composition 只有平台 persistent shell 与 `str_replace_editor`，不挂载 instructions、skills 或 compaction。
- **来源可辨**：种子消息带有 `plugin: dsh-warm-minimal` 与 `form: warmup`，不伪装成真实用户消息；评估/回放可按语义来源过滤。

## 数据与隐私

仓库文件不含 donor session 的真实目录列表或其他机器细节。种子模板是固定文本；唯一语义运行时值是 synthetic tool result 中的**会话工作目录**，它会写入该会话的 transcript（本地日志），请勿直接外发完整 session 日志。

## 已知限制

- 当前只有这一条用户选定的固定 donor 模板，不进行运行时生成或任务分类。
- 伪首轮会进入 API transcript 与 token 计量；这是设计取舍，不是意外。
- preset 组合绑定官方 `minimal` 语义；升级 dsh 后如 minimal composition 变化，需要重新验证 prompt、两工具与无额外 context 的等价性。

## License

MIT。
