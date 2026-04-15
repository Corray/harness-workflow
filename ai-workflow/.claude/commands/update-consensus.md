# /update-consensus

基于 GitHub Issue 更新 consensus-hub 中的共识文档，发起新版本 PR。

## 参数

- `project`（必填）：项目名称
- `hub-repo`（可选）：consensus-hub 仓库地址，默认从全局配置读取
- `issue-repo`（可选）：Issue 来源仓库，默认用项目的业务代码仓库

## 执行流程

### 1. 加载上下文
- 定位 consensus-hub（参数 > 全局配置 > 询问）
- 通过 GitHub MCP 读取 hub 中：
  - `projects/{project}/consensus/latest/` 下的 9 个共识文件
  - `projects/{project}/project.meta.yaml`（含 owners 和 current_version）
  - `projects/{project}/CHANGELOG.md`
- 读取 `instructions.md` 和 `knowledge/red-lines.md`

### 2. 读取 GitHub Issue
通过 GitHub MCP 获取所有开放的 Issue 及评论。只看**标记为共识相关**（label: `consensus` 或 issue body 包含 `#consensus`）的。

### 3. 生成 Change Log

分类每个 Issue：
- **影响类**：
  - API 契约变更 → 影响 `05-api-contract.md`
  - 数据模型变更 → 影响 `04-data-model.md`
  - 业务流程变更 → 影响 `02-business-flow.md` / `03-modules.md`
  - 分工边界变更 → 影响 `06-boundaries.md`
- **无影响**：不触发共识更新
- **待决策**：需要产品先确认的

输出格式：
```markdown
## Change Log ({project} → 新版本预估 v{X.Y})

### API 契约变更（影响 05-api-contract.md）
- #12 {标题} → {影响描述}

### 数据模型变更（影响 04-data-model.md）
- #18 {标题} → {影响描述}

### 无影响
- #5 {标题}

### 待决策
- #23 {标题} → {需要确认的问题}
```

### 4. 人工确认

提示：
> Change Log 已生成，请项目负责人确认分类准确性。
> - 确认 → 我将生成新版本并发起 PR
> - 有问题 → 请指出需调整的分类

**未经确认不进行合并。**

### 5. 生成新版本

- 询问用户版本类型：major（`v{X+1}.0`）/ minor（`v{X}.{Y+1}`）
- 从 `latest/` 复制 9 个文件到新版本目录 `v{X.Y}/`
- 按分类更新受影响的文件（用自然语言重新表述，不保留 CL 格式痕迹）
- 保持所有语言规范（业务语言、无技术黑话）
- 追加 CHANGELOG.md 条目，关联 Issue 编号
- 更新 `project.meta.yaml` 的 `current_version`
- 更新 `latest` symlink

### 6. 发 PR

- 分支：`consensus/{project}-v{X.Y}`
- PR 标题：`[{project}] consensus update v{X.Y} (closes #12 #18 ...)`
- PR body 使用模板，勾选受影响的文件清单
- 评审人从 `project.meta.yaml` 的 owners 带出

**PR 创建前再次让用户确认分支名和 PR 标题。**

### 7. 告知下游

提示合并后提醒各项目仓库执行 `/sync-consensus project={project}` 更新镜像。
