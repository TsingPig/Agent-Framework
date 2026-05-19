# 09 SessionStore 契约：这套仓库最像教材的部分

## 本章抓手

如果让我从这个仓库里选一个最适合研究生做代码精读和软件工程分析的主题，我会选 SessionStore。原因很简单：接口小、边界清、行为可测、实现可比。

## SessionStore 是干什么的

它负责把本地 session transcript 镜像到外部存储，并在需要时把完整会话重新装配回来。对应定义在 ../third_party/claude-agent-sdk-npm/package/sdk.d.ts。

最核心的接口有五个：

- append(key, entries)
- load(key)
- listSessions(projectKey)
- delete(key)
- listSubkeys(key)

其中只有 append 和 load 是必需项，其余是可选项。

## 先理解设计哲学

### 哲学 1：主写在本地，外部存储是镜像

append 是在本地写成功之后触发的 secondary copy。SessionStore 负责外部同步与恢复支持，本地 transcript 仍是主写路径。

### 哲学 2：接口保证行为，不强求具体存储形式

你可以用 Redis list、Postgres row、S3 part files 来实现。SDK 通过行为契约来约束这些实现，重点包括：

- 顺序是否正确。
- 主 transcript 与 subpath 是否隔离。
- 未知 key 是否返回 null。
- 删除是否按契约级联或精确删除。

### 哲学 3：深相等比字节相等更重要

文档明确说明，返回内容只需与 append 进去的数据 deep-equal。像 Postgres JSONB 这样的后端可以重排 object key，只要结构和内容保持一致即可。

## SessionKey 与 subpath

key 里除了 projectKey 和 sessionId，还可能有 subpath。你可以把 subpath 理解成“主 session 下面的分支轨迹”，典型场景是子 Agent transcript。

这意味着一个合格的存储实现必须处理两类空间：

- main transcript
- subpath transcript

而且它们不能互相污染。

## 13 项一致性测试在测什么

../examples/session-stores/shared/conformance.ts 定义了一套 13-contract suite。这套测试专注语义正确性；性能、吞吐和弹性需要单独压测。

| 测试主题 | 实际在保护什么 |
| --- | --- |
| append 后 load 顺序一致 | 基本可恢复性 |
| 未知 key 返回 null | 区分“没写过”和“空结果” |
| 多次 append 保持调用顺序 | 增量写入的正确性 |
| append([]) 是 no-op | 防止空批次污染状态 |
| subpath 与 main 隔离 | 子 Agent 不串台 |
| projectKey 隔离 | 项目维度不串台 |
| listSessions 行为 | 项目下会话发现 |
| listSessions 排除 subpath | 不把子路径伪装成 session |
| delete main | 删除主会话 |
| delete main 级联 subkeys | 清理完整 session |
| delete subpath 精确删除 | 不误删兄弟路径 |
| listSubkeys 返回当前会话子路径 | resume 可发现分支 |
| listSubkeys 不包含 main transcript | 主路径与子路径边界清楚 |

## 一张契约图

```mermaid
flowchart TD
    A[append main] --> B[load main]
    A --> C[listSessions]
    D[append subpath] --> E[load subpath]
    D --> F[listSubkeys]
    G[delete main] --> H[main 与 subpaths 一起删除]
    I[delete subpath] --> J[只删除该 subpath]
```

## 为什么这部分特别适合教学

- 接口尺寸小，读起来不累。
- 契约明确，容易设计单元测试。
- 三个后端实现差异很大，天然适合做比较分析。
- 它同时涉及软件工程、系统设计、实验评测。

## 给学生的一个好练习

自己写一个文件系统版 SessionStore，然后直接复用 ../examples/session-stores/shared/conformance.ts 来跑。这比空写一篇“我理解了接口”有价值得多。

## 本章小结

SessionStore 展示了一种很成熟的工程抽象：先定义最小契约，再用一致性测试锁住行为，最后允许多种后端自由实现。这个模式在很多系统研究中都非常值得借鉴。