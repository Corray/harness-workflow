#!/usr/bin/env bash
#
# Harness Workflow 自动安装脚本
# 用法：
#   1. 进入要接入的项目目录
#   2. 运行：bash path/to/setup.sh
#   3. 按提示输入参数
#
# 安装内容：
# - 在当前项目下创建 .claude/commands/（13 个命令，含 /command-feedback）、knowledge/ 和 docs/ 结构
# - 项目根目录放置 HARNESS_PHILOSOPHY.md（设计哲学参考）
# - 在 docs/workspace/ 下初始化 .harness-metrics/ 事件流目录（/metrics 数据源）
# - 在 ~/.claude/commands/ 安装全局命令（sync-consensus, list-projects, dashboard）
# - 在 ~/.claude/harness-dashboard/ 安装 /dashboard 聚合脚本（跨项目共享）
# - 在 ~/.claude/harness-projects.yaml 注册本项目（/dashboard 项目列表数据源）
# - 可选：在指定位置创建 ai-workflow 规则中心仓库
#
set -e

# ----- 颜色定义 -----
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ----- 参数 -----
CURRENT_DIR=$(pwd)
AI_WORKFLOW_DIR=""
TEMPLATES_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${GREEN}=== Harness Workflow 安装脚本 ===${NC}"
echo ""

# ----- Step 1: 检查当前目录是否为项目仓库 -----
if [ ! -d ".git" ]; then
  echo -e "${RED}错误：当前目录不是 Git 仓库。${NC}"
  echo "请在项目根目录运行此脚本。"
  exit 1
fi

echo -e "${GREEN}[1/6] 检测到当前项目：${CURRENT_DIR}${NC}"
echo ""

# ----- Step 2a: 询问 consensus-hub 仓库地址 -----
read -p "consensus-hub 仓库地址（如 git@github.com:your-org/consensus-hub.git，可留空后续填）: " CONSENSUS_HUB_REPO
echo ""

# ----- Step 2: 询问 ai-workflow 位置 -----
read -p "ai-workflow 规则中心仓库路径（输入 create 创建新仓库，输入 skip 跳过）: " AI_WORKFLOW_INPUT

if [ "$AI_WORKFLOW_INPUT" = "create" ]; then
  read -p "新仓库创建到哪个路径？（如 ~/workspace/ai-workflow）: " AI_WORKFLOW_DIR
  AI_WORKFLOW_DIR="${AI_WORKFLOW_DIR/#\~/$HOME}"
  mkdir -p "$AI_WORKFLOW_DIR"
  cd "$AI_WORKFLOW_DIR"
  git init -q
  echo -e "${GREEN}[2/6] 创建 ai-workflow 仓库到：${AI_WORKFLOW_DIR}${NC}"

  # 复制 ai-workflow 模板
  cp -r "$TEMPLATES_DIR/ai-workflow/." "$AI_WORKFLOW_DIR/"
  mkdir -p "$AI_WORKFLOW_DIR/projects" "$AI_WORKFLOW_DIR/eval/cases"

  cd "$CURRENT_DIR"
  echo "  - CLAUDE.md 已就位"
  echo "  - 4 个命令文件已就位（new-consensus, update-consensus, eval, update-rules）"
  echo "  - knowledge/red-lines.md 已就位"
elif [ "$AI_WORKFLOW_INPUT" = "skip" ]; then
  echo -e "${YELLOW}[2/6] 跳过 ai-workflow 仓库${NC}"
else
  AI_WORKFLOW_DIR="${AI_WORKFLOW_INPUT/#\~/$HOME}"
  if [ ! -d "$AI_WORKFLOW_DIR" ]; then
    echo -e "${RED}错误：目录 $AI_WORKFLOW_DIR 不存在${NC}"
    exit 1
  fi
  echo -e "${GREEN}[2/6] 使用已有 ai-workflow：${AI_WORKFLOW_DIR}${NC}"
fi
echo ""

# ----- Step 3: 安装项目级配置 -----
echo -e "${GREEN}[3/6] 安装项目级配置到 ${CURRENT_DIR}${NC}"

mkdir -p .claude/commands
mkdir -p knowledge/backend knowledge/frontend knowledge/testing
mkdir -p docs/baseline docs/consensus docs/design docs/workspace docs/tasks docs/feedback

# 创建 /metrics 事件流目录骨架（/impl、/run-tasks、/adversarial-review 会往这里写 jsonl）
for sub in impl adversarial run-tasks knowledge-hits snapshots command-feedback; do
  mkdir -p "docs/workspace/.harness-metrics/$sub"
  touch "docs/workspace/.harness-metrics/$sub/.gitkeep"
done
mkdir -p docs/feedback/commands
touch docs/feedback/commands/.gitkeep

# 复制项目模板
cp "$TEMPLATES_DIR/project/CLAUDE.md" ./CLAUDE.md
cp "$TEMPLATES_DIR/HARNESS_PHILOSOPHY.md" ./HARNESS_PHILOSOPHY.md
cp -r "$TEMPLATES_DIR/project/.claude/commands/." ./.claude/commands/
cp "$TEMPLATES_DIR/project/knowledge/red-lines.md" ./knowledge/red-lines.md
cp "$TEMPLATES_DIR/project/.mcp.json" ./.mcp.json 2>/dev/null || true

COMMAND_COUNT=$(find "$TEMPLATES_DIR/project/.claude/commands" -maxdepth 1 -name "*.md" | wc -l | tr -d ' ')
echo "  - CLAUDE.md 已就位"
echo "  - HARNESS_PHILOSOPHY.md 已就位（设计哲学，建议通读）"
echo "  - ${COMMAND_COUNT} 个命令文件已就位（含 /adversarial-review、/metrics、/run-tasks、/command-feedback）"
echo "  - knowledge/red-lines.md 已就位"
echo "  - docs/workspace/.harness-metrics/ 事件流目录骨架已就位（/metrics 数据源）"
echo "  - .mcp.json 已就位（如存在）"
echo ""

# ----- Step 4: 生成 project.yaml -----
echo -e "${GREEN}[4/6] 生成 project.yaml${NC}"

PROJECT_NAME=$(basename "$CURRENT_DIR")
read -p "项目名（默认 $PROJECT_NAME）: " INPUT_NAME
PROJECT_NAME=${INPUT_NAME:-$PROJECT_NAME}

read -p "后端技术栈（如 java-spring-boot，留空跳过）: " BACKEND_STACK
read -p "前端技术栈（如 react，留空跳过）: " FRONTEND_STACK

GIT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "")
TODAY=$(date +%Y-%m-%d)

cat > project.yaml <<EOF
name: $PROJECT_NAME
stack:
  backend: $BACKEND_STACK
  frontend: $FRONTEND_STACK
repo:
  main: $GIT_REMOTE
baseline:
  commit: $GIT_COMMIT
  date: $TODAY
consensus:
  hub_repo: $CONSENSUS_HUB_REPO           # consensus-hub 仓库地址
  project_path: projects/$PROJECT_NAME    # 在 hub 中的子目录
  current_version: ""                     # /sync-consensus 会填充
  last_synced: ""                         # /sync-consensus 会填充
  mirror: docs/consensus/                 # 本地只读镜像路径
EOF

echo "  - project.yaml 已生成"
echo ""

# ----- Step 5: 安装全局命令 + 看板 -----
echo -e "${GREEN}[5/6] 安装全局命令到 ~/.claude/commands/${NC}"

mkdir -p ~/.claude/commands
cp "$TEMPLATES_DIR/global-commands/sync-consensus.md" ~/.claude/commands/
cp "$TEMPLATES_DIR/global-commands/list-projects.md" ~/.claude/commands/
cp "$TEMPLATES_DIR/global-commands/dashboard.md" ~/.claude/commands/ 2>/dev/null || true

# 安装 /dashboard 聚合脚本（跨项目共享）
if [ -f "$TEMPLATES_DIR/dashboard/build.py" ]; then
  mkdir -p ~/.claude/harness-dashboard
  cp "$TEMPLATES_DIR/dashboard/build.py" ~/.claude/harness-dashboard/build.py
fi

# 注册本项目到 ~/.claude/harness-projects.yaml（幂等）
HARNESS_YAML="$HOME/.claude/harness-projects.yaml"
if [ ! -f "$HARNESS_YAML" ]; then
  cat > "$HARNESS_YAML" <<YAML
version: 1
projects:
YAML
fi
if grep -F -q "    path: $CURRENT_DIR" "$HARNESS_YAML" 2>/dev/null; then
  REGISTERED_MSG="  - ~/.claude/harness-projects.yaml：本项目已注册，跳过"
else
  cat >> "$HARNESS_YAML" <<YAML
  - name: $PROJECT_NAME
    path: $CURRENT_DIR
    type: harness-workflow
    registered_at: $TODAY
YAML
  REGISTERED_MSG="  - ~/.claude/harness-projects.yaml：已注册 $PROJECT_NAME"
fi

# 写入全局配置
mkdir -p ~/.claude
cat > ~/.claude/config.yaml <<EOF
ai_workflow_path: $AI_WORKFLOW_DIR
consensus_hub_repo: $CONSENSUS_HUB_REPO
EOF
echo "  - /sync-consensus 已就位（全局）"
echo "  - /list-projects 已就位（全局）"
echo "  - /dashboard 已就位（全局，跨项目看板）"
echo "  - ~/.claude/harness-dashboard/build.py 已就位（看板聚合脚本）"
echo "$REGISTERED_MSG"
echo "  - ~/.claude/config.yaml 已记录 ai-workflow 路径和 consensus-hub 地址"
echo ""

# ----- Step 6: MCP 环境变量提示 -----
echo -e "${GREEN}[6/6] MCP 环境变量配置${NC}"
echo ""
echo -e "${YELLOW}请在 ~/.zshrc 或 ~/.bashrc 中添加以下环境变量：${NC}"
echo ""
echo '  export GITHUB_TOKEN="ghp_xxx"'
echo '  export FIGMA_API_KEY="figd_xxx"       # 如使用 Figma'
echo '  export LANHU_TOKEN="xxx"               # 如使用蓝湖'
echo '  export TAPD_ACCESS_TOKEN="xxx"          # 如使用 TAPD'
echo ""
echo -e "${YELLOW}TAPD MCP 依赖 uv（Python 工具运行器），如未安装请先执行：${NC}"
echo '  curl -LsSf https://astral.sh/uv/install.sh | sh'
echo ""

# ----- 完成 -----
echo -e "${GREEN}=== 安装完成 ===${NC}"
echo ""
echo "下一步："
echo "  1. 配置上述环境变量并 source"
echo "  2. 在项目仓库运行：claude"
echo "  3. 首次接入执行：/init-baseline"
echo ""
echo "日常工作流："
echo "  - 迭代开发：/iterate → /design → /run-tasks role=backend（按 tasks.yaml 循环执行）"
echo "  - PR 合并前：【新开 session】/adversarial-review --branch feature/xxx"
echo "  - 每周 / Sprint 结束：/metrics --days 7"
echo "  - 跨项目看板：/dashboard --open （所有注册项目的指标 + 对抗评估 + 时间线）"
echo "  - 踩到某条命令的坑：/command-feedback <命令名> \"<问题描述>\"（记录到 docs/feedback/commands/）"
echo "  - 批量升级所有注册项目：bash $TEMPLATES_DIR/upgrade-all.sh [--safe|--dry-run|--only NAME]"
echo ""
echo "想理解设计理念 → 读项目根目录的 HARNESS_PHILOSOPHY.md"
echo ""
if [ -z "$CONSENSUS_HUB_REPO" ]; then
  echo ""
  echo -e "${YELLOW}提示：你没有填写 consensus-hub 地址。${NC}"
  echo "  请在 GitHub 新建一个 private 仓库，例如 your-org/consensus-hub"
  echo "  仓库结构参考：outputs/consensus-hub/ 下的模板"
  echo "  创建后执行：echo 'consensus_hub_repo: git@github.com:your-org/consensus-hub.git' >> ~/.claude/config.yaml"
fi

if [ -n "$AI_WORKFLOW_DIR" ]; then
  echo "  4. 切换到 ai-workflow 仓库生成共识文档：cd $AI_WORKFLOW_DIR && claude"
  echo "  5. 执行：/new-consensus mode=3 project=$PROJECT_NAME ...（会推送到 consensus-hub 并发 PR）"
  echo "  6. PR 合并后回到项目仓库同步镜像：/sync-consensus project=$PROJECT_NAME"
fi
echo ""
