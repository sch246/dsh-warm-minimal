# dsh-warm-minimal

[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-4c7dff)](https://github.com/deepseek-ai/deepseek-harness)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**温暖极简模式（warm-minimal）** 是 [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 的实验性 agent preset。它在处理新会话的第一条真实请求前，先通过正常 agent loop 执行一轮工作目录确认，让第一条真实请求成为第二轮。

## 为什么这么做

deepseek-v4-pro 由于训练的原因对初始提示词和初始工具面非常敏感。官方极简模式（minimal）的第一轮只有一句固定 system prompt（`You are a helpful software engineer assistant.`）和两个工具（`bash` + `str_replace_editor`）；这种固定的第一轮形态会把模型引导进 `we need` 式的协作思维链，而不是 `Let me` 式的自言自语。温暖极简模式的目标就是**模仿官方极简模式的第一轮形态**：

- 完整 system prompt 只有 `You are a helpful software engineer assistant.`；
- **bootstrap 第一轮**只暴露官方 minimal 的两个工具，其余由其他 bundle 注册的工具（开发插件、图像阅读器、天气等）一律不进入首轮；
- **从第二轮开始**再放行其余工具：不能完全不给工具，也不能在第一轮全给，唯一解就是第二轮注入剩余工具；
- 不伪造 assistant、tool call、tool result 或 `Ready.`，这些内容均由当前模型与真实工具产生；
- 不修改 DeepSeek Harness 源码。

## 安装

前置：可运行的 dsh、Node.js `^22.19.0 || >=24.0.0`。

```bash
git clone https://github.com/sch246/dsh-warm-minimal.git
cd dsh-warm-minimal
bash scripts/setup.sh
# Windows PowerShell:
# powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

脚本把 `presets/warm-minimal` 复制进 `<dsh home>/.agent-presets/`；若 `dsh` 在 PATH 上，还会执行 `dsh plugin --profile web add .` 注册 bundle。安装器拒绝覆盖无 ownership marker 或已发生内容漂移的同名 preset。确认旧目录确实属于本包后可用 `DSH_WARM_ADOPT_PRESET=1` 迁移；审查过 package-owned preset 的差异后可用 `DSH_WARM_REPLACE_DRIFTED_PRESET=1` 升级。

安装后重启 dsh web，在 preset 选择器中选择 **「温暖极简模式」**。

## 使用与显示

新建会话后直接发送第一条消息。插件会同步暂存这条消息，先插入真实 bootstrap 用户消息：

```text
检查当前工作目录，确认后仅回复 Ready.
```

模型随后使用 minimal 的真实 shell 检查该会话的工作目录。bootstrap 的第一条 provider 请求只包含 `bash` + `str_replace_editor` 两个工具；bootstrap 完成后，原消息按原顺序恢复并成为下一轮，从这一轮起其余已注册工具恢复可见。

bootstrap 失败也不会丢弃原消息。

Chat 与 Trajectory 都按 Harness 的原生顺序显示这一轮。bootstrap 的 `UserMessage.id` 以 `dsh-warm-minimal:bootstrap:` 开头：该标记会随会话持久化，但不会发送给模型，可供未来独立的会话折叠插件识别。

## 工作原理

- bundle 在 profile boot 挂载，监听同步的 `agent/inbox/inserted`；空会话仍保持官方空白界面。
- 第一条真实输入被从 inbox 暂存后，插件用 `agent.followup()` 提交标记过的 bootstrap，再用 `agent.whenIdle()` 等待该轮完成，最后恢复暂存消息。
- 同一插件在 `system-prompt/assemble` 瀑布里做首轮工具门控：会话处于 bootstrap 期间且未提升（promoted）时，只保留平台 shell 与 `str_replace_editor`；`whenIdle()` 完成、恢复真实消息之前先置为已提升，第二轮起的装配原样放行完整工具目录。
- preset 文件与官方 minimal 的 `agent.cordis.yml` 保持一致；模型面的系统提示词始终只有一句。其余工具并非本包注册，而是 profile 里其他 bundle 的全局工具，本包只决定它们在 bootstrap 轮隐藏、第二轮起恢复。
- bootstrap 的来源保持原生 `{ kind: 'user' }`，所以 Harness 自己负责生成、持久化和投影完整的 USER → ASSISTANT → TOOL → ASSISTANT 因果顺序。
- 当前工作目录由真实 shell 运行环境决定。

## 卸载

```bash
bash scripts/uninstall.sh
```

卸载器只移除本包注册和带 ownership marker 的 preset；内容发生漂移时会停止。卸载后重启 dsh web。`DSH_HOME` / `DSH_PROFILE` 环境变量对安装和卸载均生效。

## 数据与隐私

工作目录与工具输出会像普通 minimal 会话一样进入本地 transcript。仓库不包含 donor session 的目录列表或其他机器细节，请勿直接外发完整 session 日志。

## 已知限制

- 当前只提供一条固定 bootstrap 指令，不进行任务分类。
- bootstrap 是真实 provider turn，会进入 API transcript 与 token 计量。
- 首轮工具门控只过滤 `system-prompt/assemble` 的模型可见目录；是否成功引导出 `we need` 式思维链仍取决于所选模型与推理强度，本包不在提示词里注入风格文本。
- 升级 dsh 后如官方 minimal composition 变化，需要重新验证 prompt、两工具和无额外 context 的等价性。

## License

MIT。
