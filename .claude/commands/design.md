# /design

按角色生成详细设计文档，分层加载 knowledge。

## 参数

- `feature`（必填）：功能名称
- `role`（必填）：`backend` 或 `frontend`

## 执行流程

### 1. 按角色加载 knowledge

**role = backend**：
```
加载：.claude/knowledge/backend/* + .claude/knowledge/red-lines.md
跳过：.claude/knowledge/frontend/*、.claude/knowledge/testing/*
```

**role = frontend**：
```
加载：.claude/knowledge/frontend/* + .claude/knowledge/red-lines.md
跳过：.claude/knowledge/backend/*、.claude/knowledge/testing/*
```

### 2. 读取共识与迭代信息
- `docs/consensus/` 中的项目共识
- `docs/design/iterate-{sprint}-*.md` 中的迭代共识

### 3. 生成详细设计

**迭代场景**（已有代码）：
- 只覆盖变更部分
- 新增内容标注"🆕 新增"
- 修改内容标注"✏️ 修改"
- 保留未变更部分的既有描述

**0-1 项目**：
- 完整设计

### 4. 设计文档结构

**后端设计**：
```markdown
# {feature} 后端设计

## 模块划分
## 数据模型（实体 + 迁移）
## 接口设计（路径、请求、响应、状态码）
## 业务逻辑（核心流程、规则）
## 异常处理
## 依赖关系
```

**前端设计**：
```markdown
# {feature} 前端设计

## 页面结构
## 状态管理
## 接口调用
## 组件拆分
## 交互细节
## 异常态处理
```

保存到 `docs/design/{feature}-{role}.md`

### 5. 自动校验一致性

检查设计 vs 共识文档：
- API 路径是否一致？
- 字段定义是否一致？
- 业务逻辑是否偏离共识？

发现冲突 → 提示先更新迭代共识，再继续设计。

### 6. 人工评审

提示：
> 设计已生成，请检查与共识文档的对齐。
> 通过后进入 /impl 阶段。
