# 14 术语表

## 本章抓手

把名词讲顺，很多理解障碍会自动消失。下面这份术语表只保留本仓库里最常用、最容易混淆的词。

## 术语速查

| 术语 | 含义 | 在本仓库里的落点 |
| --- | --- | --- |
| Agent | 由模型、工具、状态和控制循环组成的可执行体 | 入口看 query 和 AgentDefinition |
| Tool | 模型可调用的外部能力，例如读文件、改文件、执行命令 | 重点看 tools、allowedTools、canUseTool |
| Session | 一次连续任务的轨迹集合 | 重点看 sessionId、resume、SDKMessage |
| transcript | 一段 session 的逐条记录内容 | 主要出现在 SessionStore、resume 和 JSONL 场景 |
| SessionStore | 会话镜像与恢复接口 | 重点看 [09-session-store-contract.md](09-session-store-contract.md) 和 examples/session-stores |
| SessionKey | 定位 transcript 的键，通常由 projectKey、sessionId、subpath 组成 | 重点看 projectKey、sessionId、subpath 这三个维度 |
| subpath | 主会话下的分支路径，常存子 Agent transcript | 重点看 resume、listSubkeys 和子 Agent transcript |
| resume | 从已有 session 继续运行 | 重点看 [04-first-query.md](04-first-query.md) 和 [08-message-stream-and-resume.md](08-message-stream-and-resume.md) |
| mirror | 本地写成功后追加的外部会话镜像 | 重点看 [08-message-stream-and-resume.md](08-message-stream-and-resume.md) 和 [09-session-store-contract.md](09-session-store-contract.md) |
| conformance | 实现满足既定契约行为的一致性达标 | 重点看 examples/session-stores/shared/conformance.ts |
| Hook | 生命周期中的拦截点 | 重点看 [07-agents-hooks-mcp.md](07-agents-hooks-mcp.md) 和 HookEvent |
| MCP | Agent 接外部能力的统一协议层 | 重点看 mcpServers 和 [07-agents-hooks-mcp.md](07-agents-hooks-mcp.md) |
| Elicitation | MCP 在运行中向用户索取额外输入的机制 | 重点看 onElicitation 和相关 hook |
| PermissionMode | 工具权限处理模式 | 重点看 [06-permissions-and-sandbox.md](06-permissions-and-sandbox.md) |
| Human-in-the-loop | 在关键决策点引入人工或策略审批 | 重点看 canUseTool 和权限确认流程 |
| outputFormat | 结构化输出约束，让模型按 schema 返回结果 | 重点看 Options 和结构化评测场景 |
| JSONL | 每行一个 JSON 对象的文本格式 | 常用于 transcript 存储和恢复 |
| npm | Node.js 生态里的包管理器与包发布渠道 | 常出现在 package.json、npm install、npm run |
| package | 可安装的软件包 | 在本仓库里常表现为带 package.json 的独立实验目录 |
| SDK | 给开发者调用的接口、类型和运行能力集合 | 核心文件是 sdk.d.ts 与 sdk.mjs |
| upstream | 上游官方来源 | 重点看 README 和 INPLUSLAB_BOOTSTRAP.md |
| snapshot | 某一时点固定下来的版本副本 | 重点看版本追踪和复现说明 |
| baseline | 后续实验对比的起点实现 | 重点看研究扩展与实验对照 |

## 一句话记忆版

- Agent 是整体。
- LLM 是脑。
- Tool 是手。
- Session 是轨迹。
- SessionStore 是外部记忆镜像。
- Hook 是拦截器。
- MCP 是外设总线。

## 本章小结

如果你以后只记住一句话，那就是：这个仓库在讲一套能被控制、被扩展、被恢复、被验证的 Agent 系统。