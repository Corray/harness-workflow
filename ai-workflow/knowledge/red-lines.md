# Red Lines — 规则中心红线

以下规则不可违反，Claude 在任何情况下都不得绕过。

## 文档红线
1. 不得在未经人工确认的情况下修改或 commit 共识文档
2. 不得删除 `projects/{name}/archive/` 下的任何文件
3. 不得跳过 9 项共识文档中的任何一项
4. 不得在共识文档中使用技术术语（详见 instructions.md 禁用词表）

## 评估红线
5. /eval 不得给出满分（总有改进空间）
6. /eval 发现分数退步时必须突出警示，不得掩盖

## Git 红线
7. commit message 必须遵循 instructions.md 中的格式
8. 不得跳过 pre-commit hook
9. 不得使用 --force push

## 流程红线
10. /update-consensus 不得自动合并，必须人工确认 Change Log
11. /update-rules 不得跨文件批量修改，必须按文件分别确认
