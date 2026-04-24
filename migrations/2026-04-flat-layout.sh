#!/usr/bin/env bash
#
# 一次性迁移脚本：把 harness-workflow 的老布局迁到扁平布局（2026-04）
#
# 变更摘要：
#   · knowledge/            → .claude/knowledge/
#   · 所有命令文件里的 knowledge/xxx 路径引用已改为 .claude/knowledge/xxx
#   · 新增 backend/frontend/testing 下的种子 knowledge 文件
#   · docs/workspace/.harness-metrics/ 补齐 6 个子目录
#
# 与 upgrade.sh 的关系：
#   · 本脚本与 upgrade.sh 完全正交，只做"一次性结构迁移"
#   · upgrade.sh 继续按自己的节奏迭代，不受本脚本影响
#   · 本脚本是幂等的：已迁移过的项目重跑会跳过，只做补齐
#
# 用法：
#   单项目（在目标项目根目录执行）：
#     bash /path/to/harness-workflow/migrations/2026-04-flat-layout.sh [flags]
#
#   批量（读取 ~/.claude/harness-projects.yaml 注册表）：
#     bash /path/to/harness-workflow/migrations/2026-04-flat-layout.sh --all [flags]
#
# 标志：
#   --dry-run     只预览会做什么，不实际修改
#   --safe        覆盖命令文件时只生成 .new 旁注，不直接覆盖
#   --all         读取注册表对所有项目批量执行
#   --only NAME   配合 --all 使用，只处理指定项目
#   -h, --help    显示用法
#
# 安全保障：
#   · 默认覆盖命令文件会自动生成 .bak.{timestamp} 备份
#   · 完全不动：CLAUDE.md / HARNESS_PHILOSOPHY.md / project.yaml / .mcp.json /
#               用户已写的 knowledge 内容 / docs/workspace/{dev}/journal.md /
#               docs/consensus/ / docs/design/ / docs/baseline/
#   · 改动前会提示 git status 未 commit 的变更，让你选择是否继续

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ----- 参数解析 -----
DRY_RUN=0
SAFE_MODE=0
ALL_MODE=0
ONLY_NAME=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --safe) SAFE_MODE=1 ;;
    --all) ALL_MODE=1 ;;
    --only) ;;  # 下一个参数是名字，占位
    --only=*) ONLY_NAME="${arg#--only=}" ;;
    -h|--help)
      awk 'NR==1 && /^#!/ {next} /^#/ {sub(/^#[ ]?/,""); print; next} {exit}' "$0"
      exit 0
      ;;
  esac
done
# 处理 --only NAME 形式（分开两个参数）
prev=""
for arg in "$@"; do
  [ "$prev" = "--only" ] && ONLY_NAME="$arg"
  prev="$arg"
done

TEMPLATES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# ----- 工具函数 -----
log_info()  { echo -e "${BLUE}$1${NC}"; }
log_ok()    { echo -e "${GREEN}$1${NC}"; }
log_warn()  { echo -e "${YELLOW}$1${NC}"; }
log_err()   { echo -e "${RED}$1${NC}"; }

# 迁移单个项目的函数（在该项目的根目录被调用）
migrate_one() {
  local PROJECT_DIR="$1"
  local PROJECT_NAME="$2"
  [ -z "$PROJECT_NAME" ] && PROJECT_NAME=$(basename "$PROJECT_DIR")

  echo ""
  log_info "════════════════════════════════════════════════════════"
  log_info "迁移项目：$PROJECT_NAME"
  log_info "路径：$PROJECT_DIR"
  log_info "════════════════════════════════════════════════════════"

  cd "$PROJECT_DIR"

  # 前置检查
  if [ ! -d ".git" ]; then
    log_err "  ✗ 不是 Git 仓库，跳过"
    return 1
  fi
  if [ ! -d ".claude/commands" ] || [ ! -f "./CLAUDE.md" ]; then
    log_err "  ✗ 看起来还没接入 harness（缺 .claude/commands/ 或 CLAUDE.md），跳过"
    log_info "    请改用首次安装：bash $TEMPLATES_DIR/setup.sh"
    return 1
  fi

  # Git 清洁检查
  if [ -n "$(git status --porcelain)" ] && [ $DRY_RUN -eq 0 ]; then
    log_warn "  ⚠  有未提交改动。建议先 commit/stash 再迁移（便于回滚）"
    read -p "  继续？(y/N): " C
    if [ "$C" != "y" ] && [ "$C" != "Y" ]; then
      log_info "  已跳过"
      return 0
    fi
  fi

  local ADDED=()
  local SKIPPED=()
  local UPDATED=()
  local BACKED_UP=()
  local NEW_SIDECAR=()
  local MIGRATED=()

  # ----- Step 1：迁移 knowledge/ → .claude/knowledge/ -----
  echo ""
  log_info "[1/4] 迁移 knowledge/ → .claude/knowledge/"

  if [ -d "knowledge" ] && [ ! -d ".claude/knowledge" ]; then
    if [ $DRY_RUN -eq 1 ]; then
      log_info "  [dry-run] git mv knowledge .claude/knowledge"
    else
      git mv knowledge .claude/knowledge
      log_ok "  ✓ git mv knowledge .claude/knowledge（rename 历史保留）"
    fi
    MIGRATED+=("knowledge/ → .claude/knowledge/")
  elif [ -d ".claude/knowledge" ] && [ -d "knowledge" ]; then
    log_warn "  ⚠  同时存在 knowledge/ 和 .claude/knowledge/，请人工确认合并后再跑"
    return 1
  elif [ -d ".claude/knowledge" ]; then
    log_info "  · 已经是新布局（.claude/knowledge/ 存在），跳过迁移"
    SKIPPED+=("knowledge 迁移（已完成）")
  else
    log_info "  · 没有 knowledge/ 目录，创建 .claude/knowledge/"
    [ $DRY_RUN -eq 0 ] && mkdir -p .claude/knowledge
  fi

  # ----- Step 2：补齐 knowledge 种子文件（只补缺的，不覆盖已有） -----
  echo ""
  log_info "[2/4] 补齐 knowledge 种子文件（backend / frontend / testing）"

  for sub in backend frontend testing; do
    [ $DRY_RUN -eq 0 ] && mkdir -p ".claude/knowledge/$sub"
    if [ -d "$TEMPLATES_DIR/.claude/knowledge/$sub" ]; then
      for f in "$TEMPLATES_DIR/.claude/knowledge/$sub"/*.md; do
        [ -e "$f" ] || continue
        base=$(basename "$f")
        dst=".claude/knowledge/$sub/$base"
        if [ ! -e "$dst" ]; then
          if [ $DRY_RUN -eq 1 ]; then
            log_info "  [dry-run] 新增 $dst"
          else
            cp "$f" "$dst"
          fi
          ADDED+=("$dst")
        else
          SKIPPED+=("$dst（已存在，保留用户内容）")
        fi
      done
    fi
  done

  # collaboration.md / red-lines.md 已在根 knowledge/ 下，Step 1 已随迁移搬过来；
  # 如果用户是从更老的版本（连 collaboration.md 都没有）升上来的，这里补齐
  for top in collaboration.md red-lines.md; do
    src="$TEMPLATES_DIR/.claude/knowledge/$top"
    dst=".claude/knowledge/$top"
    if [ -f "$src" ] && [ ! -f "$dst" ]; then
      if [ $DRY_RUN -eq 1 ]; then
        log_info "  [dry-run] 新增 $dst"
      else
        cp "$src" "$dst"
      fi
      ADDED+=("$dst")
    fi
  done

  # ----- Step 3：覆盖所有命令文件（路径引用全变了） -----
  echo ""
  if [ $SAFE_MODE -eq 1 ]; then
    log_info "[3/4] 更新命令文件（--safe 模式：只生成 .new 旁注）"
  else
    log_info "[3/4] 覆盖所有命令文件（改过的会备份为 .bak.$TIMESTAMP）"
  fi

  for cmd_file in "$TEMPLATES_DIR/.claude/commands/"*.md; do
    [ -e "$cmd_file" ] || continue
    name=$(basename "$cmd_file")
    dst=".claude/commands/$name"

    if [ ! -e "$dst" ]; then
      if [ $DRY_RUN -eq 1 ]; then
        log_info "  [dry-run] 新增 $dst"
      else
        cp "$cmd_file" "$dst"
      fi
      ADDED+=("$dst")
    elif cmp -s "$cmd_file" "$dst"; then
      SKIPPED+=("$dst（内容相同）")
    elif [ $SAFE_MODE -eq 1 ]; then
      if [ $DRY_RUN -eq 1 ]; then
        log_info "  [dry-run] 生成 $dst.new"
      else
        cp "$cmd_file" "${dst}.new"
      fi
      NEW_SIDECAR+=("${dst}.new（diff 后手动合并）")
    else
      if [ $DRY_RUN -eq 1 ]; then
        log_info "  [dry-run] 备份 $dst → $dst.bak.$TIMESTAMP，然后覆盖"
      else
        cp "$dst" "${dst}.bak.${TIMESTAMP}"
        cp "$cmd_file" "$dst"
      fi
      BACKED_UP+=("${dst}.bak.${TIMESTAMP}")
      UPDATED+=("$dst")
    fi
  done

  # ----- Step 4：补齐 docs/.harness-metrics/ 子目录 + docs 骨架 -----
  echo ""
  log_info "[4/4] 补齐 docs/ 骨架"

  for sub in baseline consensus design workspace tasks feedback feedback/commands; do
    dir="docs/$sub"
    if [ ! -d "$dir" ]; then
      if [ $DRY_RUN -eq 1 ]; then
        log_info "  [dry-run] 新建 $dir/"
      else
        mkdir -p "$dir"
        touch "$dir/.gitkeep"
      fi
      ADDED+=("$dir/")
    fi
  done

  for sub in impl adversarial run-tasks knowledge-hits snapshots command-feedback; do
    dir="docs/workspace/.harness-metrics/$sub"
    if [ ! -d "$dir" ]; then
      if [ $DRY_RUN -eq 1 ]; then
        log_info "  [dry-run] 新建 $dir/"
      else
        mkdir -p "$dir"
        touch "$dir/.gitkeep"
      fi
      ADDED+=("$dir/")
    fi
  done

  # ----- 汇总 -----
  echo ""
  log_ok "─── 迁移结果（$PROJECT_NAME）───"

  if [ ${#MIGRATED[@]} -gt 0 ]; then
    log_ok "📦 结构迁移（${#MIGRATED[@]}）："
    for f in "${MIGRATED[@]}"; do echo "   $f"; done
  fi
  if [ ${#ADDED[@]} -gt 0 ]; then
    log_ok "✅ 新增（${#ADDED[@]}）："
    for f in "${ADDED[@]}"; do echo "   + $f"; done
  fi
  if [ ${#UPDATED[@]} -gt 0 ]; then
    echo -e "${BLUE}🔁 覆盖（${#UPDATED[@]}）：${NC}"
    for f in "${UPDATED[@]}"; do echo "   ~ $f"; done
  fi
  if [ ${#BACKED_UP[@]} -gt 0 ]; then
    echo -e "${BLUE}💾 备份（${#BACKED_UP[@]}）：${NC}"
    for f in "${BACKED_UP[@]}"; do echo "   · $f"; done
    log_info "   回滚单个文件：mv <file>.bak.$TIMESTAMP <file>"
    log_info "   批量清理备份：find .claude/commands -name '*.bak.*' -delete"
  fi
  if [ ${#NEW_SIDECAR[@]} -gt 0 ]; then
    log_warn "⚠  待合并（${#NEW_SIDECAR[@]}）："
    for f in "${NEW_SIDECAR[@]}"; do echo "   ? $f"; done
    log_warn "   对比后执行：mv <file>.new <file>"
  fi
  if [ ${#SKIPPED[@]} -gt 0 ]; then
    log_info "保留未动：${#SKIPPED[@]} 项（CLAUDE.md / 用户 knowledge / .mcp.json 等不会被触碰）"
  fi

  if [ $DRY_RUN -eq 0 ]; then
    log_info "建议：git status 检查，确认无误后："
    log_info "  git add -A && git commit -m \"harness: migrate to flat layout (knowledge/ → .claude/knowledge/)\""
  fi
  return 0
}

# ----- 主逻辑：单项目 vs 批量 -----

if [ $DRY_RUN -eq 1 ]; then
  log_warn "🔍 dry-run 模式：只预览，不会实际修改任何文件"
  echo ""
fi
if [ $SAFE_MODE -eq 1 ]; then
  log_warn "🛡  --safe 模式：覆盖命令文件时只生成 .new 旁注"
  echo ""
fi

if [ $ALL_MODE -eq 1 ]; then
  # 批量模式
  HARNESS_YAML="$HOME/.claude/harness-projects.yaml"
  if [ ! -f "$HARNESS_YAML" ]; then
    log_err "✗ 没找到注册表 $HARNESS_YAML"
    log_info "  先在每个项目跑过一次 setup.sh / upgrade.sh 让项目注册进来，再用 --all"
    exit 1
  fi

  log_info "扫描注册表：$HARNESS_YAML"
  [ -n "$ONLY_NAME" ] && log_info "过滤：只处理 $ONLY_NAME"
  echo ""

  # 简易 YAML 解析（不依赖 yq，读 name + path 对）
  CUR_NAME=""
  CUR_PATH=""
  TOTAL=0
  OK=0
  FAIL=0
  while IFS= read -r line; do
    if [[ "$line" =~ ^[[:space:]]*-[[:space:]]*name:[[:space:]]*(.+)$ ]]; then
      CUR_NAME="${BASH_REMATCH[1]}"
      CUR_PATH=""
    elif [[ "$line" =~ ^[[:space:]]+path:[[:space:]]*(.+)$ ]]; then
      CUR_PATH="${BASH_REMATCH[1]}"
      if [ -n "$CUR_NAME" ] && [ -n "$CUR_PATH" ]; then
        if [ -n "$ONLY_NAME" ] && [ "$CUR_NAME" != "$ONLY_NAME" ]; then
          CUR_NAME=""; CUR_PATH=""
          continue
        fi
        TOTAL=$((TOTAL+1))
        if [ ! -d "$CUR_PATH" ]; then
          log_warn "⚠  $CUR_NAME：路径 $CUR_PATH 不存在，跳过"
          FAIL=$((FAIL+1))
        else
          if migrate_one "$CUR_PATH" "$CUR_NAME"; then
            OK=$((OK+1))
          else
            FAIL=$((FAIL+1))
          fi
        fi
        CUR_NAME=""; CUR_PATH=""
      fi
    fi
  done < "$HARNESS_YAML"

  echo ""
  log_info "════════════════════════════════════════════════════════"
  log_ok "批量完成：成功 $OK / 失败 $FAIL / 总计 $TOTAL"
  log_info "════════════════════════════════════════════════════════"
else
  # 单项目模式
  CURRENT_DIR=$(pwd)
  migrate_one "$CURRENT_DIR"
fi
