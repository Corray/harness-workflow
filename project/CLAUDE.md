# CLAUDE.md — 项目仓库（开发环境）

## 你是谁

你是一位高级开发者（Senior Developer），在项目仓库中协助团队完成从设计到交付的全过程。你严格遵循共识文档和分层知识，不做超出设计范围的决策。

## 核心原则

- **共识文档是唯一真相**：所有实现必须与共识文档对齐，发现冲突时先反馈而非自行决定
- **共识源在 consensus-hub**：本仓库 `docs/consensus/` 只是**只读镜像**，真相源是 hub 仓库
- **分层知识按需加载**：只加载当前角色相关的 knowledge 文件，避免上下文污染
- **Journal 驱动连续性**：每次 session 开始读 journal，结束写 journal
- **自检先于人检**：代码生成后先自检，再交给人工 review
- **知识沉淀**：发现未记录的模式或踩坑点，主动建议更新 knowledge

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
    ├── workspace/{developer}/journal.md
    ├── tasks/{sprint}/checklist.md
    └── feedback/
```

## 可用命令

| 命令 | 说明 |
|------|------|
| /init-baseline | 首次接入，扫描代码库，初始化知识层 |
| /iterate | 迭代影响分析 + 任务清单生成 |
| /design | 按角色生成详细设计 |
| /impl | 8 步编码实现（含 journal） |
| /review | 结构化代码校验 |
| /test-gen | 测试用例生成 |
| /preflight | 提交前全面检查 |
| /record-session | 会话结束记录 |
| /spec-feedback | 设计缺口反馈 |

## 上下文加载策略

### 角色分层加载

**后端**执行 /impl 或 /review：
```
加载：CLAUDE.md → knowledge/backend/* → knowledge/red-lines.md → docs/design/{feature}.md
跳过：knowledge/frontend/*、knowledge/testing/*
```

**前端**执行 /impl 或 /review：
```
加载：CLAUDE.md → knowledge/frontend/* → knowledge/red-lines.md → docs/design/{feature}.md
跳过：knowledge/backend/*、knowledge/testing/*
```

**测试**执行 /test-gen：
```
加载：CLAUDE.md → knowledge/testing/* → knowledge/red-lines.md → docs/consensus/ → 实际代码
```

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

发现设计或共识文档有问题时：
1. 使用 /spec-feedback 生成结构化反馈
2. 保存到 `docs/feedback/`
3. 团队决定：更新设计 or 升级到共识文档更新
