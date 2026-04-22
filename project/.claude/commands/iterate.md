# /iterate

迭代影响分析 + 任务清单生成。

## 参数

- `source`（必填）：需求来源，可以是 TAPD ticket ID / GitHub Issue 编号 / 手动粘贴

## 执行流程

### 1. 加载上下文
- 读取基线：`docs/baseline/`
- 读取项目元数据：`project.yaml`
- 读取当前共识文档：`docs/consensus/`
- 读取 journal 最近 5 条：`docs/workspace/{dev}/journal.md`
- 按需加载 knowledge 文件

### 2. 获取需求

**TAPD 来源**：通过 TAPD MCP 获取需求卡片详情
**GitHub 来源**：通过 GitHub MCP 获取 Issue + 评论
**手动**：等待用户粘贴需求内容

### 3. 影响分析

对照基线分析：
- **模块影响**：涉及哪些模块？
- **API 变更**：新增/修改接口？是否 breaking change？
- **数据模型变更**：是否需要数据库迁移？
- **冲突检测**：新需求 vs 现有设计 vs 已知约束

### 4. 生成 7 项迭代共识

1. **范围** — 本次迭代要做什么
2. **影响** — 涉及的模块和文件
3. **接口变更** — 新增/修改/废弃的 API 清单
4. **数据变更** — 字段增减、迁移脚本
5. **冲突** — 发现的冲突 + 建议处理方向
6. **风险与产品确认** — 编号的待确认问题
7. **基线更新计划** — 本次迭代完成后如何更新基线

保存到 `docs/design/iterate-{sprint}-{date}.md`

### 5. 自动生成任务清单（双视角）

从共识文档提取可执行任务，**同时生成两份文件**：

#### 5.1 `checklist.md`（人类阅读视角）

```markdown
## Sprint {name} 任务清单
配套机器文件：./tasks.yaml（由 /run-tasks 解析执行）

### 后端任务
- [ ] T001 {任务描述}（预计工作量）
  - 验证摘要：{一句话口径，详见 tasks.yaml#T001}
- [ ] T002 {任务描述}

### 前端任务
- [ ] T101 {任务描述}

### 测试任务
- [ ] T201 {任务描述}

### 产品确认
- [ ] Q1 {待确认问题}
- [ ] Q2 {待确认问题}
```

保存到 `docs/tasks/{sprint}/checklist.md`

#### 5.2 `tasks.yaml`（机器执行视角，核心）

每个任务必须附带**可机械执行的验证断言**。断言由 `/run-tasks` 在验证循环中实际执行：

```yaml
sprint: "{sprint-name}"
generated_at: "{YYYY-MM-DD}"
baseline_commit: "{commit-hash}"

tasks:
  - id: T001
    role: backend
    desc: "新增订单状态字段"
    depends_on: []
    verify:
      - kind: cmd
        run: "mvn test -Dtest=OrderServiceTest"
        expect_exit: 0
      - kind: file_contains
        path: "order-domain/.../Order.java"
        text: "private OrderStatus status"
      - kind: http
        method: GET
        url: "http://localhost:8080/api/v1/orders/1"
        expect_status: 200
        expect_jsonpath:
          "$.status": "*"
      - kind: regression
        scope: "order-module"
        expect: all_pass

product_confirmations:
  - id: Q1
    question: "..."
    blocks: [T101]
```

保存到 `docs/tasks/{sprint}/tasks.yaml`

**断言种类**：`cmd` / `file_contains` / `file_matches` / `http` / `sql` / `e2e` / `regression`

**硬约束**：
- 每个任务至少 2 条断言（构建类 + 功能类）
- 涉及接口的任务必须有 `http` 或 `e2e` 断言
- 涉及数据库变更的任务必须有 `sql` 断言
- 必须包含一条 `regression` 断言
- 前端任务必须至少一条 `e2e` 断言（需 Playwright MCP）
- 禁止 `kind: manual` —— 无法机械验证的任务应拆分或移出 checklist

### 6. 人工确认

提示：
> 迭代共识和任务清单已生成，请：
> - 检查影响分析的准确性
> - 检查任务拆分的粒度
> - 同步 PM 确认"产品确认"项
>
> 确认后进入 /design 阶段。
