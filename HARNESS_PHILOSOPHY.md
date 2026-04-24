# Harness Philosophy — 为什么这套 Workflow 长这个样

> 这份文档不是"怎么用"，是"为什么这么设计"。
> 改规则前先看它——你会更容易判断哪些是装饰，哪些是骨架。

---

## 一、Harness Engineering 是什么

2026 年初 Anthropic 在 *Effective harnesses for long-running agents* 里提出一个观点：

> "AI 能力的瓶颈越来越不是模型本身，而是模型外面那层壳——也就是 harness（马具）。"

**Harness 就是你给 AI 套上的那套工作环境**：上下文加载规则、工具清单、执行流程、验证标准、记忆机制。

OpenAI、Martin Fowler、Red Hat 的多篇文章都在 2026 年指向同一个结论：

**同样的模型，harness 做得好 vs 做得差，输出质量可以差一个数量级。**

于是诞生了一个新角色：**Harness Engineer**——不写业务代码，只设计 AI 工作环境。KPI 不是"今天产了多少行代码"，而是"团队的首次通过率、自愈轮次、Evaluator 评分有没有进步"。

本项目就是为了让 Harness Engineering 这件事**在团队里能落地**而设计的——从共识文档、分层 knowledge、结构化命令、跨 session 记忆，到对抗式评估和运行指标。

---

## 二、三条核心信念

所有命令、约束、文件布局，都源自下面三条。

### 信念一：AI 是"有边界的实习生"

一位聪明但入职第三天的实习生：
- 给他**越清楚的规矩和红线**，他干得越好。
- 给他"自由发挥空间"，他会**把半个模块重构掉**。

推论：
- `CLAUDE.md` 要明写"不许做什么"，不是只讲"推荐做什么"。
- `red-lines.md` 是硬约束，不是建议。
- 验证必须**可机械执行**，"看起来没问题"不算通过。
- 完成标准是**客观断言**（tasks.yaml 的 `verify`），不是人的主观判断。

### 信念二：红线（硬约束）不可协商

一个 harness 里最危险的不是 bug，是**漏掉的红线**。
被默许的 `catch (Exception e) {}` 会变成半夜起床查的线上事故；被放行的硬编码魔法值会变成 6 个月后没人敢改的屎山。

推论：
- 红线**必须落到文件**（`red-lines.md`），不是口头文化。
- 红线在 `/impl`、`/review`、`/adversarial-review`、`/preflight` 四道闸口都查。
- 红线违反**直接 Reject**，不进入"扣分讨论"。

### 信念三：个人经验必须流回，变成团队资产

张三踩过的坑，李四三天后不能再踩。否则 AI 再强也救不了这个团队——它不知道你们踩过什么。

推论：
- `journal.md` 是**跨 session** 的个人工作记忆。
- `.claude/knowledge/` 是**跨开发者**的团队记忆。
- Spec 自迭代是强需求：`/impl` 和 `/review` 发现未覆盖知识点必须**主动建议追加**。
- `consensus-hub` 是**跨项目**的共识中心——一个项目长出的好模式，其他项目也能复用。

---

## 三、三个角色的心智模型

Anthropic 的研究把多 agent 系统拆成 **Planner / Generator / Evaluator** 三个角色。本 workflow 的命令都能对应过去：

```
Planner（拆解）               Generator（落实）            Evaluator（挑毛病）
├── /new-consensus            ├── /impl                   ├── /review
├── /iterate                  ├── /run-tasks              ├── /adversarial-review
├── /design                                                └── /preflight
├── /init-baseline                                          
                              
                                （跨角色观测）
                                    ↓
                                /metrics
```

### 为什么 Evaluator 要独立？

因为 AI 对自己的输出有偏爱（self-rating bias）。让同一个 agent 既写又审，审查会流于形式——这是 Anthropic 研究里反复强调的问题。

所以本 workflow 里有**两种 review**，不是升级关系而是搭档：

- `/review`（Generator 自审）：同 context，发现浅层问题，帮开发者过稿
- `/adversarial-review`（独立 Evaluator）：**新 session**、不加载 journal 和实现 knowledge、默认怀疑、**不许满分**

把"这段代码好不好"这件事，从主观感觉变成**结构化过程**。

---

## 四、几个非显然的设计决定

### 为什么共识单独一个仓库（consensus-hub）？

因为**共识要跨角色、跨项目共享**。
- 产品/前端/后端/测试都要看共识，但非开发角色不一定有业务代码仓库的权限
- 多项目可以共用一份共识
- PR 评审 + 版本历史让共识变更可追溯、可回滚
- 项目仓库的 `docs/consensus/` 是**只读镜像**，不允许直接改（会被 `/sync-consensus` 覆盖）

### 为什么要 `tasks.yaml`？checklist.md 不够吗？

checklist.md 是人类视角（打勾、讨论、交接）；
tasks.yaml 是机器视角（`verify` 断言实际跑一遍看 exit code）。

**只有 checklist.md 时，"完成"是主观的**（"我觉得做完了"），正是 Anthropic 研究指出的 *premature closure*。
加了 tasks.yaml 之后，"完成"必须通过 `cmd / file_contains / http / sql / e2e / regression` 一组机械断言——**完成标准从自觉变成合约**。

### 为什么 knowledge 要分层按需加载？

上下文窗口是最稀缺资源。处理后端任务时加载 Taro 小程序规范，**不只是浪费，还会诱导 AI 产生幻觉**（写出"缝合"两端风格的代码）。
所以每个命令按角色只加载自己需要的那部分 knowledge。

### 为什么 `/adversarial-review` 必须新开 session？

context 一旦被 Generator 的思路污染（journal、中间讨论），Evaluator 会**自动继承那些思路**，哪怕 prompt 要求怀疑。
解决办法不是更聪明的 prompt，是**物理隔离**——开新 session，只加载 diff + design + red-lines + tasks.yaml 的 `verify`。

### 为什么要 `/metrics`？

因为"AI 最近变笨了没"是感觉，不是结论。
`/metrics` 回答的是"首次通过率从 61% 升到 67%"、"taro-patterns.md 30 天零命中"、"OrderService 并发被 Evaluator 指出 4 次"——**数字**。
没有数字，就没法决定"这条 knowledge 该不该删"、"这条红线执行得好不好"、"这个 sprint 的 harness 进步了没"。

---

## 五、这套 Workflow **不追求**的事情

知道不该做什么同样重要。

- **不追求"AI 完全自主完成任何任务"**。总会有 5-15% 的任务需要人介入（环境问题、产品决策、设计冲突）。目标是"降低"介入率，不是"消灭"。
- **不追求"命令越多越好"**。每多一个命令都是认知负担。只有在"不固化成命令就会反复出错"时才加。
- **不追求"一套规则适用所有项目"**。DDD 后端和纯前端小程序的红线完全不同。`.claude/knowledge/red-lines.md`、`.claude/knowledge/` 应该在每个项目独立进化。
- **不追求"Evaluator 完美打分"**。Evaluator 只负责"挑出必须修的问题"，不是终审法官。真正的终审永远是线上用户。

---

## 六、演化方向

当前版本覆盖：
- ✅ 共识中心 + 只读镜像
- ✅ 分层 knowledge 按需加载
- ✅ 机器可验证的完成标准（tasks.yaml）
- ✅ 独立 Evaluator（adversarial-review）
- ✅ 跨 session 记忆（journal）
- ✅ 知识沉淀闭环（spec 自迭代 + consensus-hub）
- ✅ 可观测性（metrics、/dashboard）
- ✅ **并行 Worker**（`/run-tasks --parallel N`）——见下方 6.1
- ✅ **Oracle 模式**（`/adversarial-review --oracle`）——见下方 6.2

未来值得探索（未实现）：
- **基于 code-review-graph 的精确回归**：只跑受影响的测试（blast radius）
- **Harness A/B**：同一任务两套 knowledge 对比，用数据优化 knowledge
- **自适应 prompt**：metrics 数据驱动 CLAUDE.md 和 knowledge 文件的版本更新
- **Oracle N>2 推广**：当三个 Evaluator 也有价值时引入 majority-of-3（现阶段 strict-AND 更合适）

### 6.1 并行 Worker 的设计权衡

**为什么用 git worktree 而不是多个 Claude Code session**：worktree 真正隔离文件系统和 git index，多个 Worker `git add/commit` 不会互相踩；同一个 repo 的 `.git/` 共享，节省磁盘；每个 Worker 是子 shell 进程，失败/超时不拖累其他。

**为什么按 `depends_on` 分波**：违反依赖的并发会让上游未完成时下游基于过时代码开工。分波后"同一波内任务互不依赖"这个不变式最简单。扁平 DAG 收益最大，线性依赖的项目几乎退化为串行——这是代价，不是 bug。

**为什么合并用 ff-only**：保持线性历史，方便 `git revert` 单任务精准回滚。ff-only 失败意味着下游 worker 和上游冲突——这本身是设计问题的信号，必须走自愈循环，**不允许 `--no-ff` 盖住**。合并顺序 = 拓扑序（不是完成顺序），最终 commit 序列才有意义。

**并行 Worker 不解决什么**：任务粒度太粗（拆不动就是拆不动，并行放大串行瓶颈）、测试互相污染（共享 DB 的测试并行仍会炸）、影响分析（那是给人看的"动到哪"，并行是给机器调度用的）。

### 6.2 Oracle 模式的 strict-AND

**为什么 strict-AND 而不是 majority / OR**：OR 放大"给过偏好"；majority-of-2 退化为 AND；AND（两个都 Approve 才过）抑制 false-positive，代价是偶尔 false-negative，这对关键路径是**正确的倾向**。

**为什么差异化 Evaluator 人格**：系统提示词相同的两个 Evaluator 会给高度相关的分，本质是同一 Evaluator 跑两遍。差异化（A 偏规范、B 偏反例）让两者的盲区错开，AND 信号才真实。人格差异不是重定义评分，4 维度权重一致，只调"切入点"。

**为什么分差 > 15 只是标 disagreement 而不是自动引入第三方**：第三方会让 strict-AND 退化为 2/3 majority，失去严格性。分差大本身就是信号——**告诉人类"这里值得你亲自看一眼"**。Harness 的价值不是替代人类，是让人类把注意力放在真正需要的地方。

**Oracle 不解决什么**：不能让烂代码变好（两 Evaluator 都漏掉的问题 Oracle 一样漏）、不能补救 tasks.yaml 断言不足（断言缺失的功能维度，评分再准也抓不出来）、不是终审（线上用户才是，Oracle 只是最后一层滤网）。

---

## 七、一句话总结

> **这套 workflow 的核心不是"AI 工具集"，是"让团队经验和质量标准变成可执行代码"。**
>
> AI 是执行引擎，harness 才是规则。规则越清晰，AI 越能干。
> 规则本身可演化——这才是 Harness Engineering 真正的工作。

---

## 参考

- Anthropic, *Effective harnesses for long-running agents*, 2026
- OpenAI, *GAN-style agent loops for code generation*, 2026
- Martin Fowler, *The AI agent workflow we found that works*, 2026-03
- Red Hat Research, *Multi-agent engineering for real codebases*, 2026
- Anthropic, *2026 Trends in Software Development With AI*
