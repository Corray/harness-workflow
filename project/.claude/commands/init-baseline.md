# /init-baseline

首次接入项目仓库，扫描代码库并初始化分层知识。

## 执行流程

### 1. 扫描代码仓库（本地）
- 检测技术栈：Java（Spring Boot/DDD）/ React / Vue / Taro 等
- 扫描模块结构、主要依赖、API 入口、数据实体
- 直接读取本地文件系统，**不需要 GitHub MCP**

### 2. 初始化分层 knowledge

基于检测到的技术栈自动填充：
- Java 后端 → 填充 `knowledge/backend/` 下的模板
- React/Vue 前端 → 填充 `knowledge/frontend/` 下的模板
- 删除不适用的模板，只保留匹配的

### 3. 保存基线

生成 `docs/baseline/{name}-baseline-{YYYY-MM-DD}.md`，内容包括：
- 项目整体架构
- 主要模块列表
- 核心 API 清单
- 数据模型概览
- 当前依赖版本

### 4. 生成 project.yaml

```yaml
name: {project-name}
stack:
  backend: {java-spring-boot | nodejs | ...}
  frontend: {react | vue | taro | ...}
architecture: {ddd | mvc | ...}
repo:
  main: {git-remote-url}
baseline:
  commit: {git-commit-hash}
  date: {YYYY-MM-DD}
consensus:
  source: ai-workflow/projects/{project-name}/consensus/
  current: {当前使用的共识文档路径}
```

### 5. 人工确认

提示：
> 基线已生成，请检查：
> - knowledge/ 下的模板是否需要补充项目特定的约定
> - docs/baseline/ 中的内容是否准确
> - project.yaml 的信息是否完整
>
> 确认后 git commit 作为接入点。
