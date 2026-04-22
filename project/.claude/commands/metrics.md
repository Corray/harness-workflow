# /metrics — Harness 运行指标聚合

把"AI 在我们仓库干得怎么样"从感觉变成数字。没有度量就没有改进。

## 用法

```
/metrics                          # 过去 30 天全员汇总（默认）
/metrics --days 7                 # 过去 7 天
/metrics --since 2026-03-01       # 指定起始
/metrics --developer alice        # 单个开发者
/metrics --sprint 2026-04-xxx     # 单个 sprint
/metrics --format csv|json        # 导出格式（默认 markdown）
/metrics --compare "30d vs prev"  # 环比
```

## 数据来源

```
docs/workspace/
├── {dev}/journal.md                 # fallback 解析
└── .harness-metrics/                # 结构化事件流（优先）
    ├── impl/            YYYY-MM.jsonl
    ├── adversarial/     YYYY-MM.jsonl
    ├── run-tasks/       YYYY-MM.jsonl
    └── knowledge-hits/  YYYY-MM.jsonl
```

## 事件 schema

### impl 事件（每次 /impl 完成）

```jsonl
{"time":"...","developer":"alice","task_desc":"...","task_size":"small","role":"backend","files_changed":3,"tests_added":2,"heal_cycles":1,"first_pass":false,"human_intervention":false,"intervention_reason":null,"commit_hash":"abc1234","duration_minutes":12,"knowledge_loaded":["backend/api-conventions.md"],"knowledge_updated":[],"red_lines_triggered":[]}
```

### adversarial 事件

```jsonl
{"time":"...","sprint":"...","score":78,"dim_a":24,"dim_b":20,"dim_c":22,"dim_d":12,"assertions_total":7,"assertions_failed":1,"must_fix":2,"verdict":"approve-with-fix"}
```

### run-tasks 事件

```jsonl
{"time":"...","sprint":"...","role":"backend","tasks_total":5,"tasks_completed":5,"total_heal_cycles":3,"branch":"...","duration_minutes":47}
```

### knowledge-hits 事件

```jsonl
{"time":"...","command":"/impl","file":"backend/api-conventions.md","bytes_loaded":2450}
```

## 执行流程

1. 解析时间窗口 / 过滤器
2. 优先读 `.harness-metrics/*/*.jsonl`；不足部分 fallback 解析 journal.md（容错，缺数据标 null）
3. 计算五类指标（见下）
4. 输出 markdown 报告
5. 存档到 `.harness-metrics/snapshots/{YYYY-MM-DD}.md`

## 五类指标

### 吞吐量

- 完成任务数、commit 数、文件变更、新增测试、人均任务/周

### 质量（带健康区间）

| 指标 | 健康区间 |
|------|---------|
| 首次通过率 | >60% |
| 平均自愈轮次 | <1.2 |
| 自愈 3 轮失败率 | <5% |
| 人工介入率 | <15% |
| Evaluator 平均分 | >80 |
| Evaluator 否决率 | <5% |

### Knowledge 有效性

- TOP 10 最常命中的 knowledge
- 零命中 knowledge（建议删除或重写）
- adversarial 报告中重复出现的扣分理由（→ 建议沉淀为新 knowledge）

### 红线

- 触发 TOP 5 + 周环比变化

### 分布

- 任务 size（small / large）
- 按角色（backend / frontend / test）
- 自愈轮次直方图
- 人工介入原因分布

## 报告样板

```markdown
# Harness Metrics 报告
窗口：2026-03-23 ~ 2026-04-22（30 天） / 3 人 / 2 sprint

## 吞吐量
| 指标 | 数值 | 环比 |
| 完成任务 | 127 | ↑ 18% |
...

## 质量
| 指标 | 本期 | 上期 | 健康区间 | 状态 |
| 首次通过率 | 67% | 61% | >60% | ✅ |
...

## Knowledge 有效性
🏆 TOP 10 命中：red-lines.md(127) / api-conventions.md(45) / ...
🚮 零命中（建议删除）：frontend/taro-patterns.md（30 天 0 命中）
🔁 重复痛点：OrderService 并发（4 次被 adversarial 指出）

## 红线触发 TOP 5
| 红线 | 次数 | vs 上期 |
...

## 本期建议
1. 🔴 删除零命中 knowledge：taro-patterns.md
2. 🟡 沉淀重复痛点：OrderService 并发 → concurrency-patterns.md
3. 🟡 核对 tenant_id 红线执行（上升 3 次）
```

## 硬约束

1. **只读**：仅生成报告，不改代码
2. **数据不足不伪造**：缺数据标注"数据不足"，禁止估算填充
3. **只给数据不下诊断**：列现象 + 可能解读，判断交给 Harness Engineer
4. journal 解析容错，坏数据不中断整报告
5. 没有 knowledge-hits 数据时，标注"建议在新版命令中启用事件写入"后继续输出其他部分

## 实现注意事项

- 需要 `/impl`、`/review`、`/design` 等命令在加载 knowledge 时主动写 `knowledge-hits/` 事件
- 旧 journal.md 没有完整字段时，按最佳努力解析（如从"自愈 N 轮"文本提取 heal_cycles）
- adversarial 部分依赖 `/adversarial-review` 已启用；未启用则该 section 标注"未启用"
