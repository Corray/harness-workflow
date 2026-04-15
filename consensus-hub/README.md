# Consensus Hub

跨项目共识文档中心。产品、前端、后端、测试共用的**单一真相源**。

## 这是什么？

- 存放所有项目的**共识文档**（9 项结构，业务语言书写）
- 由 `ai-workflow` 仓库的 `/new-consensus` / `/update-consensus` 命令生成
- 各项目仓库通过 `/sync-consensus` 命令拉取最新版本做本地镜像
- AI 读取优先级：**hub 源 > 本地镜像**（断网时自动回退）

## 目录结构

```
consensus-hub/
├── README.md
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md    # 共识评审 PR 模板
└── projects/
    └── {project-name}/
        ├── project.meta.yaml        # 项目元数据（stack、责任人、关联 repo）
        ├── CHANGELOG.md             # 版本变更记录
        ├── consensus/
        │   ├── v1.0/                # 每个版本独立目录（方便 diff）
        │   │   ├── 01-completeness.md   # 资料完整性
        │   │   ├── 02-business-flow.md  # 业务流程图
        │   │   ├── 03-modules.md        # 功能模块划分
        │   │   ├── 04-data-model.md     # 核心数据结构
        │   │   ├── 05-api-contract.md   # 前后端契约
        │   │   ├── 06-boundaries.md     # 分工边界
        │   │   ├── 07-risks.md          # 风险与疑问
        │   │   ├── 08-roadmap.md        # 前瞻性确认
        │   │   └── 09-lovable.md        # Lovable 差异
        │   ├── v1.1/
        │   └── latest -> v1.1/          # symlink 指向最新
        └── archive/                     # 淘汰历史版本
```

## 权限与协作

- **默认 private**，团队成员通过 GitHub 权限控制访问
- **所有变更走 PR 评审**（不允许直接 push main）
- PR 评审人默认：1 位产品 + 1 位后端 + 1 位前端 + 1 位测试（可在 CODEOWNERS 调整）
- 评审通过后合并到 main，各项目仓库执行 `/sync-consensus` 拉最新

## 版本命名

- 语义化：`v{major}.{minor}`
- `major` 升级 = 破坏性变更（API 契约重写、数据模型大改）
- `minor` 升级 = 增量变更（新增字段、流程补充）
- 每个版本独立目录，方便做 diff 和回滚

## 如何使用

### 生成首版
在 `ai-workflow` 仓库执行：
```
/new-consensus mode=1 project=your-project prd=... figma=...
```
Claude 会把生成结果推送到本仓库的 `projects/your-project/consensus/v1.0/` 并发起 PR。

### 更新版本
在 `ai-workflow` 仓库执行：
```
/update-consensus project=your-project
```
根据 GitHub Issue 生成 Change Log，合并为新版本，发起 PR。

### 项目仓库同步
在项目仓库执行：
```
/sync-consensus project=your-project
```
拉取 hub 最新版本到 `docs/consensus/` 本地镜像（只读）。
