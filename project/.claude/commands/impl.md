# /impl

8 步编码实现流程，每一步都不可跳过。

## 参数

- `feature`（必填）：要实现的功能名或设计文档路径
- `role`（必填）：`backend` 或 `frontend`
- `dev`（可选）：开发者名称，默认从 git config 读取

## Step A：侦察 + 加载 journal

### 按角色加载 knowledge

**role = backend**：
```
knowledge/backend/architecture.md
knowledge/backend/api-conventions.md
knowledge/backend/database-patterns.md
knowledge/backend/framework-specifics.md
knowledge/backend/common-pitfalls.md
knowledge/red-lines.md
```

**role = frontend**：
```
knowledge/frontend/architecture.md
knowledge/frontend/component-library.md
knowledge/frontend/api-integration.md
knowledge/frontend/common-pitfalls.md
knowledge/red-lines.md
```

### 记录 knowledge-hits 事件

**每加载一个 knowledge 文件追加一条**到 `docs/workspace/.harness-metrics/knowledge-hits/{YYYY-MM}.jsonl`（供 `/metrics` 统计 Top / 零命中）：

```jsonl
{"time":"2026-04-22T15:30:00Z","command":"/impl","file":"backend/api-conventions.md","bytes_loaded":2450}
```

### 加载设计文档
`docs/design/{feature}-{role}.md`

### 读取 Journal
`docs/workspace/{dev}/journal.md` 的最近 5 条记录。

提取：
- 上次未完成的事项 → 本次是否需要覆盖
- 已知的问题和临时方案 → 本次是否需要处理
- 待确认的决策 → 提醒开发者

### 扫描相关代码
扫描即将修改的模块目录，了解现有代码组织。

**输出**：汇总侦察结果和注意事项。

## Step B：生成实现计划

结构化计划包括：
1. 要创建的文件（路径 + 职责）
2. 要修改的文件（路径 + 修改摘要）
3. 执行顺序（考虑依赖）
4. 风险点和应对方案
5. Journal 遗留项覆盖说明

## Step C：开发者确认计划

提示：
> 以上是实现计划，请确认：
> - 确认 → 我将按计划执行
> - 调整 → 请告知需要修改的部分

**未确认不开始编码。**

## Step D：生成代码

- 遵循已加载的 knowledge 约定
- 使用框架既有工具类，不重复造轮子
- 发现设计歧义或遗漏 → **暂停并询问**，不自行假设

## Step E：自检（不可跳过）

### 编译检查
运行编译命令，确认无错误。

### 红线扫描
逐条对照 `knowledge/red-lines.md`：
- [ ] 无魔法值？
- [ ] 无吞异常？
- [ ] API 路径与契约一致？
- [ ] 数据库字段 snake_case？（后端）
- [ ] 业务逻辑不在 Controller？（后端）
- [ ] 使用指定组件库？（前端）
- [ ] API 调用通过封装模块？（前端）

### 设计对齐
对比 `docs/design/{feature}-{role}.md`，检查实现是否遗漏。

### 自检报告

```
✅ 编译通过
✅ 红线扫描：7/7 通过
⚠️ 设计对齐：1 个差异 — {描述}
```

有问题先自修，修复后再次自检。

## Step F：写 Journal

追加到 `docs/workspace/{dev}/journal.md`：

```markdown
## {YYYY-MM-DD} {HH:MM} — {dev}

### 完成
- {描述}

### 文件变更
- `{path}` — {说明}

### 发现的问题
- {问题} → {处理}

### 遗留事项
- [ ] {未完成}

### Knowledge 建议
- {文件} ← {建议}
```

## Step G：建议 Knowledge 更新

回顾是否发现 knowledge 未记录的模式或踩坑点：
- 框架隐藏行为？
- 业务逻辑特殊约束？
- 编码模式最佳实践？

有的话提出建议：
> 建议更新 knowledge/backend/framework-specifics.md：
> 新增："{内容}"
> 原因：{价值}
>
> 是否执行更新？

**开发者确认后才执行。**

## Step H：更新任务清单

1. 读取 `docs/tasks/{sprint}/checklist.md`
2. 勾选已完成任务
3. 如 `tasks.yaml` 存在且本次对应某个 task id → 把该 task 的 `status` 字段标为 `done`
4. 显示剩余任务

## Step I：补写 ad-hoc tasks.yaml（不可跳过）

**触发条件**：当前 feature 对应的 `docs/tasks/{sprint}/tasks.yaml` **不存在**时触发；存在时跳过本步。

**目的**：为后续 `/adversarial-review` 提供客观判据。`/adversarial-review` 的 Step 3 "机械执行 tasks.yaml 的 verify 断言" 是防 *premature closure* 的强约束，没有 tasks.yaml 这一步就失效。/iterate 绕过时不能豁免客观判据。

**写入位置**：`docs/tasks/ad-hoc/{YYYY-MM-DD}-{slug}/tasks.yaml`

- `{slug}` 规则：feature 名称转小写短横线，截 40 字符；拿不到就用 `IMPL-{HHmmss}`
- 同一天同一 slug 已存在时，追加 `-2` / `-3` 后缀

**内容模板**：

```yaml
# 由 /impl 自动生成（ad-hoc 路径）
# 目的：为 /adversarial-review 提供 verify 断言
sprint: ad-hoc
source: /impl
generated_at: 2026-04-22T15:30:00Z
role: backend          # backend | frontend
branch: {当前分支名}
commit: {short-hash}

tasks:
  - id: IMPL-{YYYYMMDD-HHmmss}
    desc: "{feature 简述}"
    status: done
    files_changed:
      - {file 1 from git diff --name-only HEAD~1..HEAD}
      - {file 2}
    verify:
      # 必填：Step E 已跑过且通过的测试命令
      - type: cmd
        cmd: "{例如 mvn test -Dtest=XxxTest}"
      # 必填：本次新增/关键修改的代码标识
      - type: file_contains
        file: "{主要改动文件路径}"
        pattern: "{关键标识：新方法签名 / 新字段 / 新路由}"
```

**填写规则**：
- `verify.cmd` **必须**是 Step E 已经绿过的命令，不要写"未来应该跑"的占位符
- `verify.file_contains.pattern` 要选**本次新增或关键修改**的标识，不要选原来就有的行
- 至少 1 条 `cmd` + 1 条 `file_contains`
- 宁可少一条也不许假数据

**后续提示**：

```
🧪 本次若需对抗评估，执行：
  【新开 session】/adversarial-review --sprint ad-hoc/{YYYY-MM-DD}-{slug}
                  或
  【新开 session】/adversarial-review --branch {当前分支}
```

## Step J：回写 metrics 事件（不可跳过）

追加一条 impl 事件到 `docs/workspace/.harness-metrics/impl/{YYYY-MM}.jsonl`（按月滚动），供 `/metrics` 聚合：

```jsonl
{"time":"2026-04-22T15:30:00Z","developer":"{dev}","task_desc":"{feature 简述}","task_size":"small","role":"{backend|frontend}","files_changed":3,"tests_added":2,"heal_cycles":1,"first_pass":false,"human_intervention":false,"intervention_reason":null,"commit_hash":"{short-hash}","duration_minutes":12,"knowledge_loaded":["backend/api-conventions.md","red-lines.md"],"knowledge_updated":["backend/framework-specifics.md"],"red_lines_triggered":[],"tasks_yaml_path":"docs/tasks/ad-hoc/2026-04-22-fix-pagination/tasks.yaml"}
```

字段说明：
- `heal_cycles`：Step E 自检+自修的轮次
- `first_pass`：`heal_cycles == 0 && 无人工介入`
- `human_intervention`：Step D/E 是否因设计缺口或失败暂停过
- `intervention_reason`：暂停原因，取 `3_rounds_failed` / `env_issue` / `manual_op` / `spec_issue` / `large_task`；否则 `null`
- `knowledge_loaded`：Step A 实际读取的 knowledge 文件
- `knowledge_updated`：Step G 本次追加/修改的 knowledge
- `red_lines_triggered`：Step E 红线扫描命中并自修的条目
- `tasks_yaml_path`：sprint 已有 tasks.yaml 时指向该路径；否则指向 Step I 刚写的 ad-hoc tasks.yaml 路径。**必填**，`/adversarial-review` 和 `/dashboard` 靠该字段定位断言源。

**硬约束**：即使本次因失败或人工介入提前终止，也必须写一条 impl 事件（`human_intervention: true`，字段据实填写）。`/metrics` 的"人工介入率"、"自愈 3 轮失败率"靠这部分数据。

## 反馈循环：Spec 反推

Step D/E 中发现设计缺口或冲突：
1. 暂停实现
2. 提示：
   > 发现设计缺口：{描述}
   > 建议执行 /spec-feedback，由团队决定更新设计还是共识。
3. 等待开发者指示。
