# /record-session

会话结束时的记录。

## 执行流程

### 1. 汇总本次 session
- 执行的所有命令
- 所有文件变更
- 所有决策点（尤其是选择了 A 而非 B 的）
- 未解决的问题

### 2. 追加到 journal

完整记录到 `docs/workspace/{dev}/journal.md`：

```markdown
## Session {YYYY-MM-DD} {HH:MM} — {dev}

### 执行的命令
- /iterate → ...
- /design {feature} → ...
- /impl {feature} → ...
- /review {feature} → ...

### 完成的工作
{综合描述}

### 文件变更汇总
- `{path}` — {说明}

### 决策记录
- {决策点} → 选择了 {选项}，因为 {理由}

### 发现的问题
- {问题} → {处理或遗留}

### 遗留事项（下次继续）
- [ ] {item}
```

### 3. Knowledge 自迭代

回顾本次 session，寻找可沉淀的知识：
- 今天发现的框架行为 → .claude/knowledge/backend/framework-specifics.md？
- 今天踩的坑 → .claude/knowledge/backend/common-pitfalls.md？
- 今天用的模式 → .claude/knowledge/backend/architecture.md？

对每个建议：
> 建议更新 .claude/knowledge/backend/sxp-framework.md：
> 新增："@Order(97) 的执行顺序需要注意..."
> 原因：本次遇到的问题原因是没有意识到这一点
>
> 是否执行更新？

**一个人的发现变成整个团队的知识。**

### 4. 更新任务清单 + 建议下次起点

- 勾选已完成任务
- 列出剩余任务
- 建议下次 session 的起始点：
  > 建议下次从 T015（{任务名}）开始，
  > 因为依赖 T012 已完成，而 T014 还在等产品确认。
