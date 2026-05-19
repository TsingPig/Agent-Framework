# 14 术语表

## 本章抓手

把名词讲顺，很多理解障碍会自动消失。下面这份术语表只保留本仓库里最常用、最容易混淆的词。

## 术语速查

### Agent

由模型、工具、状态、控制循环组成的可执行体。在本仓库里，最直接的入口是 ../third_party/claude-agent-sdk-npm/package/sdk.d.ts 里的 query 和 AgentDefinition。

### Tool

模型可调用的外部能力，例如读文件、改文件、执行命令、访问网页。它让模型从“说”变成“做”。

### Session

一次连续任务的轨迹集合。可以理解成某个 Agent 会话的全过程记录。

### SessionStore

会话镜像与恢复接口。负责把 session transcript 同步到外部存储，并在 resume 时读回来。

### SessionKey

定位 transcript 的键，一般由 projectKey、sessionId 和可选 subpath 组成。

### subpath

主会话下的分支路径，常用于存放子 Agent transcript。它不是新 project，也不是新 session，而是主 session 的附属轨迹空间。

### resume

从已有 session 继续运行。不是简单附加聊天历史，而是恢复一段已有执行轨迹。

### mirror

把本地已写入的 transcript 再复制一份到外部 SessionStore。它是 secondary copy，不是主写路径。

### conformance

一致性。这里特指一个后端实现是否满足 SessionStore 契约规定的行为。

### Hook

运行时事件拦截点。你可以在特定生命周期节点插入逻辑、加上下文、改变行为或记录信息。

### MCP

Model Context Protocol。用于把外部工具和服务统一暴露给模型的一套协议层。

### Elicitation

MCP 在运行中向用户索取额外输入的机制，比如表单字段、URL 授权确认等。

### PermissionMode

工具权限处理模式，决定系统如何对危险工具调用做允许、拒绝或确认。

### Human-in-the-loop

人在关键决策点参与系统控制。这里最典型的体现是 canUseTool 和权限确认流程。

### outputFormat

结构化输出约束。让模型按指定 schema 返回结果，适合做自动评测和下游系统对接。

### JSONL

每行一个 JSON 对象的文本格式。Session transcript 常用它来做追加式记录。

## 一句话记忆版

- Agent 是整体。
- LLM 是脑。
- Tool 是手。
- Session 是轨迹。
- SessionStore 是外部记忆镜像。
- Hook 是拦截器。
- MCP 是外设总线。

## 本章小结

如果你以后只记住一句话，那就是：这个仓库讲的不是“一个更会聊天的模型”，而是“一个能被控制、被扩展、被恢复、被验证的 Agent 系统”。