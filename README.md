# dsh-warm-minimal

[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-4c7dff)](https://github.com/deepseek-ai/deepseek-harness)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**温暖极简模式（warm-minimal）** 是 [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 的实验性 agent preset：会话创建时即写入一条高质量首轮轨迹（`we` / `let's` 思维链、无 `let me`），用户的真实输入从第二轮开始——AGENTS.md、运行时上下文与技能目录因此自然注入第一次真实请求，开局保持极简。

- 首轮推理以 `We need to confirm the current working directory first.` 开头；
- 首轮唯一工具调用是 `pwsh Get-Location`，结果为会话真实工作目录；
- 真实消息进入时模型已是"热身"状态，风格提示要求首句 `we need to ...`、避开 `let me`。

## 安装

前置：可运行的 dsh checkout（`dsh web`）、Node.js `^22.19.0 || >=24.0.0`。

### 方式一：clone + setup 脚本（推荐）

```bash
git clone https://github.com/sch246/dsh-warm-minimal.git
cd dsh-warm-minimal
bash scripts/setup.sh          # Windows PowerShell:
                               # powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

脚本做两件事：把 `presets/warm-minimal` 复制进 `<dsh home>/.agent-presets/`；若 `dsh` 在 PATH 上，自动执行 `dsh plugin --profile web add .` 把本包注册为 bundle。之后**重启 dsh web**。

### 方式二：分开手动装

```bash
# 1) 注册 bundle（挂载 boot 时机的 seed 插件，替代手工 patch 行）
dsh plugin --profile web add github:sch246/dsh-warm-minimal

# 2) 复制 preset 到用户根目录
mkdir -p ~/.dsh/.agent-presets
cp -r presets/warm-minimal ~/.dsh/.agent-presets/

# 3) 重启 dsh web
```

`DSH_HOME` / `DSH_PROFILE` 环境变量在两个方式里都生效。

## 使用

重启后新建会话，在 preset 选择器里选 **「温暖极简模式」**，直接发第一条消息即可。

界面里不会出现一条"你发的"第一轮：种子的 user 消息来源是 `dsh-warm-minimal`，UI 按来源把它渲染成一条折叠的**上下文注入行**（点开可见 `Get ready. ...`），上方还有种子的 assistant 一步：折叠的 `we` / `let's` 推理、`Get-Location` 工具卡和一条 `Ready.`。

## 目录结构

```
dsh-warm-minimal/
├── package.json              # dsh.bundle.patch 声明；main -> index.mjs
├── cordis.patch.yml          # bundle 层：profile boot 挂载 bootstrap-seed-host
├── index.mjs                 # host 半身：会话创建即写入首轮
├── presets/warm-minimal/
│   ├── preset.yml            # 选择器展示文案
│   ├── agent.cordis.yml      # standard 底子 + reasoning-style 的组合
│   └── reasoning-style.mjs   # oh-we-need 风格提示（system section order 0）
├── scripts/
│   ├── setup.sh              # 复制 preset + 自动注册 bundle
│   └── setup.ps1
└── tools/
    └── mine-first-rounds.mjs # 从 session 日志挖掘高质量首轮模板
```

## 工作原理

- **bundle 行在 profile boot 挂载**：`cordis.patch.yml` 把本包自身插为一行 `bootstrap-seed-host`。它必须在任何会话创建前就绪，因为 preset 自身的插件要到 agent 创建时才挂载，赶不上会话创建那一刻。
- **seed 写的是 durable session events**：`turn/start → user/message → assistant/message（推理 + tool-call）→ tool/call → tool/result → "Ready." → step/end → turn/end`，并按事件类型要求携带 `surfaceOp`。模型上下文与 API transcript 都能看到这一轮；真实输入因此是第二轮，`agent-instructions`（AGENTS.md）、运行时上下文快照与 skill catalog 落在第二轮。
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
