# /sync-consensus

全局命令：从 **consensus-hub** 拉取最新共识文档到当前项目镜像。

本命令用于"指针 + 镜像"双保险模式：
- **指针**：项目 `project.yaml` 记录 hub 仓库地址和目标版本
- **镜像**：本地 `docs/consensus/` 保存只读快照（断网/访问受限时回退）
- **AI 读取顺序**：hub 源（通过 GitHub MCP）→ 本地镜像（fallback）

## 参数

- `project`（必填）：项目名（对应 consensus-hub/projects/{project}/）
- `version`（可选）：要同步的版本号（如 `v1.2`），默认 `latest`
- `hub-repo`（可选）：hub 仓库地址，默认从 `~/.claude/config.yaml` 的 `consensus_hub_repo` 或项目 `project.yaml` 读取

## 执行流程

### 1. 定位 consensus-hub
优先级：
1. 命令参数 `hub-repo`
2. 当前项目 `project.yaml` 的 `consensus.hub_repo`
3. `~/.claude/config.yaml` 的 `consensus_hub_repo`
4. 都没有 → 询问用户，并写入 project.yaml

### 2. 通过 GitHub MCP 读取 hub

- 读取 `projects/{project}/project.meta.yaml` 的 `current_version`
- 如果参数 `version` 为空或 `latest` → 取 `current_version`
- 读取 `projects/{project}/consensus/{ver}/` 下的 9 个文件

### 3. 对比本地镜像

- 检查项目 `docs/consensus/.version` 是否存在
- 如果相同 → 提示"已是最新 ({ver})"，仅更新 `project.yaml.last_synced`
- 如果不同 → 打印差异摘要（文件增删、字段变更条目数）

### 4. 更新本地镜像

**镜像是只读快照**。步骤：
1. 归档当前镜像到 `docs/consensus/archive/{old-ver}/`
2. 写入新版本 9 个文件到 `docs/consensus/`
3. 在每个文件顶部注入只读声明：
   ```
   > ⚠️ 本文件是 consensus-hub 的只读镜像，版本 {ver}，同步时间 {ISO}。
   > 修改请通过 ai-workflow 仓库的 /update-consensus 命令发起 PR。
   ```
4. 写入 `docs/consensus/.version` = `{ver}`
5. 更新 `project.yaml`：
   ```yaml
   consensus:
     hub_repo: ...
     project_path: projects/{project}
     current_version: {ver}
     last_synced: {ISO timestamp}
     mirror: docs/consensus/
   ```

### 5. Git commit 提示

> 共识镜像已更新到 {ver}。
> 建议 git commit 记录本次同步：
> ```
> git commit -m "docs: sync consensus mirror to {ver}"
> ```

## 读取优先级说明（供 AI 自身参考）

在后续的 `/iterate`、`/design`、`/impl` 等命令中读取共识时：

1. **优先**：通过 GitHub MCP 读取 `{hub_repo}` 的 `projects/{project}/consensus/{current_version}/`
2. **回退**：读取本地 `docs/consensus/` + 警告"已使用本地镜像，版本 {ver}，同步时间 {last_synced}"
3. 禁止：直接改镜像文件内容（会被下次 sync 覆盖）

## 相关命令

- `/list-projects` — 列出 hub 管理的所有项目
- 在 ai-workflow 仓库：`/update-consensus` — 生成新版本 PR
