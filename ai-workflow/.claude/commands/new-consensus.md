# /new-consensus

从 PRD 生成 9 项共识文档，支持 Figma / 蓝湖 / GitHub 三种输入模式。

生成结果发布到 **consensus-hub 仓库**（通过 PR），而非本地 ai-workflow。

## 参数

从用户输入中解析：
- `mode`（必填）：1 = PRD + Figma，2 = PRD + 蓝湖，3 = GitHub 仓库
- `project`（必填）：项目名称（英文，用于目录命名）
- `prd`（模式 1/2 必填）：PRD 文件路径或 URL
- `figma`（模式 1 必填）：Figma 文件链接
- `lanhu`（模式 2 必填）：蓝湖链接
- `doc-repo`（模式 3 必填）：文档仓库地址
- `code-repo`（模式 3 必填）：代码仓库地址
- `hub-repo`（可选）：consensus-hub 仓库地址，默认从 `~/.claude/config.yaml` 的 `consensus_hub_repo` 读取

缺少必填参数时**主动询问**，不要猜测。

## 执行流程

### 1. 加载上下文
- 读取 `instructions.md`
- 读取 `knowledge/red-lines.md`
- 读取 `knowledge/business-flow-patterns.md`
- 读取 `knowledge/consensus-examples.md`
- 定位 consensus-hub（参数 > 全局配置 > 询问用户）
- 通过 GitHub MCP 检查 hub 中 `projects/{project}/` 是否已存在，存在则提示"将生成新版本"

### 2. 获取产品资料

**模式 1（PRD + Figma）**
1. 读取 PRD
2. 通过 Figma MCP 读取设计稿结构
3. 交叉验证 PRD 和设计稿的一致性，列出差异并询问处理方式

**模式 2（PRD + 蓝湖）**
1. 读取 PRD
2. 通过蓝湖 MCP 读取设计稿
3. 交叉验证（同上）

**模式 3（GitHub 仓库）**
1. 通过 GitHub MCP 读取文档仓库和代码仓库
2. 整合两个来源

### 3. 生成 9 项共识文档（严格顺序）

拆分到 9 个文件，每文件一项（对应 hub 的 `v{X.Y}/01-*.md ~ 09-*.md`）：

1. **01-completeness.md** — 资料完整性确认（✅ / ⚠️ / ❌）
2. **02-business-flow.md** — 业务流程图（Mermaid 中文节点，主流程+异常分支）
3. **03-modules.md** — 功能模块划分（业务域 + 职责 + 边界）
4. **04-data-model.md** — 核心数据结构（业务语言，实体+关系）
5. **05-api-contract.md** — 前后端契约（路径/请求/响应/状态码/分页）
6. **06-boundaries.md** — 分工边界（前端/后端/测试，明确灰色地带）
7. **07-risks.md** — 风险与疑问（编号问题 + 技术风险 + 依赖风险）
8. **08-roadmap.md** — 前瞻性确认（2-3 版本扩展方向 + 空间预留）
9. **09-lovable.md** — Lovable 差异（体验点 + 技术特殊要求）

### 4. 发布到 consensus-hub（PR 流程）

**不要直接 push main**。步骤：

1. 本地临时目录 clone hub 仓库（或 fetch 最新）
2. 计算版本号：
   - 不存在 `projects/{project}/` → `v1.0`
   - 存在 → 询问用户是 major (`v{X+1}.0`) 还是 minor (`v{X}.{Y+1}`)
3. 写入：
   - `projects/{project}/consensus/v{ver}/01-*.md ~ 09-*.md`
   - 更新 `projects/{project}/CHANGELOG.md`（追加条目）
   - 更新 `projects/{project}/project.meta.yaml` 的 `current_version`
   - 更新 `projects/{project}/consensus/latest` symlink → `v{ver}/`
4. 通过 GitHub MCP 创建分支 `consensus/{project}-v{ver}` 并提交
5. 创建 PR，标题：`[{project}] consensus v{ver}`，body 填充 PR 模板并勾选完成的自检项
6. 列出默认评审人（从 `projects/{project}/project.meta.yaml` 的 owners 读取）

### 5. 告知用户

提示：
> 共识文档已发布到 consensus-hub，PR 链接：{PR URL}
> 请组织产品 + 后端 + 前端 + 测试评审。
> 评审通过合并到 main 后，各项目仓库执行 `/sync-consensus project={project}` 拉取镜像。

**本步骤不执行 ai-workflow 本地 commit**（ai-workflow 不再保存项目共识）。

## 变更点说明

与旧版差异：
- ❌ 不再写到 `ai-workflow/projects/{project}/consensus/`
- ✅ 拆分为 9 个独立文件，每项一文件（方便 diff 和独立评审）
- ✅ 通过 GitHub MCP 发 PR 到 consensus-hub
- ✅ 版本按 `v{major}.{minor}` 管理，独立目录
