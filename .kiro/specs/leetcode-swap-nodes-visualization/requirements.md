# Requirements Document

## Introduction

本项目是一个教学目的的算法可视化应用，用于分步骤、分镜头演示 LeetCode 第 24 题「两两交换链表中的节点」的算法原理。项目使用 TypeScript + React + D3.js 实现，部署在 GitHub Pages 上。用户可以通过交互式界面逐步观察链表节点交换的过程，同时查看代码执行状态和变量值变化。

## Glossary

- **LinkedList（链表）**: 一种线性数据结构，由节点组成，每个节点包含数据和指向下一个节点的指针
- **ListNode（链表节点）**: 链表中的单个元素，包含 val（值）和 next（下一节点指针）属性
- **SwapPairs（两两交换）**: 将链表中相邻的两个节点进行位置交换的操作
- **AnimationStep（动画步骤）**: 算法执行过程中的一个离散状态，包含当前链表状态、高亮节点、变量值等信息
- **ControlPanel（控制面板）**: 用户界面中用于控制动画播放的组件，包含播放、暂停、上一步、下一步等按钮
- **CodeHighlight（代码高亮）**: 在代码展示区域标记当前执行行的视觉效果
- **VariableInspector（变量检查器）**: 显示当前执行步骤中各变量内存值的组件

## Requirements

### Requirement 1: 链表可视化展示

**User Story:** As a 学习者, I want to 看到链表的图形化展示, so that 我能直观理解链表的结构和节点之间的连接关系。

#### Acceptance Criteria

1. WHEN 页面加载完成 THEN the System SHALL 使用 D3.js 渲染链表节点为圆形或矩形元素，并显示节点的 val 值
2. WHEN 链表包含多个节点 THEN the System SHALL 使用箭头或连线展示节点之间的 next 指针关系
3. WHEN 算法执行过程中指针发生变化 THEN the System SHALL 通过动画效果展示指针的重新指向
4. WHEN 当前步骤涉及特定节点 THEN the System SHALL 使用不同颜色高亮显示 current、prev、temp 等指针指向的节点
5. WHEN 节点位置发生交换 THEN the System SHALL 通过平滑动画展示节点位置的移动过程

### Requirement 2: 算法步骤控制

**User Story:** As a 学习者, I want to 控制算法演示的播放进度, so that 我能按自己的节奏学习每一步的操作。

#### Acceptance Criteria

1. WHEN 用户点击「下一步」按钮或按下键盘右方向键 THEN the System SHALL 执行算法的下一个步骤并更新可视化状态
2. WHEN 用户点击「上一步」按钮或按下键盘左方向键 THEN the System SHALL 回退到算法的上一个步骤并恢复之前的可视化状态
3. WHEN 用户点击「播放」按钮或按下空格键 THEN the System SHALL 自动按固定时间间隔连续执行算法步骤
4. WHEN 用户在播放状态下点击「暂停」按钮或按下空格键 THEN the System SHALL 停止自动播放并保持当前状态
5. WHEN 算法执行到最后一步 THEN the System SHALL 禁用「下一步」按钮并显示完成状态
6. WHEN 算法处于第一步 THEN the System SHALL 禁用「上一步」按钮
7. WHEN 控制按钮渲染完成 THEN the System SHALL 在按钮上显示对应的快捷键提示文案

### Requirement 3: 代码展示与调试效果

**User Story:** As a 学习者, I want to 看到算法代码并了解当前执行到哪一行, so that 我能将可视化效果与代码逻辑对应起来。

#### Acceptance Criteria

1. WHEN 页面加载完成 THEN the System SHALL 展示算法的 Java 代码并应用语法高亮
2. WHEN 算法执行到某一步骤 THEN the System SHALL 高亮显示当前正在执行的代码行
3. WHEN 变量值发生变化 THEN the System SHALL 在对应变量所在代码行的右侧显示该变量的当前内存值
4. WHEN 多个变量在同一行 THEN the System SHALL 依次显示所有相关变量的值
5. WHEN 变量值为 null 或节点引用 THEN the System SHALL 以可读格式显示（如 "null" 或 "Node(val)"）

### Requirement 4: 页面布局与导航

**User Story:** As a 用户, I want to 快速了解当前页面内容并访问相关资源, so that 我能获取更多学习资料和参与社区交流。

#### Acceptance Criteria

1. WHEN 页面加载完成 THEN the System SHALL 显示与力扣题目一致的标题「24. 两两交换链表中的节点」
2. WHEN 用户点击页面标题 THEN the System SHALL 在新标签页打开力扣题目详情页面
3. WHEN 页面加载完成 THEN the System SHALL 在页面右上角显示 GitHub 徽标图标
4. WHEN 用户点击 GitHub 徽标 THEN the System SHALL 在新标签页打开项目的 GitHub 仓库页面
5. WHEN 页面加载完成 THEN the System SHALL 在页面右下角显示一个带有「交流群」字样的微信群悬浮球图标
6. WHEN 用户将鼠标悬停在悬浮球上 THEN the System SHALL 显示微信群二维码图片并提示用户扫码发送「leetcode」加入算法交流群
7. WHEN 显示微信群二维码 THEN the System SHALL 保持图片原有宽高比例不变形

### Requirement 5: 项目部署与自动化

**User Story:** As a 开发者, I want to 代码提交后自动部署到 GitHub Pages, so that 我能快速发布更新而无需手动操作。

#### Acceptance Criteria

1. WHEN 代码推送到主分支 THEN the GitHub Action SHALL 自动触发构建和部署流程
2. WHEN 构建过程执行 THEN the GitHub Action SHALL 检查 TypeScript 编译错误和 linter 错误
3. WHEN 构建成功且无错误 THEN the GitHub Action SHALL 将构建产物部署到 GitHub Pages
4. IF 构建过程中出现编译错误或 linter 错误 THEN the GitHub Action SHALL 终止部署并报告错误详情

### Requirement 6: 输入数据管理

**User Story:** As a 学习者, I want to 使用不同的测试用例观察算法行为, so that 我能理解算法在各种情况下的表现。

#### Acceptance Criteria

1. WHEN 页面加载完成 THEN the System SHALL 使用默认测试用例 [1,2,3,4] 初始化链表
2. WHEN 用户选择不同的预设测试用例 THEN the System SHALL 重置链表状态并从头开始演示
3. WHEN 测试用例为空数组 THEN the System SHALL 正确处理并显示空链表状态
4. WHEN 测试用例只有一个元素 THEN the System SHALL 正确处理并显示单节点链表（无需交换）

