# /adversarial-review — 对抗式评估（独立 Evaluator Agent）

> 这不是 `/review` 的升级版，而是它的**搭档**。
> `/review` 是 Generator 的自审，`/adversarial-review` 是来自另一个 context 的怀疑型审查者。

## 为什么存在

AI 模型对自己的输出有强烈偏爱倾向。让同一个 agent 既写代码又审代码，审查会流于形式——这是 Anthropic 研究明确指出的问题。解决办法是引入**独立的 Evaluator**：
- 不看实现过程（不加载 journal、不加载 /impl 中间日志）
- 只拿 **设计契约 + 代码 diff + 红线**
- 默认立场是怀疑，不是帮忙通过
- 用 Anthropic 四维度（功能性 / 代码质量 / 设计契合度 / 原创性）

## 用法

```
/adversarial-review "{范围描述或 PR/分支}"
```

示例：
```
/adversarial-review --branch feature/2026-04-scene-type-backend
/adversarial-review --commits HEAD~3..HEAD
/adversarial-review --pr 127
```

### 可选参数

- `--oracle`：**Oracle 模式**。开两个独立的 Evaluator（A：严格规范型，B：对抗反例型），双方都 Approve 才算过。详见下方 "Oracle 模式" 章节。
- `--oracle-paths "x/**,y/**"`：只在改动涉及这些路径时触发 Oracle 模式（其他改动用单 Evaluator）。支持 glob。可在 `project.yaml` 的 `oracle_paths:` 字段配置为默认。
- `--evaluator A|B|aggregate`：Oracle 模式的子角色（开发者手动在两个新 session 中分别跑 `--evaluator A` 和 `--evaluator B`，第三个 session 跑 `--evaluator aggregate` 仲裁）
- `--oracle-serial`：在同一 session 内先后扮演 A/B 再仲裁（简化方案，污染风险略高，报告里会标 `serial-emulated`）

## 与 /review 的关键区别

| 维度 | /review | /adversarial-review |
|------|---------|---------------------|
| 加载上下文 | 完整（含 journal、knowledge） | **只有 diff + design + red-lines** |
| 默认立场 | 帮开发者过稿 | 假设有问题，找出来 |
| 可否满分 | 可以 | **不允许**，每维至少 1 项扣分 |
| 触发频率 | 每次 /impl 完成 | PR 创建前 / sprint 结束时 |
| 运行方式 | 同 Agent 继续跑 | **必须新开 session** |

## 执行步骤

### 1. 强制 context 隔离

检测到当前 session 刚跑过 /impl 时，提示用户新开 session：

```
⚠️  当前 session 内刚执行过 /impl。
对抗式评估要求 Evaluator 有独立 context，否则易继承 Generator 偏见。
建议新开 Claude Code 对话后再执行。
```

### 2. 最小化加载

**只加载**：
- `docs/design/` 对应设计文件
- `docs/consensus/` 契约文档
- `docs/tasks/{sprint}/tasks.yaml` 的 verify 断言
- `knowledge/red-lines.md`
- `git diff {range}` 的变更
- 涉及文件的当前内容

**禁止加载**：
- `docs/workspace/*/journal.md`（会泄露实现思路）
- `knowledge/backend/*`、`knowledge/frontend/*`（那是"怎么写"，Evaluator 要的是"该怎么判"）

### 3. 机械执行 tasks.yaml 的 verify 断言

在主观评分前先实际跑一遍断言：

```
🧪 断言执行：
  T001 / mvn test -Dtest=OrderServiceTest    → ✅
  T001 / file_contains: Order.java           → ✅
  T101 / e2e: order-list.spec.ts             → ✗ element not found
```

**任一断言失败 → 直接 Reject**，不进入主观评分。

### 4. 四维度评分（总分 100，每维必须至少 1 项扣分）

- **A. 功能性**（30）—— 边界条件、错误路径、并发、鉴权失败
- **B. 代码质量**（25）—— 红线、重复、命名、死代码
- **C. 设计契合度**（25）—— API 路径/字段严格对齐、分层正确、无超出契约的行为
- **D. 原创性 / 避免捷径**（20，重点盯） —— 是否用 mock/skip/try-catch 掩盖问题，测试是否真的跑了新逻辑

### 5. 输出报告

```markdown
# 对抗式评估报告

**范围**：{branch / commits}
**Evaluator**：独立 context

## 一、断言执行
| 任务 | 断言数 | 通过 | 失败 | 判定 |
|------|-------|------|------|------|

## 二、评分
| 维度 | 满分 | 得分 | 关键扣分项 |
|------|-----|-----|----------|
| A 功能性 | 30 | {n} | ... |
| B 代码质量 | 25 | {n} | ... |
| C 设计契合度 | 25 | {n} | ... |
| D 原创性 | 20 | {n} | ... |
| **总计** | **100** | **{n}** | |

## 三、Must-Fix（阻断合并）
1. [A] 位置：xxx，问题：xxx，建议：xxx

## 四、Should-Fix（不阻断，下次迭代前处理）
1. [D] ...

## 五、判定
- [ ] ✅ Approve（≥90 分且无 Must-Fix）
- [ ] ⚠️ Approve with Must-Fix（≥70 分，修完自动过）
- [ ] ✗ Reject（<70 分 / 有断言失败 / 有红线违反）

## 六、可沉淀为 knowledge 的模式
- ...
```

### 6. 判定后续动作

**Approve** → 通过通知。

**Approve with Must-Fix** → 自动生成 `fix-tasks.yaml` 附加到 sprint 目录，每个 Must-Fix 对应一个带 verify 断言的修复任务：

```
📋 已生成 fix-tasks.yaml（{N} 个任务）
下一步：/run-tasks {role} --tasks-file fix-tasks.yaml
```

**Reject** → 不生成修复任务，需人工决策，可能需回到 /design。

### 7. 回写 metrics

追加到 `docs/workspace/.harness-metrics/adversarial/{YYYY-MM}.jsonl`：

**单 Evaluator（默认）：**
```jsonl
{"time":"...","sprint":"...","score":78,"must_fix":2,"should_fix":2,"verdict":"approve-with-fix","oracle":false,"evaluator":"solo"}
```

**Oracle 模式（参见下方）：**
```jsonl
{"time":"...","sprint":"...","oracle":true,"evaluator":"A","score":78,"verdict":"approve-with-fix","peer":"B","peer_score":71,"agreement_delta":7,"disagreement":false}
{"time":"...","sprint":"...","oracle":true,"evaluator":"B","score":71,"verdict":"reject","peer":"A","peer_score":78,"agreement_delta":7,"disagreement":true}
{"time":"...","sprint":"...","oracle":true,"evaluator":"aggregate","final_verdict":"reject","rule":"strict-AND","must_fix_union":4,"a_score":78,"b_score":71,"disagreement":true}
```

供 /metrics 和 /dashboard 聚合使用。

---

## Oracle 模式（`--oracle`）

### 为什么需要 Oracle

单 Evaluator 也有偏见和盲区：
- 遇到陌生框架/业务领域时，它会倾向于"看起来对就过"
- 对"避免捷径（D 维度）"的识别尤其吃经验——mock 是必要的还是偷懒？它有时分不清
- 模型的内在偏好在每次调用里有随机性，同样的 diff 跑两次可能分差 10+ 分

Oracle 模式通过**两个视角互相独立的 Evaluator**收敛到更高可信度：
- **Evaluator-A（严格规范型）**：重点盯契约对齐（C）、代码质量（B），偏"符合规范"
- **Evaluator-B（对抗反例型）**：重点盯原创性/捷径（D）、边界条件（A），偏"找反例、找绕过"
- 两人都跑满 4 维度打分，但 **权重微偏**，视角错开
- **strict AND 仲裁**：都 Approve 才算过；任一 Reject 即 Reject；分差 > 15 标为 `disagreement`，提示人工过目

这是业界 dual-critic 模式的最小可用实现。它**不是为了增加通过率**，而是为了让关键模块被**更严格地盯**。

### 何时开 Oracle

**强烈推荐**：
- 支付、结算、鉴权、用户资产等**关键路径**
- 安全敏感的模块（密钥、加密、外部 API 对接）
- 不可回滚的 schema 迁移、数据清洗脚本

**不推荐**（单 Evaluator 已足够）：
- 日常 CRUD 迭代
- 前端样式微调、文案改动
- 仅 test 文件的改动（除非改到了测试框架本身）

配置方式（择一）：
1. **显式 flag**：`/adversarial-review --oracle ...`
2. **按路径自动触发**：`/adversarial-review --oracle-paths "order-domain/**,payment/**" ...`
3. **全局配置**：在 `project.yaml` 加入
   ```yaml
   oracle_paths:
     - order-domain/**
     - payment/**
     - auth/**
   ```
   当改动 diff 涉及任一路径时，自动升级为 Oracle 模式，无需加 flag。

### Oracle 执行流程

**推荐方式：三个新 session**（最严格的 context 隔离）：

```
session-1（Evaluator-A）→ /adversarial-review --oracle --evaluator A --branch {...}
session-2（Evaluator-B）→ /adversarial-review --oracle --evaluator B --branch {...}
session-3（Aggregator） → /adversarial-review --oracle --evaluator aggregate --branch {...}
```

三个 session 必须是独立对话（不能复用同一 context），否则 Oracle 退化为"换了个马甲还是同一个 Evaluator"。

**简化方式：单 session + `--oracle-serial`**（适合紧急场景）：

```
/adversarial-review --oracle --oracle-serial --branch {...}
```

Agent 在同一 session 内：
1. 扮演 Evaluator-A，跑完 Step 2-5，把报告存到 `docs/workspace/.harness-metrics/adversarial/oracle/{sprint}-A.json`
2. **强制清空内部短期记忆**（重新加载 Step 2 的最小化上下文，不带任何 A 的结论）
3. 扮演 Evaluator-B，跑完 Step 2-5，存到 `.../oracle/{sprint}-B.json`
4. 以 Aggregator 身份读两份报告，按仲裁规则出最终结论

⚠️ `--oracle-serial` 在 Aggregate 报告顶部会标注 "serial-emulated; context isolation weaker than three-session mode"，可信度略低，不建议用于真正的关键路径。

### Evaluator 人格差异化

两个 Evaluator 共用 4 维度评分（A/B/C/D，总分 100），但**视角提示**不同：

**Evaluator-A 提示词（追加到系统指令）**：
```
你是一名合规严格的代码 Evaluator。你的重点是：
1. API 路径、参数、返回字段是否**逐字**符合设计契约
2. 代码是否遵循红线和 knowledge 中的架构规范
3. 命名、分层、重复代码是否值得挑出
4. 功能性上重点关注"功能是否完整覆盖 desc"

扣分倾向：C 维度（设计契合度）和 B 维度（代码质量）更严格——看到不一致或规范问题，直接扣，不给"大致对"留空间。
```

**Evaluator-B 提示词（追加到系统指令）**：
```
你是一名怀疑一切的对抗型 Evaluator。你的重点是：
1. 这段代码"看起来过了"是不是因为用 mock/skip/try-catch 偷懒？
2. 测试里删掉某条 mock 还能通过吗？
3. 所有 if 分支、边界条件都被真实验证过吗？（null、溢出、并发、鉴权失败）
4. 有没有"为测试通过而写"的特殊分支？

扣分倾向：D 维度（原创性/避免捷径）和 A 维度（边界条件）更严格——只要嗅到"走捷径"的气味，就往狠里扣。
```

两人**不得互相看到对方的报告**；在 Aggregate 之前他们的输出只落盘，不在 prompt 里互相引用。

### 仲裁规则（strict AND）

Aggregator 读 A 和 B 的报告后：

| A 判定 | B 判定 | 最终判定 | Must-Fix |
|-------|-------|---------|---------|
| Approve | Approve | ✅ Approve | 无 |
| Approve-with-Fix | Approve | ⚠️ Approve-with-Fix | = A.must_fix |
| Approve | Approve-with-Fix | ⚠️ Approve-with-Fix | = B.must_fix |
| Approve-with-Fix | Approve-with-Fix | ⚠️ Approve-with-Fix | A.must_fix **∪** B.must_fix（去重） |
| Approve* | Reject | ✗ Reject | = B.must_fix + should_fix |
| Reject | Approve* | ✗ Reject | = A.must_fix + should_fix |
| Reject | Reject | ✗ Reject | 并集 |

附加规则：
- **分差 > 15**（`|a_score - b_score| > 15`）→ 标 `disagreement: true`，在 `/dashboard` 的"对抗评估"页用红色徽章高亮，提示人工过目
- **维度分差 > 10**（任一 A/B/C/D 维度，两 Evaluator 分差超过 10）→ 在 Aggregate 报告的"分歧详情"中列出，帮人类定位到底是哪个角度意见不一
- **人类可手动 `--arbiter-approve`** 覆盖严格 AND 的 Reject 判定，但必须留下 override 记录（写入 metrics 的 `override_by` 和 `override_reason`），且 /dashboard 会永久标橙色

### Aggregate 报告模板

```markdown
# 对抗式评估报告（Oracle 模式）

**范围**：{branch / commits}
**仲裁规则**：strict-AND（都 Approve 才过）
**执行方式**：{three-session | serial-emulated}

## 一、两个 Evaluator 的独立结论

| Evaluator | 总分 | 判定 | Must-Fix | Should-Fix |
|-----------|-----|------|---------|-----------|
| A（严格规范型） | 78 | Approve-with-Fix | 2 | 2 |
| B（对抗反例型） | 71 | Reject | 4 | 1 |

分差：|78-71| = 7 → 一致性：**较好**（≤15）
维度分差：
  - A 维度（功能性）：A 24 / B 18 → 分歧 6
  - D 维度（原创性）：A 14 / B 8  → 分歧 6（B 发现了更多捷径）

## 二、最终判定

✗ **Reject**（strict-AND 触发；B 给出 Reject）

## 三、合并 Must-Fix 清单（A ∪ B，去重）

1. [A.1] [C] API 返回字段名与设计契约不一致 → ... ← 来自 Evaluator-A
2. [B.1] [D] OrderServiceTest 中 3 个 mock 删除后测试即崩 ← 来自 Evaluator-B
3. [B.2] [D] 并发场景无乐观锁，但 test 用单线程 mock 绕过 ← 来自 Evaluator-B
   ...

## 四、分歧详情（给人类 reviewer 看的）

- A 认为 OrderService.updateStatus 的原创性 OK（14/20），B 给 8/20
  - B 的依据："updateStatus 的测试覆盖 100% 但所有测试都 mock 了 Repository，没有真实 SQL 行为"
  - 建议人工快速过目：如果确实只是单元测试覆盖范围，B 对；如果有另一个 IT 测试 cover 真实行为，A 对

## 五、可沉淀的 knowledge

- 本次 B 发现"通过 mock 绕开并发验证"的模式被 A 漏了 → 建议在 `knowledge/testing/standards.md` 里加"Repository 层禁止 Mock"一条

## 六、metrics

已写入 `docs/workspace/.harness-metrics/adversarial/{YYYY-MM}.jsonl`：
- 2 条 evaluator 记录（A、B）
- 1 条 aggregate 记录
```

### Oracle 模式硬约束

1. **三 session 是推荐，`--oracle-serial` 是妥协**：关键路径强制要求三 session
2. **A/B 的报告在 Aggregate 前不得互相引用**：破坏这一条 Oracle 就退化为 Echo Chamber
3. **strict-AND 不得偷偷松成 OR**：任一 Reject 即 Reject，除非人类 `--arbiter-approve` 并记录理由
4. **分差 > 15 必须标 disagreement**，不允许"它俩分差大但我觉得 A 对所以算 A"的主观仲裁
5. **Aggregator 不得重跑断言**：断言是 Evaluator 各自跑过的，Aggregator 只做仲裁，不做重复评判（否则它就变成第三个 Evaluator，违背 strict-AND 的本意）

## 硬约束

1. 禁止加载 journal / 实现 knowledge
2. 禁止满分
3. 断言失败直接 Reject
4. 红线违反直接 Reject
5. 同一 Generator context 不得同时承担 Evaluator
6. **Oracle 模式下，两个 Evaluator 必须独立（三 session 推荐，serial 模式有限适用）**
7. **Oracle 仲裁用 strict-AND，不得松为 majority / OR**
