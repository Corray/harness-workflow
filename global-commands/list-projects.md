# /list-projects

全局命令：列出 **consensus-hub** 中所有项目及其状态。

## 参数

- `hub-repo`（可选）：consensus-hub 地址，默认从 `~/.claude/config.yaml` 读取

## 执行流程

### 1. 定位 consensus-hub
从参数或 `~/.claude/config.yaml` 的 `consensus_hub_repo` 读取。

### 2. 通过 GitHub MCP 扫描 projects/ 目录

遍历 hub 仓库 `projects/*/project.meta.yaml`，为每个项目读取：
- 项目名
- 技术栈（backend / frontend）
- current_version
- 责任人 owners
- linked_repos

同时读取 `projects/*/CHANGELOG.md` 首条记录获得最近变更日期。

### 3. 输出表格

```
## consensus-hub 项目清单

| 项目 | 栈 | 当前版本 | 最近变更 | 产品负责 |
|------|----|----|---------|--------|
| order-center | Java+React | v1.3 | 2026-04-10 | @alice |
| user-portal | Taro | v2.0 | 2026-04-02 | @bob |
```

### 4. 操作提示

> - `/sync-consensus project={name}` — 把最新版镜像拉到当前项目
> - 切到 ai-workflow 仓库执行 `/update-consensus project={name}` 发新版本 PR
> - 打开 hub 仓库：{hub URL}
