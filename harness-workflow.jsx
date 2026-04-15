import { useState } from "react";

const i18n = {
  en: {
    modules: {
      ctx: "Context Engineering",
      tool: "Execution & Orchestration",
      verify: "Constraints & Verification",
      state: "State Persistence",
      observe: "Observability",
      human: "Human-in-the-loop",
    },
    moduleDesc: {
      ctx: "Build the right information environment for Agent — layered knowledge loaded on-demand, journal for cross-session memory",
      tool: "Execution environment (file system, sandbox, MCP) + structured task orchestration (step sequence, tool dispatch)",
      verify: "Feedforward constraints (linter, structural tests) + feedback verification (self-check, eval). Enforce, not suggest.",
      state: "Persist task progress, decisions, and artifacts across sessions — journal, task checklist, baseline snapshots",
      observe: "Logs, traces, version history — when things go wrong, trace back to which context, which rule, which decision",
      human: "Human confirms at critical gates (destructive actions, spec changes, quality decisions). Steering, not micromanaging.",
    },
    collapseAll: "Collapse all",
    expandAll: "Expand all",
    footer: "P5 loops back to P1 — every project improves the rules for the next",
    showDesc: "Module definitions",
    hideDesc: "Hide",
    phases: [
      {
        num: "P1", title: "Consensus document generation", env: "ai-workflow · Designated developer",
        summary: "PRD → 9-item consensus doc → review → baseline. Includes eval & evolution cycle for continuous rule improvement.",
        flows: [
          { name: "Flow A — /new-consensus", steps: [
            { tags: ["ctx"], title: "Load full control chain", desc: "CLAUDE.md + commands/new-consensus.md + instructions.md + knowledge/*.md + project.yaml → assume Architect role", dot: "purple" },
            { tags: ["tool"], title: "Validate params & prepare project dir", desc: "Check required params per mode (1/2/3), ask if missing\nCreate projects/{name}/ + project.yaml", dot: "emerald" },
            { tags: ["tool"], title: "Acquire source materials (branch by mode)", desc: "Mode 1: PRD + Figma MCP → cross-validate\nMode 2: PRD + Lanhu MCP → cross-validate\nMode 3: GitHub MCP → doc repo + code repo → integrate", dot: "emerald" },
            { tags: ["tool"], title: "Generate 9-item consensus doc (strict sequence)", desc: "1. Source completeness → 2. Business flow (Mermaid) → 3. Functional modules → 4. Core data → 5. Contracts → 6. Division → 7. Risks & questions → 8. Growth foresight → 9. Lovable diff\nAll in business language, zero tech jargon", dot: "emerald" },
            { tags: ["state"], title: "Save & version", desc: "Save to projects/{name}/consensus/{NAME}-consensus-{date}.md\nArchive old version → projects/{name}/archive/", dot: "blue" },
            { tags: ["human"], title: "Requirements review meeting", desc: "Product + Backend + Frontend + Test review together\nApproved → git commit as baseline\nIssues → discuss → revise → re-review", dot: "red" },
            { tags: ["observe"], title: "Git commit as traceable baseline", desc: "git commit -m \"ame: consensus v2026-04-06\"", dot: "gray" },
          ]},
          { name: "Flow B — /update-consensus", steps: [
            { tags: ["ctx"], title: "Load current consensus + project.yaml", desc: "Auto-resolve repo addresses from project.yaml", dot: "purple" },
            { tags: ["tool"], title: "Read all GitHub Issues via MCP", desc: "Fetch all Issues (open + closed) with comments → classify each", dot: "emerald" },
            { tags: ["tool"], title: "Generate Change Log", desc: "Impact: API contract / data model / business flow / division change\nSeparate: no-impact + pending-decision Issues", dot: "emerald" },
            { tags: ["human"], title: "Confirm Change Log — do NOT auto-merge", desc: "Project owner reviews accuracy → confirmed → proceed\nCorrections needed → adjust → re-confirm", dot: "red" },
            { tags: ["tool", "state"], title: "Merge changes → new version", desc: "Natural language rewrite (no CL format traces), maintain all language rules", dot: "emerald" },
            { tags: ["state", "observe"], title: "Archive old → save new → git commit", desc: "git commit -m \"ame: consensus update v2026-04-10, merged #1 #6 #7\"", dot: "blue" },
          ]},
          { name: "Flow C — Eval & evolution cycle", steps: [
            { tags: ["verify"], title: "/eval {case} — 5-dimension assessment", desc: "Load full control chain + test case → simulate /new-consensus → output doc + execution log\nScore: A completeness (16-18) + B language (14) + C accuracy (8) + D usability (10) + E flow execution (12)\nRoot cause analysis → map each loss to target file", dot: "amber" },
            { tags: ["verify"], title: "/update-rules — root cause → target file routing", desc: "commands/*.md ← flow issues (E dim)\ninstructions.md ← content rules (A/B dim)\nCLAUDE.md ← role confusion\nknowledge/*.md ← knowledge gaps\ndimensions.md ← eval criteria gaps", dot: "amber" },
            { tags: ["human"], title: "Confirm modifications per file", desc: "Partial approval OK — select which changes per file to execute", dot: "red" },
            { tags: ["verify"], title: "/eval {case} — regression test", desc: "Re-run → compare 5 dimensions → verify improvement, no regressions", dot: "amber" },
            { tags: ["state", "observe"], title: "Version rule files + track score trends", desc: "git commit -m \"rules: fix E3+B1 (38→43)\"\nEvolution loop: unsatisfactory → /update-rules → /eval → repeat", dot: "blue" },
          ], feedback: { label: "Evolution loop", desc: "Score not satisfactory → /update-rules → /eval → repeat. New project → new eval case → expand coverage." }},
        ],
      },
      {
        num: "P2", title: "Iterate & design", env: "Project repo · Developers",
        summary: "Baseline → /iterate (impact analysis + task checklist) → /design (layered knowledge, per role). For existing projects, start with /init-baseline.",
        flows: [
          { name: "/init-baseline — first-time setup", steps: [
            { tags: ["tool"], title: "Scan codebase automatically", desc: "Detect stack type (Java/React/Taro) → scan modules, APIs, entities, dependencies\nDirect local filesystem scan, no GitHub MCP needed", dot: "emerald" },
            { tags: ["ctx"], title: "Initialize layered knowledge", desc: "Auto-fill .claude/knowledge/backend/ or frontend/ based on detected stack\nRemove irrelevant templates, keep only what matches this project", dot: "purple" },
            { tags: ["state"], title: "Save baseline + project.yaml", desc: "docs/baseline/{name}-baseline-{date}.md\nproject.yaml with stack, arch, repo, commit hash", dot: "blue" },
          ]},
          { name: "/iterate — impact analysis + task checklist", steps: [
            { tags: ["ctx"], title: "Load baseline + layered knowledge (on-demand)", desc: "Baseline as system context, only load role-relevant knowledge files\nRead workspace journal for recent context", dot: "purple" },
            { tags: ["tool"], title: "Fetch requirements from TAPD / GitHub / manual", desc: "TAPD MCP → ticket details\nGitHub MCP → Issue + comments\nManual → paste requirement text", dot: "emerald" },
            { tags: ["verify"], title: "Impact analysis against baseline", desc: "Module impact · API changes (breaking?) · Data model changes (migration?)\nConflict detection: new requirement vs existing design vs known constraints", dot: "amber" },
            { tags: ["tool"], title: "Generate 7-item iterate consensus", desc: "1. Scope → 2. Impact → 3. API changes → 4. Data changes → 5. Conflicts → 6. Risks & PM questions → 7. Baseline update plan", dot: "emerald" },
            { tags: ["tool", "state"], title: "Auto-generate task checklist", desc: "Extract actionable tasks from consensus, grouped by role:\n☐ Backend tasks · ☐ Frontend tasks · ☐ Test tasks · ☐ PM confirmations\nSaved to docs/tasks/{sprint}/checklist.md", dot: "emerald" },
            { tags: ["human"], title: "Confirm iterate consensus + task list", desc: "Review accuracy of impact analysis and task breakdown\nSync with PM for product confirmation items", dot: "red" },
          ]},
          { name: "/design — layered knowledge per role", steps: [
            { tags: ["ctx"], title: "Load consensus + role-specific knowledge only", desc: "Backend → knowledge/backend/* + red-lines.md (skip frontend/)\nFrontend → knowledge/frontend/* + red-lines.md (skip backend/)\nMinimum context, maximum relevance", dot: "purple" },
            { tags: ["tool"], title: "Generate detailed design (iteration-aware)", desc: "For iterations: only cover changed parts, mark new vs modified\nFor 0-1 projects: full design as before", dot: "emerald" },
            { tags: ["verify"], title: "Auto-check design vs consensus contracts", desc: "Conflicts → prompt to update iterate consensus first", dot: "amber" },
            { tags: ["human"], title: "Design review — confirm alignment", desc: "Review design, confirm it aligns with consensus", dot: "red" },
          ]},
        ],
      },
      {
        num: "P3", title: "Code implementation", env: "Project repo · Developers",
        summary: "/impl (recon + journal → plan → confirm → code → self-check → write journal + suggest knowledge updates) → /review → /record-session",
        flows: [
          { name: "/impl — 8-step implementation with journal", steps: [
            { tags: ["ctx"], title: "Step A: Recon + load journal", desc: "Load role-specific knowledge (layered, on-demand) + design doc + red lines\nRead workspace journal: last 5 entries for cross-session context\nScan existing code structure for this module", dot: "purple" },
            { tags: ["tool"], title: "Step B: Generate implementation plan", desc: "Files to create/modify, order, dependencies, risks\nFlag journal items: \"Last session left: {unfinished item}\" → plan covers it", dot: "emerald" },
            { tags: ["human"], title: "Step C: Developer confirms plan", desc: "Approve → proceed. Adjust → revise plan.", dot: "red" },
            { tags: ["tool"], title: "Step D: Generate code", desc: "Follow plan + loaded knowledge rules + DDD/MVC conventions\nUse framework utilities, no reinvention", dot: "emerald" },
            { tags: ["verify"], title: "Step E: Self-check", desc: "Compile → red line scan → design alignment → knowledge compliance\nReport issues before human review", dot: "amber" },
            { tags: ["state"], title: "Step F: Write journal entry", desc: "Auto-append to docs/workspace/{dev}/journal.md:\nWhat was done · files changed · issues found · unfinished items", dot: "blue" },
            { tags: ["observe"], title: "Step G: Suggest knowledge updates", desc: "Discovered undocumented patterns or pitfalls?\n→ Suggest adding to specific knowledge file\n→ Developer confirms → knowledge auto-updated → team benefits next time", dot: "gray" },
            { tags: ["state"], title: "Step H: Update task checklist", desc: "Auto-tick completed items in docs/tasks/{sprint}/checklist.md\nShow remaining tasks", dot: "blue" },
          ], feedback: { label: "Feedback loop 1 — Spec pushback", desc: "Design gaps/conflicts → /spec-feedback → docs/feedback/ → team decides: update design or escalate to consensus" }},
          { name: "/review — structured verification + knowledge update", steps: [
            { tags: ["ctx"], title: "Load role-specific knowledge + design contracts", desc: "Same layered loading as /impl — only relevant knowledge files", dot: "purple" },
            { tags: ["verify"], title: "Structured checklist verification", desc: "1. API paths match design? · 2. Data fields match consensus?\n3. DDD layering respected? · 4. Red lines: no magic values, proper exceptions?\n5. Frontend: correct component lib?\nOutput: pass/fail per item + specific issues", dot: "amber" },
            { tags: ["observe"], title: "Suggest knowledge updates", desc: "Review found patterns not in knowledge?\n→ Suggest update to prevent same issue recurring", dot: "gray" },
            { tags: ["human"], title: "Approve or request changes", desc: "Pass → ready for test. Fail → /impl fix cycle.", dot: "red" },
          ], feedback: { label: "Feedback loop 2 — Fix cycle", desc: "Issues → /impl with fix instructions → /review → repeat until all pass" }},
          { name: "/record-session — end-of-session capture", steps: [
            { tags: ["state"], title: "Summarize entire session", desc: "All commands executed · all files changed · all decisions made\nAppend comprehensive entry to journal", dot: "blue" },
            { tags: ["observe"], title: "Knowledge self-iteration", desc: "Review session for reusable insights:\n\"sxp-framework's @Order(97) matters\" → update backend/sxp-framework.md\nOne dev's discovery becomes the whole team's knowledge", dot: "gray" },
            { tags: ["state"], title: "Update task checklist + suggest next steps", desc: "Tick off completed tasks · list remaining · suggest next session's starting point", dot: "blue" },
          ]},
        ],
      },
      {
        num: "P4", title: "Test generation & ship", env: "Project repo · Developers",
        summary: "Test plan + code → /test-gen (layered knowledge) → /preflight (compile+test+scan) → PR approve → merge.",
        flows: [
          { name: "/test-gen & /preflight", steps: [
            { tags: ["ctx"], title: "Load test plan + knowledge/testing/ + consensus flows", desc: "Layered: only testing/standards.md + red-lines.md\n+ Mermaid business flows from consensus + actual code", dot: "purple" },
            { tags: ["tool"], title: "/test-gen {feature}", desc: "Unit tests (JUnit 5 / React Testing Library) + API integration tests\nEvery flow path (normal + exception) → test case\nAligned with design contracts", dot: "emerald" },
            { tags: ["verify"], title: "/preflight — pre-commit check", desc: "Compile → run tests → coverage → red line scan → design alignment\nAll pass → ready. Fail → specific fix guidance", dot: "amber" },
            { tags: ["human"], title: "Approve PR → merge", desc: "Final human gate before code enters main branch", dot: "red" },
            { tags: ["observe"], title: "Traceable delivery", desc: "Every PR traces: consensus → design → impl plan → review → tests", dot: "gray" },
          ]},
        ],
      },
      {
        num: "P5", title: "Feedback & evolution", env: "Both environments",
        summary: "Spec feedback + journal insights → consensus update → eval cases → rule improvements → knowledge accumulation. Double loop.",
        flows: [
          { name: "Closed loop — rules + knowledge", steps: [
            { tags: ["verify"], title: "Aggregate feedback from project repos", desc: "docs/feedback/ (spec issues) + journal insights (dev discoveries)\n→ batch into GitHub Issues for consensus impact", dot: "amber" },
            { tags: ["ctx", "tool"], title: "/update-consensus in ai-workflow", desc: "Read Issues + feedback → Change Log → confirm → update → sync back", dot: "purple" },
            { tags: ["verify"], title: "Create eval test case from project experience", desc: "Red line violations, spec gaps, knowledge blind spots\n→ eval/cases/{project}/", dot: "amber" },
            { tags: ["verify"], title: "/eval → /update-rules → /eval (regression)", desc: "Score current rules → root cause fix → verify across ALL cases", dot: "amber" },
            { tags: ["observe"], title: "Knowledge accumulation across projects", desc: "Project A's knowledge updates carry to Project B\nLayered knowledge files are shared templates — improvements compound", dot: "gray" },
            { tags: ["state", "observe"], title: "Commit improved rules + knowledge → next cycle", desc: "Rules evolve via eval. Knowledge evolves via daily dev work.\nBoth loops make the next project start smarter.", dot: "blue" },
          ], feedback: { label: "Double loop", desc: "Loop 1 (ai-workflow): eval → update-rules → better consensus docs\nLoop 2 (project repos): daily dev → journal + knowledge updates → better code quality\nBoth compound over time." }},
        ],
      },
    ],
  },
  zh: {
    modules: {
      ctx: "上下文工程",
      tool: "执行环境与编排",
      verify: "约束与验证",
      state: "状态持久化",
      observe: "可观测性",
      human: "人机协同",
    },
    moduleDesc: {
      ctx: "为 Agent 构建正确的信息环境 — 分层 Knowledge 按需加载，Journal 实现跨会话记忆",
      tool: "执行环境（文件系统、沙箱、MCP）+ 结构化任务编排（步骤顺序、工具调度）",
      verify: "前馈约束（linter、结构化测试，机械强制）+ 反馈验证（自检、eval）。是强制执行，不是建议。",
      state: "跨会话持久化任务进度、决策和产出物 — journal、任务清单、基线快照",
      observe: "日志、追踪、版本记录 — 出了问题能回溯到是哪个上下文、哪条规则、哪个决策导致的",
      human: "在关键节点人类确认（破坏性操作、spec 变更、质量判断）。是掌舵，不是微管理。",
    },
    collapseAll: "全部收起",
    expandAll: "全部展开",
    footer: "P5 回到 P1 — 每个项目都让下一个项目的规则更好",
    showDesc: "模块定义",
    hideDesc: "收起",
    phases: [
      {
        num: "P1", title: "共识文档生成", env: "ai-workflow · 命令执行者（指定开发者）",
        summary: "PRD → 9 项共识文档 → 评审 → 基线。包含 eval 和规则进化循环，持续改进规则质量。",
        flows: [
          { name: "流程 A — /new-consensus", steps: [
            { tags: ["ctx"], title: "加载完整控制链", desc: "CLAUDE.md + commands/new-consensus.md + instructions.md + knowledge/*.md + project.yaml → 进入「架构师」角色", dot: "purple" },
            { tags: ["tool"], title: "验证参数 & 准备项目目录", desc: "按模式（1/2/3）检查必填参数，缺失则主动询问\n创建 projects/{name}/ + project.yaml", dot: "emerald" },
            { tags: ["tool"], title: "获取产品资料（按模式分支）", desc: "模式一：PRD + Figma MCP → 交叉验证\n模式二：PRD + 蓝湖 MCP → 交叉验证\n模式三：GitHub MCP → 文档仓库 + 代码仓库 → 整合", dot: "emerald" },
            { tags: ["tool"], title: "生成 9 项共识文档（严格顺序）", desc: "1. 资料完整性 → 2. 业务流程图 → 3. 功能模块 → 4. 核心数据 → 5. 前后端契约 → 6. 分工边界 → 7. 风险与疑问 → 8. 前瞻性确认 → 9. Lovable 差异\n全部使用业务语言，禁止技术术语", dot: "emerald" },
            { tags: ["state"], title: "保存 & 版本管理", desc: "保存到 projects/{name}/consensus/{NAME}-共识文档-{日期}.md\n旧版归档 → projects/{name}/archive/", dot: "blue" },
            { tags: ["human"], title: "需求评审会", desc: "产品 + 后端 + 前端 + 测试 共同评审\n通过 → git commit 作为基线\n有问题 → 讨论 → 修改 → 重新评审", dot: "red" },
            { tags: ["observe"], title: "Git commit 作为可追溯基线", desc: "git commit -m \"ame: 共识文档 v2026-04-06\"", dot: "gray" },
          ]},
          { name: "流程 B — /update-consensus", steps: [
            { tags: ["ctx"], title: "加载当前共识文档 + project.yaml", desc: "从 project.yaml 自动读取仓库地址", dot: "purple" },
            { tags: ["tool"], title: "通过 MCP 读取所有 GitHub Issue", desc: "获取所有 Issue（open + closed）及评论 → 逐个分类", dot: "emerald" },
            { tags: ["tool"], title: "生成 Change Log", desc: "变更类型：API 契约 / 数据模型 / 业务流程 / 分工变更\n另列：无影响的 Issue + 待决策的 Issue", dot: "emerald" },
            { tags: ["human"], title: "确认 Change Log — 不自动合并", desc: "项目负责人确认分类准确性 → 确认后继续\n需要修正 → 调整后重新确认", dot: "red" },
            { tags: ["tool", "state"], title: "合并变更 → 生成新版本", desc: "用正常语言重新表述（不保留 CL 格式），遵守所有语言规范", dot: "emerald" },
            { tags: ["state", "observe"], title: "归档旧版 → 保存新版 → git commit", desc: "git commit -m \"ame: 共识文档更新 v2026-04-10，合并 #1 #6 #7\"", dot: "blue" },
          ]},
          { name: "流程 C — Eval 与规则进化循环", steps: [
            { tags: ["verify"], title: "/eval {case} — 5 维度评估", desc: "加载完整控制链 + 测试用例 → 模拟执行 /new-consensus → 输出共识文档 + 执行日志\n评分：A 完整性 + B 语言规范 + C 准确性 + D 可用性 + E 流程执行\n根因分析 → 定位到目标文件", dot: "amber" },
            { tags: ["verify"], title: "/update-rules — 根因 → 目标文件路由", desc: "commands/*.md ← 流程编排问题\ninstructions.md ← 内容规则问题\nCLAUDE.md ← 角色混淆\nknowledge/*.md ← 知识缺失\ndimensions.md ← 评估标准", dot: "amber" },
            { tags: ["human"], title: "按文件确认修改方案", desc: "支持部分确认 — 选择每个文件中要执行的修改", dot: "red" },
            { tags: ["verify"], title: "/eval {case} — 回归测试", desc: "重新执行 → 对比 5 维度 → 验证改善，无新回退", dot: "amber" },
            { tags: ["state", "observe"], title: "版本化规则文件 + 追踪分数趋势", desc: "git commit -m \"rules: 修复 E3+B1 (38→43)\"\n进化循环：不满意 → /update-rules → /eval → 重复", dot: "blue" },
          ], feedback: { label: "进化循环", desc: "分数不满意 → /update-rules → /eval → 重复。新项目 → 新 eval 用例 → 扩大覆盖。" }},
        ],
      },
      {
        num: "P2", title: "迭代分析 & 详细设计", env: "项目仓库 · 对应开发者",
        summary: "基线 → /iterate（影响分析 + 任务清单）→ /design（分层 Knowledge 按需加载）。旧项目首次接入先跑 /init-baseline。",
        flows: [
          { name: "/init-baseline — 首次接入", steps: [
            { tags: ["tool"], title: "自动扫描代码仓库", desc: "检测栈类型（Java/React/Taro）→ 扫描模块、API、实体、依赖\n直接扫描本地文件系统，不需要 MCP", dot: "emerald" },
            { tags: ["ctx"], title: "初始化分层 Knowledge", desc: "根据检测到的技术栈自动填充 .claude/knowledge/backend/ 或 frontend/\n删除不适用的模板，只保留匹配的", dot: "purple" },
            { tags: ["state"], title: "保存基线 + project.yaml", desc: "docs/baseline/{name}-baseline-{date}.md\nproject.yaml 记录栈类型、架构、仓库、commit", dot: "blue" },
          ]},
          { name: "/iterate — 影响分析 + 任务清单", steps: [
            { tags: ["ctx"], title: "加载基线 + 分层 Knowledge（按需）", desc: "基线作为系统上下文，只加载角色相关的 knowledge 文件\n读取 workspace journal 获取近期上下文", dot: "purple" },
            { tags: ["tool"], title: "从 TAPD / GitHub / 手动 获取需求", desc: "TAPD MCP → 需求卡片详情\nGitHub MCP → Issue + 评论\n手动 → 粘贴需求内容", dot: "emerald" },
            { tags: ["verify"], title: "对照基线做影响分析", desc: "模块影响 · API 变更（是否 breaking?）· 数据模型变更（是否需迁移?）\n冲突检测：新需求 vs 现有设计 vs 已知约束", dot: "amber" },
            { tags: ["tool"], title: "生成 7 项迭代共识", desc: "1. 范围 → 2. 影响 → 3. 接口变更 → 4. 数据变更 → 5. 冲突 → 6. 风险与产品确认 → 7. 基线更新计划", dot: "emerald" },
            { tags: ["tool", "state"], title: "自动生成任务清单", desc: "从共识提取可执行任务，按角色分组：\n☐ 后端任务 · ☐ 前端任务 · ☐ 测试任务 · ☐ 产品确认\n保存到 docs/tasks/{sprint}/checklist.md", dot: "emerald" },
            { tags: ["human"], title: "确认迭代共识 + 任务清单", desc: "检查影响分析准确性和任务拆分粒度\n同步 PM 确认产品确认项", dot: "red" },
          ]},
          { name: "/design — 分层 Knowledge 按角色加载", steps: [
            { tags: ["ctx"], title: "只加载角色相关的 Knowledge", desc: "后端 → knowledge/backend/* + red-lines.md（跳过 frontend/）\n前端 → knowledge/frontend/* + red-lines.md（跳过 backend/）\n最小上下文，最大相关性", dot: "purple" },
            { tags: ["tool"], title: "生成详细设计（迭代感知）", desc: "迭代场景：只覆盖变更部分，标注新增 vs 修改\n0-1 项目：完整设计", dot: "emerald" },
            { tags: ["verify"], title: "自动校验与共识文档一致性", desc: "发现冲突 → 提示先更新迭代共识", dot: "amber" },
            { tags: ["human"], title: "设计评审 — 确认对齐", desc: "审查设计，确认与共识文档一致", dot: "red" },
          ]},
        ],
      },
      {
        num: "P3", title: "编码实现", env: "项目仓库 · 开发人员",
        summary: "/impl（侦察+读journal → 计划 → 确认 → 编码 → 自检 → 写journal + 建议knowledge更新）→ /review → /record-session",
        flows: [
          { name: "/impl — 8 步实现（含 journal 和知识沉淀）", steps: [
            { tags: ["ctx"], title: "Step A：侦察 + 加载 journal", desc: "按角色加载分层 Knowledge + 设计文档 + 红线\n读取 workspace journal：最近 5 条作为跨会话上下文\n扫描相关模块的现有代码结构", dot: "purple" },
            { tags: ["tool"], title: "Step B：生成实现计划", desc: "要创建/修改的文件、顺序、依赖、风险\n标注 journal 遗留项：\"上次未完成：{xxx}\" → 本次计划已覆盖", dot: "emerald" },
            { tags: ["human"], title: "Step C：开发者确认计划", desc: "确认 → 继续。调整 → 修改计划。", dot: "red" },
            { tags: ["tool"], title: "Step D：生成代码", desc: "遵循已加载的 Knowledge + DDD/MVC 约定\n使用框架工具类，不重复造轮子", dot: "emerald" },
            { tags: ["verify"], title: "Step E：自检", desc: "编译 → 红线扫描 → 设计对齐 → Knowledge 合规检查\n在人工 review 前先自行报告问题", dot: "amber" },
            { tags: ["state"], title: "Step F：写 journal", desc: "自动追加到 docs/workspace/{开发者}/journal.md：\n做了什么 · 改了哪些文件 · 发现的问题 · 遗留事项", dot: "blue" },
            { tags: ["observe"], title: "Step G：建议 Knowledge 更新", desc: "发现了未被文档记录的模式或踩坑点？\n→ 建议追加到对应 knowledge 文件\n→ 开发者确认 → 自动更新 → 下次其他人自动受益", dot: "gray" },
            { tags: ["state"], title: "Step H：更新任务清单", desc: "自动勾选 docs/tasks/{sprint}/checklist.md 中已完成的项\n显示剩余任务", dot: "blue" },
          ], feedback: { label: "反馈循环 1 — Spec 反推", desc: "设计缺口/冲突 → /spec-feedback → docs/feedback/ → 团队决定：更新设计 or 升级到共识文档更新" }},
          { name: "/review — 结构化校验 + 知识沉淀", steps: [
            { tags: ["ctx"], title: "加载角色相关 Knowledge + 设计契约", desc: "与 /impl 相同的分层加载策略", dot: "purple" },
            { tags: ["verify"], title: "逐项结构化校验", desc: "1. API 路径与设计一致？· 2. 数据字段与共识一致？\n3. DDD 分层遵守？· 4. 红线：无魔法值、正确异常处理？\n5. 前端：正确组件库？\n输出：逐项通过/未通过 + 具体问题", dot: "amber" },
            { tags: ["observe"], title: "建议 Knowledge 更新", desc: "review 中发现 knowledge 未覆盖的模式？\n→ 建议更新，防止同类问题复发", dot: "gray" },
            { tags: ["human"], title: "通过或要求修改", desc: "通过 → 进入测试。需修改 → /impl 修复循环。", dot: "red" },
          ], feedback: { label: "反馈循环 2 — 修复循环", desc: "发现问题 → /impl 带修复指令 → /review → 重复直到全部通过" }},
          { name: "/record-session — 会话结束记录", steps: [
            { tags: ["state"], title: "汇总整个会话成果", desc: "所有执行的命令 · 所有文件变更 · 所有决策\n追加完整记录到 journal", dot: "blue" },
            { tags: ["observe"], title: "Knowledge 自迭代", desc: "回顾会话中可沉淀的知识：\n\"sxp-framework 的 @Order(97) 很重要\" → 更新 backend/sxp-framework.md\n一个人的发现变成整个团队的知识", dot: "gray" },
            { tags: ["state"], title: "更新任务清单 + 建议下次起点", desc: "勾选已完成任务 · 列出剩余 · 建议下次 session 的切入点", dot: "blue" },
          ]},
        ],
      },
      {
        num: "P4", title: "测试生成 & 交付", env: "项目仓库 · 对应开发者",
        summary: "测试方案 + 代码 → /test-gen（分层 Knowledge）→ /preflight → PR 审批 → 合并。完整可追溯。",
        flows: [
          { name: "/test-gen & /preflight", steps: [
            { tags: ["ctx"], title: "加载测试规范 + 共识流程 + 实际代码", desc: "分层加载：testing/standards.md + red-lines.md\n+ Mermaid 业务流程 + 已实现代码", dot: "purple" },
            { tags: ["tool"], title: "/test-gen {feature}", desc: "单元测试 + API 集成测试\n每条流程路径（正常 + 异常分支）→ 测试用例\n与设计契约对齐", dot: "emerald" },
            { tags: ["verify"], title: "/preflight — 提交前全面检查", desc: "编译 → 运行测试 → 覆盖率 → 红线扫描 → 设计对齐\n全部通过 → 可提交。失败 → 给出具体修复指导", dot: "amber" },
            { tags: ["human"], title: "审批 PR → 合并", desc: "代码进入主分支前的最终人工关卡", dot: "red" },
            { tags: ["observe"], title: "可追溯的交付", desc: "每个 PR 可追溯：共识文档 → 设计 → 实现计划 → review → 测试", dot: "gray" },
          ]},
        ],
      },
      {
        num: "P5", title: "反馈与进化", env: "双环境",
        summary: "Spec 反馈 + journal 洞察 → 共识更新 → eval 用例 → 规则改进 → Knowledge 积累。双循环。",
        flows: [
          { name: "闭环 — 规则进化 + 知识积累", steps: [
            { tags: ["verify"], title: "汇总项目仓库反馈", desc: "docs/feedback/（设计问题）+ journal 洞察（开发发现）\n→ 批量转为 GitHub Issue 影响共识文档", dot: "amber" },
            { tags: ["ctx", "tool"], title: "在 ai-workflow 执行 /update-consensus", desc: "读取 Issue + 反馈 → Change Log → 确认 → 更新 → 同步回项目仓库", dot: "purple" },
            { tags: ["verify"], title: "从项目经验创建 eval 测试用例", desc: "红线违规、spec 缺口、knowledge 盲区\n→ eval/cases/{project}/", dot: "amber" },
            { tags: ["verify"], title: "/eval → /update-rules → /eval（回归）", desc: "评估当前规则 → 根因修复 → 在所有用例上验证", dot: "amber" },
            { tags: ["observe"], title: "Knowledge 跨项目积累", desc: "项目 A 的 knowledge 更新带到项目 B\n分层 Knowledge 是共享模板 — 改进持续叠加", dot: "gray" },
            { tags: ["state", "observe"], title: "提交改进后的规则 + Knowledge → 下一循环", desc: "规则通过 eval 进化。Knowledge 通过日常开发进化。\n双循环让下一个项目起点更高。", dot: "blue" },
          ], feedback: { label: "双循环", desc: "循环 1（ai-workflow）：eval → update-rules → 更好的共识文档\n循环 2（项目仓库）：日常开发 → journal + knowledge 更新 → 更好的代码质量\n两者持续叠加。" }},
        ],
      },
    ],
  },
};

const PHASE_COLORS = [
  { bar: "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800", num: "bg-purple-600", title: "text-purple-800 dark:text-purple-200" },
  { bar: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800", num: "bg-emerald-600", title: "text-emerald-800 dark:text-emerald-200" },
  { bar: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800", num: "bg-emerald-600", title: "text-emerald-800 dark:text-emerald-200" },
  { bar: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800", num: "bg-emerald-600", title: "text-emerald-800 dark:text-emerald-200" },
  { bar: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800", num: "bg-amber-600", title: "text-amber-800 dark:text-amber-200" },
];

const DOT = { purple: "bg-purple-400", emerald: "bg-emerald-500", red: "bg-red-400", amber: "bg-amber-500", blue: "bg-blue-400", gray: "bg-gray-400" };

const TAG_STYLE = {
  ctx: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  tool: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  verify: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  state: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  observe: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  human: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const Tag = ({ type, lang }) => (
  <span className={`inline-block text-xs px-1.5 py-0.5 rounded-md mr-1 font-medium ${TAG_STYLE[type]}`}>{i18n[lang].modules[type]}</span>
);

const Step = ({ step, isLast, lang }) => (
  <div className="flex gap-2.5 relative">
    {!isLast && <div className="absolute left-[11px] top-[28px] bottom-[-4px] w-px bg-gray-200 dark:bg-gray-700" />}
    <div className={`w-[22px] h-[22px] min-w-[22px] rounded-full flex items-center justify-center mt-0.5 z-10 ${DOT[step.dot]}`}>
      <div className="w-2 h-2 rounded-full bg-white/80" />
    </div>
    <div className="flex-1 pb-2">
      <div className="flex items-center gap-1 flex-wrap mb-0.5">
        {step.tags.map((t) => <Tag key={t} type={t} lang={lang} />)}
      </div>
      <div className="text-sm font-medium">{step.title}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line leading-relaxed mt-0.5">{step.desc}</div>
    </div>
  </div>
);

const Flow = ({ flow, lang }) => (
  <div className="mb-4">
    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 pl-1">{flow.name}</div>
    {flow.steps.map((s, i) => <Step key={i} step={s} isLast={i === flow.steps.length - 1 && !flow.feedback} lang={lang} />)}
    {flow.feedback && (
      <div className="ml-8 my-1 px-3 py-2 border-l-2 border-amber-400 bg-amber-50/50 dark:bg-amber-950/30 rounded-r-lg">
        <div className="text-xs font-medium text-amber-600 dark:text-amber-400">{flow.feedback.label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">{flow.feedback.desc}</div>
      </div>
    )}
  </div>
);

export default function HarnessWorkflow() {
  const [lang, setLang] = useState("zh");
  const [expanded, setExpanded] = useState(new Set(["0"]));
  const [showModuleDesc, setShowModuleDesc] = useState(false);
  const t = i18n[lang];
  const toggle = (id) => setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allExp = expanded.size === t.phases.length;

  return (
    <div className="max-w-2xl mx-auto py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(t.modules).map(([k, v]) => (
            <span key={k} className={`text-xs px-1.5 py-0.5 rounded-md cursor-default ${TAG_STYLE[k]}`}>{v}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang(lang === "en" ? "zh" : "en")} className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 transition-colors">
            {lang === "en" ? "中文" : "EN"}
          </button>
          <button onClick={() => setExpanded(allExp ? new Set() : new Set(t.phases.map((_, i) => String(i))))} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {allExp ? t.collapseAll : t.expandAll}
          </button>
        </div>
      </div>

      <div className="mb-3">
        <button onClick={() => setShowModuleDesc(!showModuleDesc)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          {showModuleDesc ? `▾ ${t.hideDesc}` : `▸ ${t.showDesc}`}
        </button>
        {showModuleDesc && (
          <div className="mt-2 space-y-1.5">
            {Object.entries(t.moduleDesc).map(([k, desc]) => (
              <div key={k} className="flex gap-2 items-start">
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0 mt-0.5 ${TAG_STYLE[k]}`}>{t.modules[k]}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {t.phases.map((p, i) => {
        const pc = PHASE_COLORS[i];
        const isOpen = expanded.has(String(i));
        return (
          <div key={`${lang}-${i}`} className="mb-3">
            <button onClick={() => toggle(String(i))} className={`w-full flex items-center gap-2 p-3 rounded-xl border ${pc.bar} text-left transition-all hover:shadow-sm`}>
              <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-lg ${pc.num}`}>{p.num}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${pc.title}`}>{p.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.env}</div>
              </div>
              <span className="text-gray-400 text-lg flex-shrink-0">{isOpen ? "−" : "+"}</span>
            </button>
            {!isOpen && <div className="text-xs text-gray-400 dark:text-gray-500 px-4 py-1.5">{p.summary}</div>}
            {isOpen && (
              <div className="mt-2 pl-2 pr-1">
                {p.flows.map((f, fi) => (
                  <div key={fi}>
                    <Flow flow={f} lang={lang} />
                    {fi < p.flows.length - 1 && <div className="border-t border-dashed border-gray-200 dark:border-gray-700 my-3" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2 py-2 border-t border-gray-100 dark:border-gray-800">
        {t.footer}
      </div>
    </div>
  );
}
