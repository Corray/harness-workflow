# /run-tasks

按角色批量循环执行 `tasks.yaml` 中的任务，每个任务跑完 `/impl` + 验证断言后 commit，全部跑完统一 review + 集成测试 + push + PR。

## 参数

- `role`（必填）：`backend` / `frontend` / `test`
- `sprint`（可选）：sprint 名，默认取 `docs/tasks/` 下最新目录
- `dev`（可选）：开发者名，默认从 git config 读取
- `--from {N}`：从第 N 个任务开始（跳过已完成的）
- `--only 2,4`：只执行第 2 和第 4 个任务
- `--tasks-file fix-tasks.yaml`：改用指定任务文件（通常是 adversarial-review 产出的 Must-Fix）
- `--parallel N`：**并行 Worker 模式**。同一"波"内最多 N 个独立任务并行跑（基于 `depends_on` 拓扑排序分波），默认 `1`（串行）。每个任务在独立的 `git worktree` 里执行，真正隔离文件系统和 git index。
- `--max-parallel-fail K`：并行模式下，**同一波**内失败任务数超过 K 就停止 dispatch 新任务（默认 `ceil(N/2)`），让正在跑的任务收尾后汇总失败原因
- `--auto-confirm`：并行模式下**默认开启**（无法交互确认每个任务的 Step C），串行模式仍保留每任务确认

## 前提条件

- `docs/tasks/{sprint}/tasks.yaml` 存在（由 `/iterate` 生成）
- `docs/design/{feature}-{role}.md` 存在（由 `/design` 生成）

缺一个报错并给出补救命令。

## Step A：加载上下文

1. 读 `docs/tasks/{sprint}/tasks.yaml`，过滤 `role == {role}` 的任务
2. 读对应的 `checklist.md`，识别已勾选 ✅ 的任务，**默认跳过**
3. 读 `docs/design/{feature}-{role}.md`
4. 按角色加载 knowledge（规则同 `/impl`）
5. 读 `docs/workspace/{dev}/journal.md` 最近 5 条

## Step B：启动前自检 + Git 分支管理

### B.1 并发冲突自检（多 agent 协作保护）

**在动任何分支前**，先跑三条命令，探测是否有另一 agent / 另一 Claude Code 窗口在并行操作此工作区：

```bash
git status --porcelain   # 有非本任务的未提交改动？
git stash list           # 有非本 session 的 stash？
git reflog -n 10         # 最近有无来源的 reset / checkout / stash？
```

**异常信号**（详见 `knowledge/collaboration.md`）：

| 检查 | 异常判定 |
|---|---|
| `git status --porcelain` | 有输出，且改动的文件不属于本 sprint 责任范围 |
| `git stash list` | 有陌生 stash message（不是你起过的，与当前任务无关） |
| `git reflog -n 10` | 出现无来源的 `reset: moving to HEAD` / `checkout: moving from ... to ...` |

**任一命中 → 暂停问人**（禁止自作主张 `checkout .` / `reset --hard` / `clean -fd`）：

```
⚠️ 检测到可能有另一 agent 在并行操作此工作区
  · 信号：{具体是哪一条命中}
  · 内容：{陌生 stash / reflog 条目 / 文件列表}

1. Y，启动独立 worktree（推荐，见 knowledge/collaboration.md ④ 档）
2. 已知情，继续（另一 agent 的工作已确认归属）
3. 暂停，我自己先查清（退出 /run-tasks）
```

**`--parallel N>1` 模式**：Worker 在自己的 `.worktrees/{task.id}` 里各自跑这套自检；主 checkout 自检只需确认"没有人手工在主 checkout 里改东西"。

**硬约束（red-lines.md 编号 19）**：遇到陌生 WIP 一律先 `git stash push -m "others-wip-possibly-from-agent-X"` 带标识暂存，禁止 `checkout .` / `clean -fd` / `reset --hard` 直接丢。

### B.2 Git 分支管理

```
当前分支：
  main / master          → 自动创建 feature/{sprint}-{role}，等待确认（Y / 自定义名）
  feature/{sprint}-{role} → 在此分支上继续（中断恢复）
  其他                    → 提示是否正确
```

**未提交改动**（且 B.1 自检判定为"本 session 合法 WIP"）：提示开发者先 commit / `stash push -m "pre-run-tasks-{sprint}"` / 或"继续忽略"。等待确认。

## Step C：展示计划并确认

```
📋 {role} 任务清单（{sprint}/tasks.yaml）
tasks.yaml 是完成标准的唯一事实源。

已完成（{N}）：
  ✅ T001 ...
  ✅ T002 ...

待执行（{M}）：
  ☐ T003 {desc}
     verify: mvn test / file_contains / http GET ...（共 {K} 条断言）
  ☐ T004 ...
  ☐ T005 ...

执行顺序：按 tasks.yaml 的 depends_on 拓扑排序
任一断言失败 → 进入自愈；3 轮修不好 → 暂停

确认开始？（Y / 调整顺序 / 选择特定 ID）
```

等待确认。

## Step D：任务循环（核心）

### D.0 串行 vs 并行的分叉

- `--parallel 1`（默认）：按 `depends_on` 拓扑排序后，**一个一个串行跑**，工作在当前 checkout 上直接进行（今天的默认行为，不变）。
- `--parallel N`（N≥2）：进入**并行 Worker 模式**，见下方 **D.0a 并行调度**。并行模式下每任务跑在独立 `git worktree` 里，完成后回主 checkout 按拓扑序 `ff-only` 合并。

### D.0a 并行调度（只在 `--parallel N>1` 时执行）

**前置动作**：

1. **检测资源**：读 CPU 核数（`nproc` / `sysctl hw.ncpu`），如果 `N > cores * 2` 给出警告并让用户确认。
2. **建 DAG**：按 `tasks.yaml` 的 `depends_on` 拓扑排序，切成若干"波"（wave）。同一波内的任务互相无依赖，可以并行。
3. **准备隔离区**：
   - 确保 `.worktrees/` 在 `.gitignore`（若缺则自动追加并提示 commit 一次）。
   - 清理 `.worktrees/` 下的历史残留（上次中断遗留的目录）。
   - 给开发者 prompt：`"将开启 {N} 个并行 Worker，创建临时 worktree 于 .worktrees/，开始？(Y/N)"`，等待确认。

**执行循环（每一波）**：

```
═════════════════════════
🌊 Wave {i}/{total_waves}：{len} 个独立任务并行
   并发上限：{N}；失败阈值：{K}
═════════════════════════

启动 Worker：
  [Worker-1] T003 → .worktrees/T003/  (feature/{sprint}-{role}/T003)
  [Worker-2] T004 → .worktrees/T004/  (feature/{sprint}-{role}/T004)
  [Worker-3] T007 → .worktrees/T007/  (feature/{sprint}-{role}/T007)
```

每个 Worker 的执行体：

```
cd .worktrees/{task.id}   # 子 shell，互不干扰
执行 D.1（/impl A-E，--auto-confirm 强制开启）
执行 D.2（verify 断言全跑一遍，自愈 ≤3 轮）
执行 D.3（git commit 到 feature/{sprint}-{role}/{task.id}）
write .worktrees/{task.id}/.worker-status.json
```

**实时反馈**（每 10-30 秒刷一次）：

```
🟢 T003 [D.1 侦察 → ETA 4min]
🟢 T004 [D.2 verify 2/4 通过]
🟡 T007 [D.2 自愈第 2 轮]
```

**失败处理**：

- 单 Worker 失败 → 标记 `verdict: failed`，**不影响同波其他独立任务**
- 失败数 ≥ `max-parallel-fail` → 停止 dispatch 新任务，等当前所有 Worker 结束，汇总失败原因后暂停请人
- 下游依赖失败任务的 task → 标记 `verdict: skipped-dep-failed`，不启动 Worker

**一波结束后的合并**（主 checkout 上，拓扑序）：

```
🔀 合并 Wave {i} 的成功任务到 feature/{sprint}-{role}：
  git merge --ff-only feature/{sprint}-{role}/T003  → ✅
  git merge --ff-only feature/{sprint}-{role}/T004  → ✅
  git merge --ff-only feature/{sprint}-{role}/T007  → ⚠️ non-ff（冲突）
     → 进入冲突自愈循环（≤3 轮；仍不行则 stash 到 feature/conflict-T007 并暂停）
git worktree remove .worktrees/T003 T004 T007
```

合并顺序 = 拓扑序 ≠ 完成顺序。下一波 Worker 基于合并后的主分支开新 worktree。

**硬约束（并行模式）**：

1. **`.worktrees/` 必须被 gitignore**，禁止主分支意外包含 worktree 目录
2. **每任务一 branch**：`feature/{sprint}-{role}/{task.id}`，方便 `git branch --list` 排查
3. **拓扑依赖不可跨波**：依赖未完成的任务禁止启动 Worker
4. **资源保护**：N > CPU*2 必须用户显式确认；Wave 内并发上限卡死不能超
5. **冲突仍走自愈**：ff-only 失败时不许直接 `--no-ff` merge，先试 3 轮自愈

### D.1 执行 /impl 的 A-E 步（串行 + 并行通用）

对每个任务，完整跑一遍 `/impl` 的 A→E 步，在自检之后**追加机器断言执行**：

```
═════════════════════════
📌 {i}/{total}：{task.id} {task.desc}
  verify: {task.verify.length} 条断言
  模式：{串行 / 并行 Worker-N / worktree=.worktrees/{task.id}}
═════════════════════════
```

- A 侦察 + journal
- B 实现计划
- C **开发者确认计划**（唯一每任务人工点；`--auto-confirm` 跳过；并行模式默认开）
- D 生成代码
- E 自检（编译 + 红线 + 设计对齐）

### D.2 机械执行 tasks.yaml 的 verify 断言

依次执行每条 `verify`，按 `kind` 分发：

| kind | 执行方式 |
|------|---------|
| `cmd` | 跑 `run`，校验 `expect_exit` |
| `file_contains` | 读 `path`，`grep` `text` |
| `file_matches` | 读 `path`，匹配 `regex` |
| `http` | 启服务（如未起），请求 `method url`，校验状态码和 jsonpath |
| `sql` | 连 `datasource`，执行 `query`，校验 `expect_rows` / `expect_value` |
| `e2e` | 调 Playwright MCP 跑 `script`，校验 `assertions`，带 `screenshot` 附到 commit |
| `regression` | 跑 `scope` 内现有测试 |

```
🧪 T003 verify：
  [cmd] mvn test -Dtest=OrderServiceTest    → ✅ exit 0
  [file_contains] Order.java: "OrderStatus" → ✅ 命中
  [http] GET /api/v1/orders/1               → ✅ 200, $.status 存在
  [regression] order-module                 → ✅ 全通过
```

**任一断言失败 → 进入自愈循环（最多 3 轮）**：
- 分析失败原因 → 修改代码 → 重跑**全部**该任务的 verify
- 3 轮仍失败 → 暂停请人，列出每轮尝试和失败原因

### D.3 任务通过 → commit

```bash
git add {task 涉及文件 + 测试}
git commit -m "{project}: {task.desc} [{task.id}]

变更：
- {文件列表}

verify：
- {断言摘要：N 条全通过 / 自愈 K 轮}
"
```

### D.4 写 journal + 更新 checklist

- 追加 journal 一条（复用 `/impl` Step F 格式，多一行"verify: N 条全通过 / 自愈 K 轮"）
- 勾选 `checklist.md` 对应任务
- 更新 `tasks.yaml` 中该任务的 `status: done`

### D.5 回写 metrics

追加一条到 `docs/workspace/.harness-metrics/impl/{YYYY-MM}.jsonl`：

```jsonl
{"time":"...","developer":"{dev}","task_id":"{task.id}","task_desc":"{task.desc}","task_size":"small","role":"{role}","files_changed":N,"tests_added":M,"heal_cycles":K,"first_pass":{bool},"human_intervention":false,"commit_hash":"{hash}","duration_minutes":X,"knowledge_loaded":[...],"knowledge_updated":[...],"red_lines_triggered":[],"parallel":{N},"wave":{i},"worktree":".worktrees/{task.id}"}
```

并行模式额外写一条到 `docs/workspace/.harness-metrics/run-tasks/parallel-{YYYY-MM}.jsonl`（一波一条）：

```jsonl
{"time":"...","sprint":"{sprint}","role":"{role}","wave":1,"total_waves":3,"dispatched":5,"succeeded":4,"failed":1,"skipped_dep_failed":0,"concurrent_peak":5,"merge_conflicts":0,"duration_minutes":12}
```

### D.6 连续性

下一任务的 Step A 自动读：
- 上一任务刚写的 journal 条目
- 上一任务改的文件列表
- 上一任务新增的测试（纳入下一任务的回归范围）

## Step E：循环结束 — 统一 Review + 集成测试

循环跑完（或开发者停止）后**不询问**直接执行：

### E.1 统一 /review

范围：本次所有改动。关注跨任务契约一致性、DDD 分层、红线、Knowledge 合规。
发现问题 → 自愈循环（≤3 轮）。3 轮修不好 → 暂停。

### E.2 全量集成测试

```bash
# 后端
mvn test

# 前端
npm test

# 前端 E2E（如有 Playwright MCP）
跑 docs/tasks/{sprint}/tasks.yaml 中所有 kind=e2e 的 script
```

失败 → 自愈（≤3 轮）。修复 commit 用 `fix: integration` 前缀。

## Step F：Push + PR

E 全绿后：

```bash
git push origin feature/{sprint}-{role}
```

然后通过 GitHub MCP 创建 PR：

```
标题：{sprint}：{迭代简述}
分支：feature/{sprint}-{role} → main
描述（自动生成）：
## 迭代内容
基于：docs/tasks/{sprint}/iterate-consensus.md

## 任务清单
- ✅ [{hash1}] T001 {desc}
- ✅ [{hash2}] T002 {desc}
- ⚠️  fix: integration（集成测试自愈）

## Verify 摘要
- 断言总数：{N}，全部通过
- 自愈总轮次：{K}

## 回滚
单任务：git revert {hash}
整迭代：git revert {hash1}..{hashN}
```

## Step G：Record Session

自动调用 `/record-session` 精简版：
- journal 总结本次循环
- Knowledge 建议（本循环沉淀的新模式）
- checklist + tasks.yaml 最终状态

追加一条 run-tasks 汇总到 `.harness-metrics/run-tasks/{YYYY-MM}.jsonl`：

```jsonl
{"time":"...","sprint":"{sprint}","role":"{role}","tasks_total":N,"tasks_completed":X,"tasks_skipped":Y,"total_heal_cycles":K,"branch":"feature/...","commits":Z,"duration_minutes":M}
```

## 暂停条件（只有这些才打断人）

| 条件 | 行为 |
|------|------|
| Step C 任务确认 | 询问一次 |
| D.0a 并行开启确认 | 询问一次（首次使用时） |
| D.1 Step C（每任务计划确认） | 询问一次（`--auto-confirm` 跳过；并行模式默认跳） |
| 任一任务自愈 3 轮失败 | 列出每轮尝试，请人决策 |
| 并行波内失败数 ≥ `max-parallel-fail` | 停止 dispatch，汇总失败暂停 |
| worktree 合并 `ff-only` 冲突 3 轮修不好 | stash 到 `feature/conflict-{task.id}` + 暂停 |
| 环境连不上（DB / 服务） | 给出具体命令 |
| 需要人工操作（密钥 / 资源） | 给出步骤 |
| 发现是设计问题 | 建议 `/spec-feedback` 或 `/iterate --refresh` |
| E.1 review 3 轮修不好 / E.2 集成 3 轮修不好 | 暂停 |

**其余一切自动，不询问。**

## 硬约束

1. **tasks.yaml 是完成标准的唯一事实源**：断言没过 = 没做完，不许人工勾选绕过
2. **每任务一 commit**：便于 revert，不许合并 commit
3. **feature 分支隔离**：不许在 main 上直接跑
4. **全量回归**：Step E.2 必须跑全量（不只是本次新增）
5. **journal + metrics 必写**：失败任务也要写（标 `verdict: human_intervention`）
6. **断言 kind 未实现就暂停**：不许私自把 `kind` 降级为"手工检查通过"
7. **并行 Worker 专属红线**：
   - `.worktrees/` 必须在 `.gitignore` 中
   - 跨 Wave 的依赖禁止违反（依赖未合并完的任务不许启动 Worker）
   - 合并顺序 = 拓扑序，不许按完成顺序合并（避免下游先 merge 成功导致上游 ff 失败）
   - worktree 清理必须用 `git worktree remove`，禁止 `rm -rf` 直接删目录（会让 git 留下孤立引用）

## 整体流程图

```
/run-tasks {role} [--parallel N]
  │
  ├── A 加载 tasks.yaml + checklist + design + knowledge + journal
  ├── B 分支管理（feature/{sprint}-{role}）
  ├── C 计划展示 → 开发者确认
  │
  ├── D 任务循环
  │     │
  │     ├── 串行（N=1，默认）：for each task
  │     │     ├── /impl A-E + verify + commit
  │     │     └── 下一个任务继承本次上下文
  │     │
  │     └── 并行（N≥2）：for each wave
  │           ├── 同一波任务启动 N 个 Worker（隔离 worktree）
  │           ├── Worker 各自 /impl A-E + verify + commit 到子分支
  │           ├── 失败不影响同波独立任务（超阈值才停 dispatch）
  │           └── 拓扑序 ff-only merge 子分支到 feature → 清理 worktree
  │
  ├── E 统一 review + 全量集成测试（失败自愈 ≤3）
  ├── F git push + 创建 PR（GitHub MCP）
  └── G record-session + metrics 汇总写入
```
