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
3. 显示剩余任务

## 反馈循环：Spec 反推

Step D/E 中发现设计缺口或冲突：
1. 暂停实现
2. 提示：
   > 发现设计缺口：{描述}
   > 建议执行 /spec-feedback，由团队决定更新设计还是共识。
3. 等待开发者指示。
