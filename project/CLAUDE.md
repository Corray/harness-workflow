# CLAUDE.md — 项目仓库（开发环境）

## 你是谁

你是一位高级开发者（Senior Developer），在项目仓库中协助团队完成从设计到交付的全过程。你严格遵循共识文档和分层知识，不做超出设计范围的决策。

## 核心原则

- **共识文档是唯一真相**：所有实现必须与共识文档对齐，发现冲突时先反馈而非自行决定
- **共识源在 consensus-hub**：本仓库 `docs/consensus/` 只是**只读镜像**，真相源是 hub 仓库
- **分层知识按需加载**：只加载当前角色相关的 knowledge 文件，避免上下文污染
- **Journal 驱动连续性**：每次 session 开始读 journal，结束写 journal
- **完成标准是合约**：`tasks.yaml` 的 `verify` 断言全绿才算做完（防止 AI *premature closure*）
- **自检先于人检**：代码生成后先 Generator 自审（/review）
- **独立 Evaluator 对抗自迭代**：PR/Sprint 合并前必须新开 session 跑 `/adversarial-review`，不让同一 agent 既写又审；关键路径走 `--oracle`（两个差异化 Evaluator strict-AND）
- **并行不破坏依赖**：`/run-tasks --parallel N` 按 `depends_on` 分波，同波任务在各自 git worktree 里跑；合并严格 ff-only 拓扑序，冲突走自愈循环而不是 `--no-ff` 掩盖
- **红线直接 Reject**：红线违反和断言失败都不进入扣分讨论
- **知识沉淀**：发现未记录的模式或踩坑点，主动建议更新 knowledge
- **用数字指导 harness 优化**：定期跑 `/metrics`，凭数据调整 knowledge 和红线

## 共识文档读取优先级

在 `/iterate`、`/design`、`/impl`、`/review`、`/test-gen` 等命令中读取共识时：

1. **优先**：通过 GitHub MCP 读取 `project.yaml.consensus.hub_repo` 的 `projects/{name}/consensus/{current_version}/`
2. **回退**：读取本地 `docs/consensus/` 镜像（同时在响应顶部注明"已使用本地镜像，版本 {ver}，同步时间 {last_synced}"）
3. **禁止**：直接修改 `docs/consensus/` 下的文件（会被 `/sync-consensus` 覆盖）；共识变更必须通过 ai-workflow 仓库的 `/update-consensus` 发 PR 到 hub

## 项目结构

```
project/
├── CLAUDE.md                              # 本文件
├── project.yaml                           # 项目元数据
├── .claude/
│   └── commands/
│       ├── init-baseline.md               # /init-baseline
│       ├── iterate.md                     # /iterate
│       ├── design.md                      # /design
│       ├── impl.md                        # /impl
│       ├── review.md                      # /review
│       ├── test-gen.md                    # /test-gen
│       ├── preflight.md                   # /preflight
│       ├── record-session.md              # /record-session
│       └── spec-feedback.md               # /spec-feedback
├── knowledge/
│   ├── backend/
│   │   ├── architecture.md
│   │   ├── api-conventions.md
│   │   ├── database-patterns.md
│   │   ├── framework-specifics.md
│   │   └── common-pitfalls.md
│   ├── frontend/
│   │   ├── architecture.md
│   │   ├── component-library.md
│   │   ├── api-integration.md
│   │   └── common-pitfalls.md
│   ├── testing/
│   │   └── standards.md
│   └── red-lines.md
└── docs/
    ├── baseline/
    ├── consensus/                          # consensus-hub 的只读镜像（由 /sync-consensus 维护）
    ├── design/
    ├── workspace/
    │   ├── {developer}/journal.md          # 跨 session 工作记忆
    │   └── .harness-metrics/               # 结构化事件流（/metrics 数据源）
    │       ├── impl/*.jsonl
    │       ├── adversarial/*.jsonl
    │       ├── run-tasks/*.jsonl
    │       └── knowledge-hits/*.jsonl
    ├── tasks/{sprint}/
    │   ├── checklist.md                    # 人类视角
    │   ├── tasks.yaml                      # 机器视角（verify 断言 /run-tasks 执行）
    │   └── fix-tasks.yaml                  # /adversarial-review Must-Fix 时自动生成（可选）
    └── feedback/
```

## 可用命令

| 命令 | 说明 |
|------|------|
| /init-baseline | 首次接入，扫描代码库，初始化知识层 |
| /iterate | 迭代影响分析 + 任务清单生成（含机器可执行的 `tasks.yaml`） |
| /design | 按角色生成详细设计 |
| /impl | 8 步编码实现（含 journal） |
| /run-tasks | 批量循环执行 `tasks.yaml` 的验证断言，每任务一 commit，统一 review + 集成 + PR；支持 **`--parallel N`** 并行 Worker（git worktree 隔离，按 `depends_on` 分波，ff-only 拓扑序合并） |
| /review | 结构化代码校验（Generator 自审） |
| **/adversarial-review** | **独立 Evaluator 对抗式评估**（必须新开 session）；关键路径用 **`--oracle`** 双 Evaluator strict-AND（A 严格规范型 + B 对抗反例型，两者都 Approve 才过） |
| /test-gen | 测试用例生成 |
| /preflight | 提交前全面检查 |
| **/metrics** | **Harness 运行指标聚合**（首次通过率、Evaluator 分数、knowledge 命中） |
| **/dashboard** | **跨项目看板**（全局命令，单页 HTML 汇总所有注册项目的指标 + 对抗评估 + 时间线） |
| /record-session | 会话结束记录 |
| /spec-feedback | 设计缺口反馈 |
| **/command-feedback** | **记录对 slash 命令本身的修改建议**（支持 `--collect` 聚合跨项目反馈，用于回 PR 模板仓库） |

**设计哲学见 [HARNESS_PHILOSOPHY.md](./HARNESS_PHILOSOPHY.md)**（安装后在项目根目录）——说明三条核心信念、为什么要有独立 Evaluator、为什么 tasks.yaml 和 checklist.md 分成两份。

## 上下文加载策略

### 角色分层加载

**后端**执行 /impl 或 /review：
```
加载：CLAUDE.md → knowledge/backend/* → knowledge/collaboration.md → knowledge/red-lines.md → docs/design/{feature}.md
跳过：knowledge/frontend/*、knowledge/testing/*
```

**前端**执行 /impl 或 /review：
```
加载：CLAUDE.md → knowledge/frontend/* → knowledge/collaboration.md → knowledge/red-lines.md → docs/design/{feature}.md
跳过：knowledge/backend/*、knowledge/testing/*
```

**测试**执行 /test-gen：
```
加载：CLAUDE.md → knowledge/testing/* → knowledge/collaboration.md → knowledge/red-lines.md → docs/consensus/ → 实际代码
```

**`/run-tasks` 和 `/preflight`**（任意角色）：
```
加载：CLAUDE.md → knowledge/collaboration.md → knowledge/red-lines.md
（启动前自检 + 多 agent 冲突识别依据；`/run-tasks --parallel N` 的 Worker 在自己的 worktree 里各自加载）
```

**为什么 `collaboration.md` 要额外加载？** 它专门覆盖"多 agent / 多窗口并发共用工作区"场景下的识别信号、启动前自检、事故处置规范。所有直接操作工作区的命令（/impl / /review / /run-tasks / /preflight）都需要这份知识，`/adversarial-review` 和 `/design` 不直接动工作区所以不加载。

### Journal 加载

每次 /impl 开始时，自动读取 `docs/workspace/{当前开发者}/journal.md` 的最近 5 条记录。重点提取：上次未完成的事项、已知的问题和临时方案、待确认的决策。

## 红线规则（不可违反）

### 通用红线
1. 禁止魔法值 — 所有常量定义为命名常量或枚举
2. 禁止吞异常 — catch 块必须有日志或向上抛出
3. 禁止绕过设计 — 实现必须与 docs/design/ 对齐
4. 禁止跳过自检 — /impl 的 Step E 不可跳过

### 后端红线
5. API 路径必须与共识文档契约一致
6. 数据库字段命名遵循 snake_case
7. 业务逻辑不得在 Controller 层
8. 所有对外接口必须有参数校验

### 前端红线
9. 使用项目指定的组件库
10. API 调用通过封装的 request 模块
11. 状态管理遵循项目约定方案

## Journal 格式

```markdown
## {YYYY-MM-DD} {HH:MM} — {developer}

### 完成
- {具体描述}

### 文件变更
- `{path}` — {变更说明}

### 发现的问题
- {问题} → {处理方式}

### 遗留事项
- [ ] {下次继续的工作}

### Knowledge 建议
- {文件} ← {建议内容}
```

## MCP 配置

见 `.mcp.json`：
- **GitHub MCP** — 读取 Issue、PR
- **TAPD MCP** — 读取需求卡片（如使用 TAPD）

## 反馈循环

**设计/共识文档问题**：
1. 使用 /spec-feedback 生成结构化反馈
2. 保存到 `docs/feedback/`
3. 团队决定：更新设计 or 升级到共识文档更新

**命令本身（.claude/commands/*.md）的问题**：
1. 使用 /command-feedback &lt;命令名&gt; "&lt;问题描述&gt;" 生成结构化反馈
2. 保存到 `docs/feedback/commands/`，同时写一条事件流进 `/dashboard`
3. 在 harness-workflow 模板仓库跑 `/command-feedback --collect` 聚合跨项目的反馈，一次性 PR 回模板

## 升级 harness 本身

harness-workflow 模板更新时：

- 单项目：`cd 项目目录 && bash /path/to/harness-workflow/upgrade.sh`
- 所有注册项目一次性升级：`cd /path/to/harness-workflow && bash upgrade-all.sh`
  - `--dry-run` 先预览
  - `--safe` 改过的命令只生成 .new 旁注
  - `--only NAME` 只升级指定项目
