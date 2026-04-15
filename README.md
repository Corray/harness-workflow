# Harness Workflow — 上手指南

## 一、这是什么？

简单说，这是一套**让 Claude Code 帮你团队开发的"操作手册"**。

把 Claude Code 想象成一个新入职的全能工程师——他能写代码、做设计、写测试，但他不了解你们团队的规矩、架构约定、踩过的坑。这套 Workflow 做的事情就是：**把团队的规矩、流程、知识写成文件，让 Claude 每次做事前先"读一遍规矩"再动手**。

### 它解决什么问题？

**问题 1：AI 写的代码风格五花八门**
不同开发者让 AI 写的代码风格都不一样，合到一起就是缝合怪。
→ 本方案用统一的规则文件（CLAUDE.md + knowledge/）约束所有 AI 产出。

**问题 2：每次都要重复解释业务背景**
每开一个新对话都得从头告诉 AI 业务是什么、接口怎么定、数据结构是啥。
→ 本方案用「共识文档」一次性讲清楚，所有开发者共用。

**问题 3：AI 会跳步、会乱发挥**
让它改个 bug，它顺手重构了半个模块。
→ 本方案用「命令 + 自检 + 红线」把 AI 锁在固定流程里。

**问题 4：上次聊的内容这次忘了**
Claude 会话之间没记忆。
→ 本方案用「Journal」让 AI 自己写工作日志，下次先读日志再干活。

**问题 5：同一个坑不同人反复踩**
张三踩了个坑解决了，李四过两天又踩一次。
→ 本方案让 AI 发现新坑时主动建议更新 knowledge 文件，全团队受益。

### 它是怎么运转的？

整套流程分五个阶段：

**P1 — 先对齐**：产品给了 PRD，架构师用 `/new-consensus` 生成一份所有人都能看懂的**共识文档**（用业务语言写，不含"Controller""DTO"这些技术黑话）。前后端测试一起评审，通过后就是项目基线。

**P2 — 做设计**：每次迭代有新需求时，开发者用 `/iterate` 做影响分析（这个需求动了哪些模块、接口有没有 break），然后用 `/design` 按自己角色（后端/前端）生成详细设计。

**P3 — 写代码**：用 `/impl` 让 AI 按 8 步流程干活——先侦察（看 journal、看现有代码）、拟计划、你确认、写代码、自检（编译+红线+对齐设计）、写 journal、建议沉淀新知识、更新任务清单。

**P4 — 测试交付**：用 `/test-gen` 生成测试用例，用 `/preflight` 做提交前全面检查（编译+测试+覆盖率+红线），全通过才提 PR。

**P5 — 回流进化**：开发中发现共识文档或规则有问题，写反馈；架构师定期汇总，用 `/eval` + `/update-rules` 改进规则文件。**下一个项目启动时，规则已经更好了**。

---

## 二、适合什么样的团队？

✅ **适合**：
- 3-20 人左右的开发团队，有多个协作角色（产品、前端、后端、测试）
- 已经在用或准备用 Claude Code 的团队
- 项目有一定复杂度（不是一次性脚本）
- 希望把 AI 用得"规范"而不是"放飞"

❌ **不太适合**：
- 个人一次性小项目（杀鸡用牛刀）
- 没有文档/评审习惯的团队（会觉得流程太重）
- 还没开始用 Claude Code 的（先熟悉 Claude Code 基础操作再来）

---

## 三、需要准备什么？

### 3.1 软件环境

1. **安装 Claude Code**：https://claude.com/claude-code （如果还没装）
2. **终端能运行 bash**：Mac / Linux 自带，Windows 用 WSL 或 Git Bash
3. **Node.js**：用于运行 GitHub / Figma / 蓝湖 MCP，https://nodejs.org/ （LTS 版就行）
4. **uv**：用于运行 TAPD MCP（如使用 TAPD），安装命令：
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

### 3.2 账号和 Token

根据你们团队用的工具准备：

| 工具 | 用途 | 必须？ | 哪里拿 |
|------|------|--------|--------|
| GitHub Token | 读 Issue、PR | **必须** | GitHub → Settings → Developer settings → Personal access tokens |
| Figma API Key | 读设计稿 | 用 Figma 就要 | Figma → Settings → Personal access tokens |
| 蓝湖 Token | 读设计稿 | 用蓝湖就要 | 蓝湖个人中心 |
| TAPD Access Token | 读需求卡片 | 用 TAPD 就要 | TAPD 个人设置 → 开放平台 → 访问令牌 |

### 3.3 三个仓库的角色

这套流程用**三个独立 GitHub 仓库**协作：

| 仓库 | 作用 | 谁维护 | 是否 private |
|------|------|-------|-------------|
| **ai-workflow** | 规则中心：命令、模板、评分 | 架构师 + 全员共享 | 通常 private |
| **consensus-hub** | 共识文档中心：跨项目单一真相源 | 产品 + 架构师驱动，全员评审 | **必须 private** |
| **项目仓库**（你的业务代码） | 实际开发 | 开发者 | 按项目定 |

本地建议放一起：
```
~/workspace/
├── ai-workflow/         ← 新建：规则中心
├── consensus-hub/       ← 新建：共识中心（clone 下来只是临时用，日常其实走 GitHub MCP）
└── your-project/        ← 你已有的业务代码仓库
```

**为什么共识单独一个仓库？**
- 跨角色共用（产品/前端/后端/测试都要看，非开发角色不一定有业务代码仓库权限）
- 跨项目沉淀（多个项目可以共用同一个 hub）
- 版本控制清晰（每次 PR 评审，可回滚可 diff）
- 项目仓库只做"只读镜像"，不会污染业务代码

**AI 读取共识的优先级**：
1. 优先通过 GitHub MCP 读 consensus-hub（源）
2. 断网或访问受限 → 回退到项目仓库 `docs/consensus/` 本地镜像
3. 禁止直接改镜像（会被 `/sync-consensus` 下次覆盖）

---

## 四、三步安装（傻瓜版）

### Step 1：下载安装包

假设你已经有 outputs 文件夹（本次生成的所有文件），位置记作 `~/Downloads/outputs`。

### Step 2：运行一键脚本

打开终端，执行：

```bash
# 进入你已有的项目仓库
cd ~/workspace/your-project

# 运行安装脚本
bash ~/Downloads/outputs/setup.sh
```

脚本会依次问你：

**问题 1**：`consensus-hub 仓库地址`
- 填 GitHub 仓库 SSH 地址，比如 `git@github.com:your-org/consensus-hub.git`
- 如果还没建，可以先留空，之后用 `outputs/consensus-hub/` 的模板建好再补到 `~/.claude/config.yaml`

**问题 2**：`ai-workflow 规则中心仓库路径`
- 第一次用，输入 `create`
- 然后输入想创建的位置，比如 `~/workspace/ai-workflow`

**问题 3**：`项目名`
- 一般直接回车用默认值（当前目录名）

**问题 4**：`后端技术栈`
- 比如 `java-spring-boot`，不用可以留空

**问题 5**：`前端技术栈`
- 比如 `react`，不用可以留空

安装完成后，你会看到一段环境变量提示。

### Step 3：配置环境变量

打开 `~/.zshrc`（Mac 默认）或 `~/.bashrc`（Linux），在末尾加上：

```bash
export GITHUB_TOKEN="ghp_你的GitHub_Token"

# 下面这些按需添加，不用的工具就不写
export FIGMA_API_KEY="figd_你的Figma_API_Key"
export LANHU_TOKEN="你的蓝湖Token"
export TAPD_ACCESS_TOKEN="你的TAPD_Access_Token"
```

保存后执行：

```bash
source ~/.zshrc     # Mac
# 或
source ~/.bashrc    # Linux
```

**安装完成！**

---

## 五、快速启动（第一次使用）

### 场景：你要在一个已有项目上开始用这套流程

按顺序执行以下 4 步。

### Step 1：让 AI 熟悉你的项目（2 分钟）

进入你的项目仓库，打开 Claude Code：

```bash
cd ~/workspace/your-project
claude
```

在 Claude Code 里输入：

```
/init-baseline
```

Claude 会自动扫描你的代码、检测技术栈、生成项目基线文档。扫完后它会告诉你生成了什么，你检查没问题就让它 commit。

### Step 2：创建 consensus-hub 仓库（5 分钟，团队只需做一次）

在 GitHub 创建一个 **private 仓库**，名字建议 `consensus-hub`，然后：

```bash
cd ~/workspace
git clone git@github.com:your-org/consensus-hub.git
cd consensus-hub
cp -r ~/Downloads/outputs/consensus-hub/* .
git add . && git commit -m "init: consensus-hub scaffolding"
git push origin main
```

这个仓库以后由架构师/产品负责人维护，其他人只通过 PR 评审参与。

### Step 3：生成项目共识文档（10 分钟）

切换到 ai-workflow 仓库：

```bash
cd ~/workspace/ai-workflow
claude
```

准备好你的 PRD 文件，然后根据情况选一种：

**如果有 Figma 设计稿**：
```
/new-consensus mode=1 project=your-project prd=/path/to/PRD.md figma=https://figma.com/xxx
```

**如果有蓝湖设计稿**：
```
/new-consensus mode=2 project=your-project prd=/path/to/PRD.md lanhu=https://lanhuapp.com/xxx
```

**如果是从代码和文档反向生成**（适合已有项目）：
```
/new-consensus mode=3 project=your-project doc-repo=git@github.com:xxx/docs.git code-repo=git@github.com:xxx/your-project.git
```

Claude 会读取资料，生成 9 项共识文档并**直接推送到 consensus-hub 仓库并发 PR**。团队在 GitHub 上做评审，合并 PR 后共识就生效了。

### Step 4：把共识镜像同步到项目仓库（30 秒）

hub 的 PR 合并后，回到项目仓库：

```bash
cd ~/workspace/your-project
claude
```

输入：

```
/sync-consensus project=your-project
```

Claude 通过 GitHub MCP 拉取 hub 最新版本，写入 `docs/consensus/` 作为只读镜像，并更新 `project.yaml` 的版本指针和同步时间。

### Step 5：开始迭代开发（进入日常节奏）

每次有新需求，按下面的流程走：

```
/iterate source=TAPD-12345          # 从 TAPD 读需求，做影响分析
/design feature=订单导出 role=backend # 生成后端详细设计
/impl feature=订单导出 role=backend   # 8 步编码实现
/review feature=订单导出 role=backend # 代码结构化校验
/test-gen feature=订单导出            # 生成测试用例
/preflight                           # 提交前全面检查
```

每天下班前：

```
/record-session
```

会话就会汇总到 journal，下次打开 Claude Code 时它能接上上次的进度。

---

## 六、常见场景速查

### 场景 1：发现共识文档有问题
```
/spec-feedback feature=订单导出 issue=字段 amount 定义不明确
```
→ 会生成一份反馈文档，团队讨论后决定更新设计还是升级共识。

### 场景 2：需求变更了，要更新共识
回到 ai-workflow 仓库，执行：
```
/update-consensus project=your-project
```
→ 自动读取 GitHub Issue 生成 Change Log，你确认后在 consensus-hub 发 PR 到新版本。PR 合并后，所有依赖的项目仓库执行 `/sync-consensus` 更新镜像。

### 场景 3：看看 consensus-hub 管了多少项目
任何地方：
```
/list-projects
```

### 场景 4：共识生成得不够好，想改进规则
在 ai-workflow 仓库：
```
/eval case=order-export-case    # 先评分
/update-rules                   # 根据评分结果修规则
/eval case=order-export-case    # 再跑一次验证改进了
```

---

## 七、团队推广建议

### 谁来安装？
**第一个人**（技术负责人或架构师）：
- 安装 ai-workflow 仓库
- 生成第一份共识文档
- 把 ai-workflow push 到 Git 远端

**其他开发者**：
- clone ai-workflow 到本地
- 在自己的项目仓库 pull 最新的 `.claude/`、`knowledge/`、`CLAUDE.md`（因为这些是第一个人安装时就 commit 了）
- 配置自己的环境变量
- 安装全局命令：`cp outputs/global-commands/*.md ~/.claude/commands/`

### 文件怎么分享？
- ✅ `.claude/commands/` — commit 到项目 Git，团队共享
- ✅ `knowledge/` — commit 到项目 Git，团队共享
- ✅ `CLAUDE.md` — commit 到项目 Git，团队共享
- ✅ `.mcp.json` — commit 到项目 Git，团队共享
- ❌ `~/.claude/commands/` 下的全局命令 — 每人自己装
- ❌ 环境变量 — 每人自己配（涉及 Token 不要 commit）
- ❌ `docs/workspace/{dev}/journal.md` — 最好各自维护，或约定按 dev 分目录

---

## 八、出问题怎么办？

### "/" 看不到命令
- 确认当前目录有 `.claude/commands/*.md` 文件
- 确认 `CLAUDE.md` 在项目根目录
- 重启 Claude Code

### MCP 连不上
```bash
claude --debug
```
看输出里的 MCP 错误信息。最常见是环境变量没 `source` 或者 Token 过期。

### /new-consensus 生成的文档不对味
- 看看 `ai-workflow/instructions.md` 有没有针对性调整
- 用 `/eval` 找出具体哪个维度扣分
- 用 `/update-rules` 定向修

### 团队某个成员不想用
没关系，这套流程是**工具**不是**强制**。愿意用的人用，不愿意用的人继续 Copilot 也行。共识文档和 knowledge 对所有人都有价值，哪怕不用命令也能看。

---

## 九、下一步学习

装完跑通后可以深入了解：

- **看流程图**：`harness-workflow.jsx` 渲染出来，里面每一步都有详细说明
- **读 CLAUDE.md**：这是 Claude 的"工作手册"，改它就能调整 AI 行为
- **读命令文件**：`.claude/commands/*.md`，每个命令的逻辑都在里面，想改就改
- **建立 knowledge 积累**：让团队把踩过的坑、约定的模式都往 `knowledge/` 里加

---

## 十、一句话总结

> **把团队的规矩、流程、知识写成文本文件，让 Claude 每次干活前先读一遍，就能把 AI 从"聪明但不靠谱的实习生"变成"懂规矩的团队成员"。**

有问题？先看 [INSTALL.md](./INSTALL.md) 的详细安装步骤，或看流程图组件 `harness-workflow.jsx` 理解整体结构。
