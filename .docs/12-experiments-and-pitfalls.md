# 12 示例运行、实验复现与常见坑

## 本章抓手

一套教程如果只讲概念，不告诉你怎么跑，就很难真正变成教材。这一章把“怎么验证你真的懂了”说清楚。

## 先看示例目录的组织方式

../examples/session-stores/README.md 已经给出了很好的说明：每个后端目录都是一个自包含小包，里面通常有：

- src：适配器实现。
- test：单元测试与 live conformance，也就是“连上真实后端去跑契约测试”。
- demo.ts：最小端到端示例。
- package.json / tsconfig.json：独立依赖与编译设置。

这意味着你可以按“一个目录一个实验”的方式学习，而不必先把整个仓库改造成 monorepo 工程。

## 推荐的实验顺序

### 实验 1：只跑单元测试

先跑 Redis 的本地测试。因为它不需要真实后端，反馈最快。

### 实验 2：跑 live conformance

起一个真实 Redis、Postgres 或 MinIO，再跑 test:live。这里的 live conformance 指的是接上真实后端验证它是否真的满足契约。你会真正感受到，契约测试对应的是一条实际行为门槛。

### 实验 3：跑 demo.ts

需要 ANTHROPIC_API_KEY。这个实验的观察重点放在下面三件事：

- sessionId 有没有拿到。
- resume 是否真的生效。
- 外部 SessionStore 是否记录到了会话。

## live conformance 到底长什么样

这一步最好不要只靠嘴讲。仓库里已经把真正的契约测试写成了一个可复用的 TS 测试套件。Python 版本是教学等价写法，用来帮助你理解它在测什么，不代表仓库当前真的提供了 pytest 版。

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

#conformance-tab-ts:checked ~ .tab-labels label[for="conformance-tab-ts"],
#conformance-tab-py:checked ~ .tab-labels label[for="conformance-tab-py"] {
  background: white;
  font-weight: 600;
}

#conformance-tab-ts:checked ~ .tab-content .ts,
#conformance-tab-py:checked ~ .tab-content .py {
  display: block;
}
</style>
<div class="code-tabs">
<input type="radio" name="conformance-code-tab" id="conformance-tab-ts" checked>
<input type="radio" name="conformance-code-tab" id="conformance-tab-py">
<div class="tab-labels">
<label for="conformance-tab-ts">TypeScript</label>
<label for="conformance-tab-py">Python</label>
</div>
<div class="tab-content">
<div class="tab-panel ts">

```ts
describe('MyStore', () => {
  runSessionStoreConformance(async () => new MyStore(...))
})

test('append then load returns same entries in same order', async () => {
  const store = await makeStore()
  const entries = [E('a', { n: 1 }), E('b', { n: 2 })]
  await store.append(KEY, entries)
  expectEntries(await store.load(KEY), entries)
})
```

</div>
<div class="tab-panel py">

```py
@pytest.mark.asyncio
async def test_append_then_load_returns_same_entries_in_same_order(make_store):
    store = await make_store()
    entries = [{"type": "a", "n": 1}, {"type": "b", "n": 2}]
    await store.append(KEY, entries)
    assert await store.load(KEY) == entries
```

</div>
</div>
</div>

> `runSessionStoreConformance(...)` 的作用很像“统一监考卷”。你换什么后端都可以，但必须把同一套题答对，才能说明你实现的是同一个契约，而不是一个名字相同、行为不同的接口。

- 第一行 `describe + runSessionStoreConformance` 说明这套测试是可复用的。
- 下面这个 `append then load` 用最小案例保护了“写进去什么，就按顺序读回来什么”。
- 这类测试的价值不在于复杂，而在于它给了你一条稳定的行为底线。

## Redis 示例最小运行路径

参考 ../examples/session-stores/redis/package.json 和 ../examples/session-stores/redis/demo.ts，可形成这样的操作顺序：

```bash
docker run -d -p 6379:6379 redis:7-alpine
cd examples/session-stores/redis
npm install
npm test
SESSION_STORE_REDIS_URL=redis://localhost:6379/0 npm run test:live
SESSION_STORE_REDIS_URL=redis://localhost:6379/0 npm run demo
```

这里的 npm install 是安装当前示例包依赖；npm run demo 则是按 package.json 里定义的脚本去执行 demo.ts。

如果你用 bun，也可以按目录内脚本切换。

## 这仓库最常见的几个坑

### 坑 1：把示例当生产代码

示例本身已经明确写了，它们是 reference adapters，适合教学和实验。进入生产前，还需要补弹性、监控、清理和压测。

### 坑 2：以为 append 失败会中断主会话

mirror 失败会变成 error event 暴露出来，但主会话继续。这是有意的设计取舍，目的是保证主任务优先完成。

### 坑 3：忽略存储后端自己的行为模型

- Redis 可能 eviction。
- Postgres 可能表无限长大。
- S3 可能因为时钟偏斜或列举开销导致恢复行为和成本变差。

### 坑 4：把一致性测试当性能测试

conformance.ts 验证的是语义正确性；吞吐极限需要单独压测。

## 很适合作为课程作业的三个小实验

- 给 Redis 版本加 TTL，并补充说明它会怎样影响 resume 语义。
- 仿照 Redis 写一个 SQLiteSessionStore，再接 conformance suite。
- 记录不同后端在相同 transcript 长度下的 load 延迟，做一张简单实验图。

## 本章小结

真正学会一个工程抽象，通常要经历跑起来、改坏、再修好这三个阶段。examples 目录就是为这件事准备的。
