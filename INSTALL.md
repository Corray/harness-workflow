# Harness Workflow 安装指南

本指南基于三仓架构：**consensus-hub（共识中心）+ ai-workflow（规则中心）+ 项目仓库（业务代码）**，配合**命令全局和项目级都要** + **集成 GitHub / Figma / 蓝湖 / TAPD MCP**。

## 三仓协作概览

- **consensus-hub**：跨项目的共识文档中心，版本化存放，PR 评审制
- **ai-workflow**：命令、模板、评分规则，生成/更新共识文档并推送到 consensus-hub
- **项目仓库**：业务代码 + 本地共识镜像（只读），AI 读取时优先读 hub 源，断网回退镜像

## 目录结构总览

```
outputs/
├── INSTALL.md                # 本文件
├── setup.sh                  # 一键安装脚本（项目仓库 + 全局命令）
├── consensus-hub/            # 共识中心仓库模板（新建 private GitHub 仓库用）
│   ├── README.md
│   ├── .github/
│   │   └── PULL_REQUEST_TEMPLATE.md
│   └── projects/
│       └── example-project/
│           ├── project.meta.yaml
│           ├── CHANGELOG.md
│           └── consensus/v1.0/   # 示例目录，实际由 /new-consensus 生成
├── ai-workflow/              # 规则中心仓库模板（新建）
│   ├── CLAUDE.md
│   ├── instructions.md
│   ├── .mcp.json
│   ├── .claude/commands/
│   │   ├── new-consensus.md    # 生成共识 → 推到 consensus-hub 发 PR
│   │   ├── update-consensus.md # 基于 Issue 更新 → 新版本 PR
│   │   ├── eval.md
│   │   └── update-rules.md
│   └── knowledge/
│       └── red-lines.md
├── project/                  # 项目仓库叠加模板（覆盖到已有项目）
│   ├── CLAUDE.md
│   ├── .mcp.json
│   ├── .claude/commands/
│   │   ├── init-baseline.md
│   │   ├── iterate.md
│   │   ├── design.md
│   │   ├── impl.md
│   │   ├── review.md
│   │   ├── test-gen.md
│   │   ├── preflight.md
│   │   ├── record-session.md
│   │   └── spec-feedback.md
│   └── knowledge/
│       └── red-lines.md
└── global-commands/          # 放到 ~/.claude/commands/ 的全局命令
    ├── sync-consensus.md     # 从 hub 拉镜像到当前项目
    └── list-projects.md      # 扫描 hub 下所有项目
```

## 命令分工

### 全局命令（`~/.claude/commands/`）
不绑定具体项目，任何地方都能用：
- `/sync-consensus` — 从 ai-workflow 同步共识到当前项目
- `/list-projects` — 列出所有 ai-workflow 管理的项目

### ai-workflow 仓库命令（`ai-workflow/.claude/commands/`）
只在 ai-workflow 仓库内生效：
- `/new-consensus` — 从 PRD 生成共识文档
- `/update-consensus` — 基于 Issue 更新共识
- `/eval` — 评估共识生成质量
- `/update-rules` — 修正规则文件

### 项目仓库命令（`project/.claude/commands/`）
只在该项目内生效：
- `/init-baseline` — 首次接入
- `/iterate` — 迭代影响分析
- `/design` — 生成详细设计
- `/impl` — 8 步编码实现
- `/review` — 代码校验
- `/test-gen` — 测试生成
- `/preflight` — 提交前检查
- `/record-session` — 会话记录
- `/spec-feedback` — 设计反馈

## 快速安装（一键脚本）

```bash
# 1. 进入你已有的项目仓库
cd /path/to/your-existing-project

# 2. 运行安装脚本
bash /path/to/outputs/setup.sh

# 3. 按提示输入：
#    - ai-workflow 路径（输入 create 会自动创建新仓库）
#    - 项目名
#    - 技术栈

# 4. 配置环境变量（脚本会提示）

# 5. 重新打开终端或 source ~/.zshrc
```

## 手动安装步骤

如果你想了解每一步在做什么，或者不想用脚本，按以下步骤操作：

### Step 0：创建 consensus-hub 仓库（团队首次）

在 GitHub 新建一个 **private 仓库**（推荐名称 `consensus-hub`），然后：

```bash
# clone 到本地
cd ~/workspace
git clone git@github.com:your-org/consensus-hub.git
cd consensus-hub

# 把模板复制过来
cp -r /path/to/outputs/consensus-hub/. .

# 初始 commit + push
git add .
git commit -m "init: consensus-hub scaffolding"
git push origin main
```

记下这个仓库地址，后面 setup.sh 会要。

### Step 1：创建 ai-workflow 规则中心

```bash
# 选一个合适的位置，比如 ~/workspace/ai-workflow
mkdir -p ~/workspace/ai-workflow
cd ~/workspace/ai-workflow
git init

# 把模板复制过来（注意：不再需要 projects/ 目录，共识全放在 consensus-hub）
cp -r /path/to/outputs/ai-workflow/. .
mkdir -p eval/cases

# 初始 commit
git add .
git commit -m "init: ai-workflow scaffolding"
```

### Step 2：在已有项目中叠加配置

```bash
cd /path/to/your-existing-project

# 复制 CLAUDE.md（注意：如果已有，需手动合并）
cp /path/to/outputs/project/CLAUDE.md ./

# 复制命令
mkdir -p .claude/commands
cp /path/to/outputs/project/.claude/commands/*.md ./.claude/commands/

# 复制 knowledge 红线
mkdir -p knowledge
cp /path/to/outputs/project/knowledge/red-lines.md ./knowledge/

# 复制 MCP 配置
cp /path/to/outputs/project/.mcp.json ./

# 创建必要目录
mkdir -p docs/baseline docs/consensus docs/design docs/workspace docs/tasks docs/feedback
mkdir -p knowledge/backend knowledge/frontend knowledge/testing
```

### Step 3：创建 project.yaml

在项目根目录创建 `project.yaml`：

```yaml
name: your-project-name
stack:
  backend: java-spring-boot   # 或留空
  frontend: react              # 或留空
repo:
  main: git@github.com:xxx/your-project.git
baseline:
  commit: ""                   # /init-baseline 会填充
  date: ""
consensus:
  hub_repo: git@github.com:your-org/consensus-hub.git
  project_path: projects/your-project-name
  current_version: ""          # /sync-consensus 会填充
  last_synced: ""
  mirror: docs/consensus/
```

### Step 4：安装全局命令

```bash
mkdir -p ~/.claude/commands
cp /path/to/outputs/global-commands/*.md ~/.claude/commands/

# 记录 ai-workflow 路径和 consensus-hub 地址到全局配置
cat > ~/.claude/config.yaml <<EOF
ai_workflow_path: /Users/you/workspace/ai-workflow
consensus_hub_repo: git@github.com:your-org/consensus-hub.git
EOF
```

### Step 5：配置环境变量

在 `~/.zshrc` 或 `~/.bashrc` 中添加：

```bash
# GitHub（必须）
export GITHUB_TOKEN="ghp_xxx"

# Figma（模式 1 需要）
export FIGMA_API_KEY="figd_xxx"

# 蓝湖（模式 2 需要）
export LANHU_TOKEN="xxx"

# TAPD（如使用 TAPD 管需求）
export TAPD_ACCESS_TOKEN="xxx"
```

然后 `source ~/.zshrc`。

> 注：TAPD MCP 通过 `uvx` 运行，需要先安装 uv：
> ```bash
> curl -LsSf https://astral.sh/uv/install.sh | sh
> ```

### Step 6：验证安装

```bash
# 在项目仓库中
cd /path/to/your-existing-project
claude

# 在 Claude Code 中输入 / 应该能看到所有命令
# 试试：
/init-baseline
```

## 首次使用流程

### 1. 初始化项目基线（项目仓库内）

```
claude → /init-baseline
```

Claude 会扫描代码库、检测技术栈、填充 knowledge/ 模板、生成基线文档。

### 2. 为新项目生成共识（在 ai-workflow 仓库内）

```bash
cd ~/workspace/ai-workflow
claude
```

```
/new-consensus mode=3 project=your-project code-repo=git@... doc-repo=git@...
```

Claude 会读取代码和文档，生成 9 项共识文档，并**直接推送到 consensus-hub 发 PR**。团队在 GitHub 评审 PR，合并后共识就是 main 分支上的 v1.0。

### 3. 同步共识镜像到项目仓库

```bash
cd /path/to/your-existing-project
claude
```

```
/sync-consensus project=your-project
```

Claude 通过 GitHub MCP 拉取 hub 最新版本到 `docs/consensus/`（只读镜像），并更新 `project.yaml` 的版本指针。

### 4. 进入迭代开发循环

```
/iterate source=TAPD-12345
/design feature=xxx role=backend
/impl feature=xxx role=backend
/review feature=xxx role=backend
/test-gen feature=xxx
/preflight
```

### 5. 会话结束

```
/record-session
```

## 常见问题

### Q1: 已有的 CLAUDE.md 怎么办？
手动合并。把模板中的"你是谁"、"核心原则"、"可用命令"追加到已有 CLAUDE.md。项目特有的规则放到 knowledge/ 下。

### Q2: 团队成员如何同步这套配置？
`.claude/commands/`、`knowledge/`、`.mcp.json`、`CLAUDE.md` 都应该 commit 到 Git，团队成员 pull 就有了。全局命令（`~/.claude/commands/`）每个人自己安装。

### Q3: MCP 配置后仍不生效？
- 检查 Claude Code 版本（需支持项目级 `.mcp.json`）
- 检查环境变量是否在当前 shell 中 export 了
- 重启 Claude Code
- 用 `claude --debug` 查看 MCP 加载日志

### Q4: knowledge/ 下的模板文件很空？
是的，`/init-baseline` 会根据你的代码库自动填充。如果模板不满足需求，直接手动编辑即可——这些是项目特有的。

### Q5: 如何扩展新命令？
在 `.claude/commands/{name}.md` 中创建新文件，内容写命令的执行流程。立即生效，输入 `/name` 即可调用。

## 下一步

安装完后建议：
1. 跑通一次完整流程（P1 → P5）
2. 根据团队习惯调整 `knowledge/red-lines.md`
3. 在 `knowledge/backend/` 和 `knowledge/frontend/` 中补充团队积累的约定
4. 建立 eval 用例，让规则持续进化
