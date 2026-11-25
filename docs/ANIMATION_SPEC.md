# 动画方案：24. 两两交换链表中的节点

## 可观察状态
- 主结构：节点身份和 `next` 边；所有节点 ID 在整段动画中保持稳定，值重复时也不合并。
- 指针：`fakeHead`、`prev`、`current`、`temp`，通过节点上方短标签呈现；null 用文字/空指针标记。
- 代码：`highlightLine` 对应 Java 代码行，变量监视仅展示当前执行行的变量。

## 步骤设计
每个 `AnimationStep` 都包含 operation、narration、anchorIds。步骤快照由算法引擎生成，播放器只回放快照。

| 操作 | 教学含义 | 焦点 | 代码锚点 |
| --- | --- | --- | --- |
| init | 建立虚拟头与起始指针 | 当前首节点 | code-line-2/3 |
| compare | 确认 current 与后继能组成一对 | 至多两个候选节点 | code-line-4 |
| read | 保存后续节点，避免改链后丢失 | current、temp | code-line-5/6 |
| swap | 反转一对节点的连接顺序 | 被交换的节点 | code-line-7/8 |
| move | 将 prev/current 推进到下一对 | 新指针位置 | code-line-9/10 |
| done | 返回新链表头 | 最终链表 | code-line-12 |

## 坐标与身份规则
- 横向链表按逻辑顺序布局，x = 100 + index × 120，y = 150。
- 节点以原始节点 ID 做 D3 keyed join；值不是身份。节点逻辑位置只随指针交换步骤按列表顺序更新，主画布依据当前可见节点范围居中。
- 边 ID 由 source/target 节点 ID 组成；节点、边分别 keyed join，不整屏删除重建。
- 移动/状态动效为 360ms，尊重 `prefers-reduced-motion` 并关闭过渡。

## 教学层与验收要点
- 每帧一个语义操作徽标、一句解释性解说，至少一个代码行锚点。
- 保持稳定状态图例、节点指针标签与变量监视；空链表明确显示空状态。
- 覆盖偶数、奇数、单节点、空链表及重复值；检查跳步和回退时节点身份/代码行一致。
