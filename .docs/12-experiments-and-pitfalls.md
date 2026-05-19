# 12 示例运行、实验复现与常见坑

## 本章抓手

一套教程如果只讲概念，不告诉你怎么跑，就很难真正变成教材。这一章把“怎么验证你真的懂了”说清楚。

## 先看示例目录的组织方式

../examples/session-stores/README.md 已经给出了很好的说明：每个后端目录都是一个自包含小包，里面通常有：

- src：适配器实现。
- test：单元测试与 live conformance。
- demo.ts：最小端到端示例。
- package.json / tsconfig.json：独立依赖与编译设置。

这意味着你可以按“一个目录一个实验”的方式学习，而不必先把整个仓库改造成 monorepo 工程。

## 推荐的实验顺序

### 实验 1：只跑单元测试

先跑 Redis 的本地测试。因为它不需要真实后端，反馈最快。

### 实验 2：跑 live conformance

起一个真实 Redis、Postgres 或 MinIO，再跑 test:live。你会真正感受到“契约测试”不是纸面定义，而是行为门槛。

### 实验 3：跑 demo.ts

需要 ANTHROPIC_API_KEY。这个实验最重要的观察不是模型回答了什么，而是：

- sessionId 有没有拿到。
- resume 是否真的生效。
- 外部 SessionStore 是否记录到了会话。

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

如果你用 bun，也可以按目录内脚本切换。

## 这仓库最常见的几个坑

### 坑 1：把示例当生产代码

示例本身已经明确写了，它们是 reference adapters，不是生产级维护承诺。做实验可以，进生产前要补弹性、监控、清理和压测。

### 坑 2：以为 append 失败会中断主会话

不会。mirror 失败会变成 error event 暴露出来，但主会话继续。这是设计选择，不是 bug。

### 坑 3：忽略存储后端自己的行为模型

- Redis 可能 eviction。
- Postgres 可能表无限长大。
- S3 可能因为时钟偏斜或列举开销导致恢复行为和成本变差。

### 坑 4：把一致性测试当性能测试

conformance.ts 证明的是语义正确，不是吞吐极限。

## 很适合作为课程作业的三个小实验

- 给 Redis 版本加 TTL，并补充说明它会怎样影响 resume 语义。
- 仿照 Redis 写一个 SQLiteSessionStore，再接 conformance suite。
- 记录不同后端在相同 transcript 长度下的 load 延迟，做一张简单实验图。

## 本章小结

真正学会一个工程抽象，标志不是“能复述接口”，而是“能把它跑起来、改坏、再修好”。examples 目录就是为这件事准备的。