# Red Lines — 项目红线

所有角色共享，不可违反。

## 通用红线
1. **禁止魔法值** — 所有常量定义为命名常量或枚举
2. **禁止吞异常** — catch 块必须有日志记录或向上抛出，不允许空 catch
3. **禁止绕过设计** — 实现必须与 `docs/design/` 中的设计对齐，有冲突先 /spec-feedback
4. **禁止跳过自检** — /impl 的 Step E 自检不可跳过

## 后端红线
5. **API 契约一致** — 路径、字段、状态码必须与共识文档一致
6. **字段命名** — 数据库字段 snake_case，Java 字段 camelCase，映射通过框架注解
7. **分层约束** — 业务逻辑不在 Controller 层，Controller 只做请求分发和参数转换
8. **参数校验** — 所有对外接口必须有完整的参数校验（@Valid / 手动校验）
9. **事务边界** — 事务必须显式声明，不依赖默认行为

## 前端红线
10. **组件库唯一** — 只使用项目指定的 UI 组件库，新增第三方库必须评审
11. **API 封装** — 所有接口调用通过统一的 request 模块，不直接 fetch/axios
12. **状态管理** — 遵循项目约定的方案（Redux/Pinia/Context），不混用
13. **路由约束** — 路由定义集中管理，不散落在组件中

## Git 红线
14. Commit message 格式：`{type}: {scope} - {description}`
15. 不得 `--force push` 到共享分支
16. 不得跳过 pre-commit hook

## Journal 红线
17. /impl 必须写 journal（Step F 不可跳过）
18. 发现的问题必须记录，即使当下没解决

## 多 Agent 协作红线

> 详细规范见 `knowledge/collaboration.md`。以下为**硬约束**，触发即 Reject。

19. **禁止用破坏性命令清理陌生 WIP** — 碰到陌生的未提交改动 / 陌生 stash / 来源不明的 reflog，**禁止** `git checkout .` / `git clean -fd` / `git reset --hard` / `rm -rf .git`；必须用 `git stash push -m "others-wip-possibly-from-agent-X"` 带标识暂存再排查。破坏性操作会直接毁掉对方 agent 的数小时工作。
20. **改完立即 commit（小原子单位）** — 不追求"先跑完全套测试再 commit"。缩短未 commit 窗口是多 agent 协作下最有效的污染防护；commit 本身即 checkpoint，测试失败用 `git reset --soft HEAD^` 比"从未 commit 状态恢复"安全得多。
21. **启动前必须跑并发冲突自检** — 新 session / `/impl` 侦察 / `/run-tasks` Step B 必须跑 `git status --porcelain` + `git stash list` + `git reflog -n 10`。任一命中异常必须暂停问人，不得自作主张处理。
