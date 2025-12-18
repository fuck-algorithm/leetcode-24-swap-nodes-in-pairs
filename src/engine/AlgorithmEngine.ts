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

/**
 * 计算节点的可视化位置（带循环检测）
 */
function calculateNodePositions(head: ListNode | null): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const visited = new Set<string>()
  let current = head
  let index = 0
  const startX = 100
  const spacing = 120
  const y = 150

  while (current !== null && !visited.has(current.id)) {
    visited.add(current.id)
    positions.set(current.id, { x: startX + index * spacing, y })
    current = current.next
    index++
  }

  return positions
}

/**
 * 生成可视化节点列表（带循环检测）
 */
function generateVisualNodes(
  head: ListNode | null,
  highlights: Map<string, 'current' | 'prev' | 'temp' | 'fakeHead' | 'swapping'>
): VisualNode[] {
  const positions = calculateNodePositions(head)
  const nodes: VisualNode[] = []
  const visited = new Set<string>()
  let current = head

  while (current !== null && !visited.has(current.id)) {
    visited.add(current.id)
    const pos = positions.get(current.id) || { x: 0, y: 0 }
    nodes.push({
      id: current.id,
      value: current.val,
      x: pos.x,
      y: pos.y,
      highlight: highlights.get(current.id) || null,
    })
    current = current.next
  }

  return nodes
}

/**
 * 生成可视化边列表（带循环检测）
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
    })
    return steps
  }

  // 创建工作副本
  const workingHead = clone(originalHead)!

  // Step 1: 创建 fakeHead
  const fakeHead = new ListNode(0, workingHead, 'fakeHead')
  let current: ListNode | null = workingHead
  let prev: ListNode | null = fakeHead

  const addStep = (
    description: string,
    line: number,
    currentNode: ListNode | null,
    prevNode: ListNode | null,
    tempNode: ListNode | null = null
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

    // 变量显示在当前高亮行
    const variables: VariableState[] = [
      { name: 'fakeHead', value: formatNodeValue(fakeHead), line },
      { name: 'current', value: formatNodeValue(currentNode), line },
      { name: 'prev', value: formatNodeValue(prevNode), line },
    ]
    if (tempNode !== null || line >= CODE_LINES.TEMP_ASSIGN) {
      variables.push({ name: 'temp', value: formatNodeValue(tempNode), line })
    }

    steps.push({
      stepIndex: stepIndex++,
      description,
      linkedListHead: clone(fakeHead.next),
      visualNodes: generateVisualNodes(fakeHead.next, highlights),
      visualEdges: generateVisualEdges(fakeHead.next),
      highlightLine: line,
      variables,
      pointerHighlights,
    })
  }

  // 初始化步骤
  addStep(
    '创建虚拟头节点 fakeHead，初始化 current 指向 head，prev 指向 fakeHead',
    CODE_LINES.CREATE_FAKE_HEAD,
    current,
    prev
  )

  addStep(
    '初始化 current = head, prev = fakeHead',
    CODE_LINES.INIT_CURRENT_PREV,
    current,
    prev
  )

  // 主循环
  while (current !== null && current.next !== null) {
    addStep(
      `检查循环条件：current(${formatNodeValue(current)}) != null && current.next(${formatNodeValue(current.next)}) != null`,
      CODE_LINES.WHILE_CONDITION,
      current,
      prev
    )

    // 保存 nextNode 引用，因为后面会修改指针
    const nextNode: ListNode = current.next!
    const temp: ListNode | null = nextNode.next

    // prev.next = current.next
    prev.next = nextNode
    addStep(
      `prev.next = current.next：将 prev 的 next 指向 current 的下一个节点`,
      CODE_LINES.PREV_NEXT_ASSIGN,
      current,
      prev
    )

    // temp = current.next.next (已经保存)
    addStep(
      `temp = current.next.next：保存 current.next.next 到临时变量`,
      CODE_LINES.TEMP_ASSIGN,
      current,
      prev,
      temp
    )

    // current.next.next = current (使用 nextNode)
    nextNode.next = current
    addStep(
      `current.next.next = current：将 current.next 的 next 指向 current，完成交换`,
      CODE_LINES.CURRENT_NEXT_NEXT,
      current,
      prev,
      temp
    )

    // current.next = temp
    current.next = temp
    addStep(
      `current.next = temp：将 current 的 next 指向 temp`,
      CODE_LINES.CURRENT_NEXT_ASSIGN,
      current,
      prev,
      temp
    )

    // prev = current
    prev = current
    addStep(
      `prev = current：移动 prev 指针`,
      CODE_LINES.PREV_ASSIGN,
      current,
      prev,
      temp
    )

    // current = temp
    current = temp
    addStep(
      `current = temp：移动 current 指针到下一对节点`,
      CODE_LINES.CURRENT_ASSIGN,
      current,
      prev,
      temp
    )
  }

  // 最终检查循环条件
  if (current === null) {
    addStep(
      `循环结束：current 为 null`,
      CODE_LINES.WHILE_CONDITION,
      current,
      prev
    )
  } else {
    addStep(
      `循环结束：current.next 为 null，只剩一个节点`,
      CODE_LINES.WHILE_CONDITION,
      current,
      prev
    )
  }

  // 返回结果
  const highlights = new Map<string, 'current' | 'prev' | 'temp' | 'fakeHead' | 'swapping'>()
  steps.push({
    stepIndex: stepIndex++,
    description: '返回 fakeHead.next，算法完成',
    linkedListHead: clone(fakeHead.next),
    visualNodes: generateVisualNodes(fakeHead.next, highlights),
    visualEdges: generateVisualEdges(fakeHead.next),
    highlightLine: CODE_LINES.RETURN,
    variables: [
      { name: 'fakeHead.next', value: formatNodeValue(fakeHead.next), line: CODE_LINES.RETURN },
    ],
    pointerHighlights: [],
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
