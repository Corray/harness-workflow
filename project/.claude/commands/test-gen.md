# /test-gen

根据共识流程 + 设计契约生成测试用例。

## 参数

- `feature`（必填）：功能名

## 执行流程

### 1. 加载上下文
- `knowledge/testing/standards.md`
- `knowledge/red-lines.md`
- `docs/consensus/` 中的业务流程图
- `docs/design/{feature}-*.md`
- 实际代码

### 2. 生成测试用例

#### 单元测试
- 后端：JUnit 5
- 前端：Jest + React Testing Library

#### API 集成测试
- 每个 API 路径
- 每条业务流程路径（正常 + 异常）→ 对应测试用例
- 与契约对齐（字段、状态码、错误码）

### 3. 覆盖原则

每条 Mermaid 流程图路径必须有对应测试：
- 正常流程
- 每个分支
- 每个异常路径

### 4. 输出

生成文件到项目约定的测试目录（如 `src/test/java/`、`tests/`），并列出覆盖情况：

```
## 测试用例覆盖

### API 集成测试（8 条）
- POST /api/xxx — 正常创建
- POST /api/xxx — 缺少必填参数
- POST /api/xxx — 重复提交
...

### 单元测试（15 条）
...
```
