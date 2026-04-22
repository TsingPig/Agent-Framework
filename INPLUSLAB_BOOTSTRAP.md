# InplusLab Agent Bootstrap

This repository is currently bootstrapped from Anthropic's Claude Agent SDK ecosystem so we have a clean base for later secondary development.

## Current snapshot

- Snapshot date: 2026-04-22
- Upstream GitHub repo: `https://github.com/anthropics/claude-agent-sdk-typescript`
- Upstream commit: `b3623dc512d9dbfb9827959182cfcd34d84038dd`
- Upstream tag: `v0.2.117`
- Published npm package: `@anthropic-ai/claude-agent-sdk@0.2.117`

## What is in this repo now

- Repository root: a direct clone of the official `claude-agent-sdk-typescript` GitHub repository, tracked through the `upstream` remote.
- `third_party/claude-agent-sdk-npm/package`: the extracted npm release package, including the published JavaScript bundles and TypeScript declaration files.

## Why keep both

- The GitHub repository preserves the public upstream history, release notes, and examples.
- The npm package contains the actual published SDK artifacts (`sdk.mjs`, `assistant.mjs`, `bridge.mjs`, `*.d.ts`) that we can inspect when designing our own extensions.
- Anthropic's public GitHub repo is currently much lighter than the published package, so keeping both makes the base easier to understand.

## Recommended next step for our lab

Create our own extension layer in a separate directory such as `packages/`, `src/`, or `experiments/`, and treat the imported SDK snapshot as the upstream baseline. That makes it easier to:

- integrate methods from group papers and project code,
- compare our changes against upstream releases,
- and keep a clean boundary between official SDK behavior and InplusLab-specific extensions.

## Git note

This local repository now has:

- `origin`: `https://github.com/InplusLab-Agent/Agent-Framework.git`
- `upstream`: `https://github.com/anthropics/claude-agent-sdk-typescript.git`

Keep `origin` for the lab's work and `upstream` for tracking future Anthropic releases.
