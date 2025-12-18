import { ListNode, createFromArray, clone, toArray } from '../models/LinkedList'

/**
 * 变量状态
 */
export interface VariableState {
  name: string
  value: string
  line: number
}

/**
 * 可视化节点
 */
export interface VisualNode {
  id: string
  value: number
  x: number
  y: number
  highlight: 'current' | 'prev' | 'temp' | 'fakeHead' | 'swapping' | null
  // 用于动画的目标位置
  targetX?: number
  targetY?: number
  // 节点在逻辑顺序中的位置索引
  logicalIndex: number
  // 是否是被断开的节点（临时不在链表中）
  isDisconnected?: boolean
}

/**
 * 可视化边
 */
export interface VisualEdge {
  id: string
  sourceId: string
  targetId: string
  isAnimating: boolean
  isNew: boolean
  isRemoving: boolean
  // 边的类型：normal-正常边，changing-正在变化的边
  edgeType?: 'normal' | 'changing' | 'new' | 'removing'
}

/**
 * 指针变化信息
 */
export interface PointerChange {
  from: string  // 源节点ID
  to: string | null  // 目标节点ID，null表示指向null
  label: string  // 指针名称，如 "prev.next", "current.next"
  isNew: boolean  // 是否是新建立的指针
  isRemoving: boolean  // 是否是正在移除的指针
}

/**
 * 动画步骤
 */
export interface AnimationStep {
  stepIndex: number
  description: string
  linkedListHead: ListNode | null
  visualNodes: VisualNode[]
  visualEdges: VisualEdge[]
  highlightLine: number
  variables: VariableState[]
  pointerHighlights: {
    nodeId: string
    pointerType: 'current' | 'prev' | 'temp' | 'fakeHead'
  }[]
  // 指针变化信息，用于动画展示
  pointerChanges?: PointerChange[]
  // 所有节点的引用（包括被断开的节点）
  allNodes?: Map<string, ListNode>
  // 当前步骤的操作类型
  operationType?: 'init' | 'check' | 'pointer-change' | 'swap-complete' | 'move-pointer' | 'return'
}

// Java 代码行号映射（对应 CodePanel 中的 JAVA_CODE）
export const CODE_LINES = {
  METHOD_START: 1,
  CREATE_FAKE_HEAD: 2,
  INIT_CURRENT_PREV: 3,
  WHILE_CONDITION: 4,
  PREV_NEXT_ASSIGN: 5,
  TEMP_ASSIGN: 6,
  CURRENT_NEXT_NEXT: 7,
  CURRENT_NEXT_ASSIGN: 8,
  PREV_ASSIGN: 9,
  CURRENT_ASSIGN: 10,
  WHILE_END: 11,
  RETURN: 12,
  METHOD_END: 13,
}

export const TOTAL_CODE_LINES = 13

/**
 * 格式化节点值用于显示
 */
export function formatNodeValue(node: ListNode | null): string {
  if (node === null) return 'null'
  return `Node(${node.val})`
}

// 可视化常量
const START_X = 100
const SPACING = 120
const Y_NORMAL = 150

/**
 * 收集所有节点到Map中
 */
function collectAllNodes(head: ListNode | null): Map<string, ListNode> {
  const nodeMap = new Map<string, ListNode>()
  const visited = new Set<string>()
  let current = head

  while (current !== null && !visited.has(current.id)) {
    visited.add(current.id)
    nodeMap.set(current.id, current)
    current = current.next
  }

  return nodeMap
}

/**
 * 根据节点的逻辑顺序生成可视化节点
 * @param nodeOrder 节点ID的逻辑顺序数组
 * @param allNodes 所有节点的Map
 * @param highlights 高亮信息
 * @param swappingNodes 正在交换的节点ID集合
 */
function generateVisualNodesFromOrder(
  nodeOrder: string[],
  allNodes: Map<string, ListNode>,
  highlights: Map<string, 'current' | 'prev' | 'temp' | 'fakeHead' | 'swapping'>,
  swappingNodes: Set<string> = new Set()
): VisualNode[] {
  const nodes: VisualNode[] = []

  nodeOrder.forEach((nodeId, index) => {
    const node = allNodes.get(nodeId)
    if (!node) return

    const isSwapping = swappingNodes.has(nodeId)

    nodes.push({
      id: node.id,
      value: node.val,
      x: START_X + index * SPACING,
      y: Y_NORMAL,
      highlight: highlights.get(node.id) || (isSwapping ? 'swapping' : null),
      logicalIndex: index,
      isDisconnected: false,
    })
  })

  return nodes
}

/**
 * 根据节点顺序生成边
 */
function generateVisualEdgesFromOrder(
  nodeOrder: string[],
  changingEdges: Set<string> = new Set(),
  newEdges: Set<string> = new Set(),
  removingEdges: Set<string> = new Set()
): VisualEdge[] {
  const edges: VisualEdge[] = []

  for (let i = 0; i < nodeOrder.length - 1; i++) {
    const sourceId = nodeOrder[i]
    const targetId = nodeOrder[i + 1]
    const edgeId = `edge-${sourceId}-${targetId}`

    edges.push({
      id: edgeId,
      sourceId,
      targetId,
      isAnimating: changingEdges.has(edgeId),
      isNew: newEdges.has(edgeId),
      isRemoving: removingEdges.has(edgeId),
      edgeType: newEdges.has(edgeId) ? 'new' : removingEdges.has(edgeId) ? 'removing' : changingEdges.has(edgeId) ? 'changing' : 'normal',
    })
  }

  return edges
}

/**
 * 计算节点的可视化位置（带循环检测）- 保留用于兼容
 */
function calculateNodePositions(head: ListNode | null): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const visited = new Set<string>()
  let current = head
  let index = 0

  while (current !== null && !visited.has(current.id)) {
    visited.add(current.id)
    positions.set(current.id, { x: START_X + index * SPACING, y: Y_NORMAL })
    current = current.next
    index++
  }

  return positions
}

/**
 * 生成可视化节点列表（带循环检测）- 保留用于兼容
 */
function generateVisualNodes(
  head: ListNode | null,
  highlights: Map<string, 'current' | 'prev' | 'temp' | 'fakeHead' | 'swapping'>
): VisualNode[] {
  const positions = calculateNodePositions(head)
  const nodes: VisualNode[] = []
  const visited = new Set<string>()
  let current = head
  let index = 0

  while (current !== null && !visited.has(current.id)) {
    visited.add(current.id)
    const pos = positions.get(current.id) || { x: 0, y: 0 }
    nodes.push({
      id: current.id,
      value: current.val,
      x: pos.x,
      y: pos.y,
      highlight: highlights.get(current.id) || null,
      logicalIndex: index,
    })
    current = current.next
    index++
  }

  return nodes
}

/**
 * 生成可视化边列表（带循环检测）- 保留用于兼容
 */
function generateVisualEdges(head: ListNode | null): VisualEdge[] {
  const edges: VisualEdge[] = []
  const visited = new Set<string>()
  let current = head

  while (current !== null && current.next !== null && !visited.has(current.id)) {
    visited.add(current.id)
    edges.push({
      id: `edge-${current.id}-${current.next.id}`,
      sourceId: current.id,
      targetId: current.next.id,
      isAnimating: false,
      isNew: false,
      isRemoving: false,
    })
    current = current.next
  }

  return edges
}

/**
 * 算法引擎：生成所有动画步骤
 * 改进版：保持所有节点可见，展示指针变化动画
 */
export function generateSteps(input: number[]): AnimationStep[] {
  const steps: AnimationStep[] = []
  let stepIndex = 0

  // 创建初始链表
  const originalHead = createFromArray(input)

  // 如果链表为空或只有一个节点，直接返回
  if (originalHead === null) {
    steps.push({
      stepIndex: 0,
      description: '链表为空，无需交换',
      linkedListHead: null,
      visualNodes: [],
      visualEdges: [],
      highlightLine: CODE_LINES.RETURN,
      variables: [],
      pointerHighlights: [],
      operationType: 'return',
    })
    return steps
  }

  if (originalHead.next === null) {
    const highlights = new Map<string, 'current' | 'prev' | 'temp' | 'fakeHead' | 'swapping'>()
    steps.push({
      stepIndex: 0,
      description: '链表只有一个节点，无需交换',
      linkedListHead: clone(originalHead),
      visualNodes: generateVisualNodes(originalHead, highlights),
      visualEdges: generateVisualEdges(originalHead),
      highlightLine: CODE_LINES.RETURN,
      variables: [],
      pointerHighlights: [],
      operationType: 'return',
    })
    return steps
  }

  // 创建工作副本并收集所有节点
  const workingHead = clone(originalHead)!
  const allNodes = collectAllNodes(workingHead)
  
  // 维护节点的显示顺序（用于可视化）
  const displayOrder: string[] = []
  let tempCurrent = workingHead
  while (tempCurrent) {
    displayOrder.push(tempCurrent.id)
    tempCurrent = tempCurrent.next!
  }

  // Step 1: 创建 fakeHead
  const fakeHead = new ListNode(0, workingHead, 'fakeHead')
  let current: ListNode | null = workingHead
  let prev: ListNode | null = fakeHead

  // 改进的 addStep 函数：使用 displayOrder 来保持所有节点可见
  const addStep = (
    description: string,
    line: number,
    currentNode: ListNode | null,
    prevNode: ListNode | null,
    tempNode: ListNode | null = null,
    operationType: AnimationStep['operationType'] = 'init',
    swappingNodeIds: string[] = [],
    pointerChanges: PointerChange[] = []
  ) => {
    const highlights = new Map<string, 'current' | 'prev' | 'temp' | 'fakeHead' | 'swapping'>()
    const pointerHighlights: AnimationStep['pointerHighlights'] = []

    if (currentNode) {
      highlights.set(currentNode.id, 'current')
      pointerHighlights.push({ nodeId: currentNode.id, pointerType: 'current' })
    }
    if (prevNode && prevNode.id !== 'fakeHead') {
      highlights.set(prevNode.id, 'prev')
      pointerHighlights.push({ nodeId: prevNode.id, pointerType: 'prev' })
    }
    if (tempNode) {
      highlights.set(tempNode.id, 'temp')
      pointerHighlights.push({ nodeId: tempNode.id, pointerType: 'temp' })
    }
    
    // 标记正在交换的节点
    swappingNodeIds.forEach(id => {
      if (!highlights.has(id)) {
        highlights.set(id, 'swapping')
      }
    })

    // 变量显示在当前高亮行
    const variables: VariableState[] = [
      { name: 'fakeHead', value: formatNodeValue(fakeHead), line },
      { name: 'current', value: formatNodeValue(currentNode), line },
      { name: 'prev', value: formatNodeValue(prevNode), line },
    ]
    if (tempNode !== null || line >= CODE_LINES.TEMP_ASSIGN) {
      variables.push({ name: 'temp', value: formatNodeValue(tempNode), line })
    }

    // 使用 displayOrder 生成可视化节点，确保所有节点都显示
    const swappingSet = new Set(swappingNodeIds)
    const visualNodes = generateVisualNodesFromOrder(displayOrder, allNodes, highlights, swappingSet)
    const visualEdges = generateVisualEdgesFromOrder(displayOrder)

    steps.push({
      stepIndex: stepIndex++,
      description,
      linkedListHead: clone(fakeHead.next),
      visualNodes,
      visualEdges,
      highlightLine: line,
      variables,
      pointerHighlights,
      operationType,
      pointerChanges,
      allNodes: new Map(allNodes),
    })
  }

  // 初始化步骤
  addStep(
    '创建虚拟头节点 fakeHead，初始化 current 指向 head，prev 指向 fakeHead',
    CODE_LINES.CREATE_FAKE_HEAD,
    current,
    prev,
    null,
    'init'
  )

  addStep(
    '初始化 current = head, prev = fakeHead',
    CODE_LINES.INIT_CURRENT_PREV,
    current,
    prev,
    null,
    'init'
  )

  // 主循环
  while (current !== null && current.next !== null) {
    addStep(
      `检查循环条件：current(${formatNodeValue(current)}) != null && current.next(${formatNodeValue(current.next)}) != null`,
      CODE_LINES.WHILE_CONDITION,
      current,
      prev,
      null,
      'check'
    )

    // 保存 nextNode 引用，因为后面会修改指针
    const nextNode: ListNode = current.next!
    const temp: ListNode | null = nextNode.next
    
    // 记录交换前的位置
    const currentIndex = displayOrder.indexOf(current.id)
    const nextIndex = displayOrder.indexOf(nextNode.id)

    // prev.next = current.next - 这一步不改变显示顺序，只是指针变化
    prev.next = nextNode
    addStep(
      `prev.next = current.next：将 prev 的 next 指向 ${formatNodeValue(nextNode)}`,
      CODE_LINES.PREV_NEXT_ASSIGN,
      current,
      prev,
      null,
      'pointer-change',
      [current.id, nextNode.id],
      [{ from: prev.id, to: nextNode.id, label: 'prev.next', isNew: true, isRemoving: false }]
    )

    // temp = current.next.next (已经保存)
    addStep(
      `temp = current.next.next：保存 ${formatNodeValue(temp)} 到临时变量 temp`,
      CODE_LINES.TEMP_ASSIGN,
      current,
      prev,
      temp,
      'pointer-change',
      [current.id, nextNode.id]
    )

    // current.next.next = current (使用 nextNode) - 这是关键的交换步骤
    nextNode.next = current
    
    // 更新显示顺序：交换 current 和 nextNode 的位置
    if (currentIndex !== -1 && nextIndex !== -1) {
      displayOrder[currentIndex] = nextNode.id
      displayOrder[nextIndex] = current.id
    }
    
    addStep(
      `current.next.next = current：将 ${formatNodeValue(nextNode)} 的 next 指向 ${formatNodeValue(current)}，节点位置交换`,
      CODE_LINES.CURRENT_NEXT_NEXT,
      current,
      prev,
      temp,
      'swap-complete',
      [current.id, nextNode.id],
      [{ from: nextNode.id, to: current.id, label: 'nextNode.next', isNew: true, isRemoving: false }]
    )

    // current.next = temp
    current.next = temp
    addStep(
      `current.next = temp：将 ${formatNodeValue(current)} 的 next 指向 ${formatNodeValue(temp)}`,
      CODE_LINES.CURRENT_NEXT_ASSIGN,
      current,
      prev,
      temp,
      'pointer-change',
      [],
      [{ from: current.id, to: temp?.id || null, label: 'current.next', isNew: true, isRemoving: false }]
    )

    // prev = current
    prev = current
    addStep(
      `prev = current：移动 prev 指针到 ${formatNodeValue(current)}`,
      CODE_LINES.PREV_ASSIGN,
      current,
      prev,
      temp,
      'move-pointer'
    )

    // current = temp
    current = temp
    addStep(
      `current = temp：移动 current 指针到 ${formatNodeValue(temp)}`,
      CODE_LINES.CURRENT_ASSIGN,
      current,
      prev,
      temp,
      'move-pointer'
    )
  }

  // 最终检查循环条件
  if (current === null) {
    addStep(
      `循环结束：current 为 null`,
      CODE_LINES.WHILE_CONDITION,
      current,
      prev,
      null,
      'check'
    )
  } else {
    addStep(
      `循环结束：current.next 为 null，只剩一个节点`,
      CODE_LINES.WHILE_CONDITION,
      current,
      prev,
      null,
      'check'
    )
  }

  // 返回结果
  const highlights = new Map<string, 'current' | 'prev' | 'temp' | 'fakeHead' | 'swapping'>()
  const visualNodes = generateVisualNodesFromOrder(displayOrder, allNodes, highlights)
  const visualEdges = generateVisualEdgesFromOrder(displayOrder)
  
  steps.push({
    stepIndex: stepIndex++,
    description: '返回 fakeHead.next，算法完成',
    linkedListHead: clone(fakeHead.next),
    visualNodes,
    visualEdges,
    highlightLine: CODE_LINES.RETURN,
    variables: [
      { name: 'fakeHead.next', value: formatNodeValue(fakeHead.next), line: CODE_LINES.RETURN },
    ],
    pointerHighlights: [],
    operationType: 'return',
  })

  return steps
}

/**
 * 直接执行 swapPairs 算法（用于验证）
 */
export function swapPairs(head: ListNode | null): ListNode | null {
  if (head === null || head.next === null) return head

  const fakeHead = new ListNode(0, head)
  let current: ListNode | null = head
  let prev: ListNode = fakeHead

  while (current !== null && current.next !== null) {
    const nextNode: ListNode = current.next
    prev.next = nextNode
    const temp: ListNode | null = nextNode.next
    nextNode.next = current
    current.next = temp
    prev = current
    current = temp
  }

  return fakeHead.next
}

/**
 * 获取算法执行后的结果数组
 */
export function getExpectedResult(input: number[]): number[] {
  const head = createFromArray(input)
  const result = swapPairs(head)
  return toArray(result)
}
