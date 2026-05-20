# 08 消息流、结果流与会话恢复

## 本章抓手

如果你把 Agent 当成一个黑盒，只盯最终 result，会失去很多关键信息。这个 SDK 的一个强点是：它把运行过程暴露成了一条消息流。

## SDKMessage 为什么重要

在 ../third_party/claude-agent-sdk-npm/package/sdk.d.ts 中，SDKMessage 是一个很大的联合类型。你不需要一口气记住所有成员，但要先抓住这几类：

先抓住两类最关键的消息就够了：会话刚启动时的 `system/init`，以及一轮结束时的 `result/success`。Python 版本是教学等价写法，不代表仓库当前存在同名 Python 类型文件。

<style>
.code-tabs {
  margin: 16px 0;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  overflow: hidden;
}

.code-tabs input {
  display: none;
}

.code-tabs .tab-labels {
  display: flex;
  background: #f6f8fa;
  border-bottom: 1px solid #d0d7de;
}

.code-tabs .tab-labels label {
  padding: 8px 14px;
  cursor: pointer;
  font-size: 14px;
  border-right: 1px solid #d0d7de;
}

.code-tabs .tab-panel {
  display: none;
  padding: 0;
}

.code-tabs pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
}

#message-tab-ts:checked ~ .tab-labels label[for="message-tab-ts"],
#message-tab-py:checked ~ .tab-labels label[for="message-tab-py"] {
  background: white;
  font-weight: 600;
}

#message-tab-ts:checked ~ .tab-content .ts,
#message-tab-py:checked ~ .tab-content .py {
  display: block;
}
</style>
<div class="code-tabs">
<input type="radio" name="message-code-tab" id="message-tab-ts" checked>
<input type="radio" name="message-code-tab" id="message-tab-py">
<div class="tab-labels">
<label for="message-tab-ts">TypeScript</label>
<label for="message-tab-py">Python</label>
</div>
<div class="tab-content">
<div class="tab-panel ts">

```ts
export declare type SDKSystemMessage = {
    type: 'system';
    subtype: 'init';
    cwd: string;
    tools: string[];
    mcp_servers: { name: string; status: string }[];
    model: string;
    permissionMode: PermissionMode;
    skills: string[];
    session_id: string;
};

export declare type SDKResultSuccess = {
    type: 'result';
    subtype: 'success';
    result: string;
    num_turns: number;
    total_cost_usd: number;
    session_id: string;
};
```

</div>
<div class="tab-panel py">

```py
class SDKSystemInitMessage(TypedDict):
    type: Literal["system"]
    subtype: Literal["init"]
    cwd: str
    tools: list[str]
    mcp_servers: list[dict[str, str]]
    model: str
    permissionMode: PermissionMode
    skills: list[str]
    session_id: str

class SDKResultSuccess(TypedDict):
    type: Literal["result"]
    subtype: Literal["success"]
    result: str
    num_turns: int
    total_cost_usd: float
    session_id: str
```

</div>
</div>
</div>

> `system/init` 负责告诉你“这一轮已经启动，现场配置是什么，session_id 是多少”；`result/success` 负责告诉你“这一轮结束了，答案是什么，消耗了多少回合和成本”。

- `system/init` 更像启动回执。
- `result/success` 更像结案回执。
- 两条消息里都带 `session_id`，这正是为什么你可以把“启动”和“收束”挂到同一条会话线上来读。

- assistant 或 stream_event：模型正在说什么。
- system/init：会话启动了，session_id 出来了。
- system/status：当前阶段在做什么。
- result：这轮任务以什么方式收束。
- system/mirror_error：外部会话镜像失败了，但主流程可能还继续。
- task_progress / task_started / task_updated：多 Agent 场景下的任务进展。
- prompt_suggestion：系统预测你下一轮可能会问什么。

## 为什么消息流比“一次返回一个字符串”更强

因为它允许你做三件传统 API 很难做好的事情：

- 做实时 UI，让界面可以边生成边反馈。
- 做过程级观测，直接看到执行链路中的关键节点。
- 做失败定位，知道问题出在权限、工具、镜像还是模型。

## 推荐的消费方式

```ts
for await (const m of query({ prompt, options })) {
  if (m.type === 'system' && m.subtype === 'init') {
    console.log('session id =', m.session_id)
  }

  if (m.type === 'stream_event') {
    // 处理流式片段
  }

  if (m.type === 'result') {
    console.log('final =', 'result' in m ? m.result : '')
  }
}
```

## includePartialMessages 与 includeHookEvents

默认情况下，你未必能看到所有过程细节。Options 中有两个很关键的开关：

- includePartialMessages：把流式片段显式发出来。
- includeHookEvents：把 hook_started、hook_progress、hook_response 这类事件发出来。

这两个开关特别适合做研究可观测性或 Agent UI 原型。

## resume 到底在恢复什么

resume 会恢复一段完整 session 的运行上下文。对于接了 SessionStore 的场景，恢复路径大致是：

1. 用 sessionId 找到主 transcript。
2. 如果实现了 listSubkeys，再把子 Agent transcript 一并找出来。
3. 把这些内容 materialize 成临时 JSONL，也就是把恢复所需的会话条目真正落成一个临时文件。
4. 再让 Claude Code 的既有恢复逻辑从这个临时文件继续。

这就是为什么 SessionStore 的 load 和 listSubkeys 语义必须清晰。

## 一张恢复时序图

```mermaid
sequenceDiagram
    participant U as User Code
    participant Q as query(resume)
    participant SS as SessionStore
    participant T as Temp JSONL
    participant C as Claude Runtime

    U->>Q: resume = sessionId
    Q->>SS: load(main transcript)
    Q->>SS: listSubkeys()
    Q->>SS: load(each subpath)
    Q->>T: materialize JSONL
    Q->>C: 从临时 transcript 恢复
    C-->>U: system/init / result / 其他消息
```

## mirror_error 为什么值得单独注意

SessionStore 的 append 走的是镜像路径，主写仍在本地 transcript。SDK 文档明确说：如果 append 失败，会记录并发出 mirror_error，但主会话不会因此被阻断。这背后是一个很务实的工程选择：

- 主任务优先完成。
- 外部镜像失败需要被看见，但不应拖死主流程。

对于实验系统，这一点很重要，因为你不能把“额外观测模块”变成“主任务单点故障”。

## 本章小结

把 query 的输出按消息流来读，你就能看到系统初始化、过程观测、恢复和镜像错误这些关键事件。resume、hook 观测和多 Agent 进度，也都依赖这条流来暴露。
