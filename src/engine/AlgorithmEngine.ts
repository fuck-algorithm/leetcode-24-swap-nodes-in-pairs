import { ListNode, createFromArray, clone, toArray } from '../models/LinkedList'

export interface VariableState {
  name: string
  value: string
  line: number
}

export interface VisualNode {
  id: string
  value: number
  x: number
  y: number
  highlight: 'current' | 'prev' | 'temp' | 'fakeHead' | 'swapping' | null
  targetX?: number
  targetY?: number
  logicalIndex: number
  isSentinel?: boolean
  isNull?: boolean
  displayLabel?: string
  pointerLabels?: string[]
  isDisconnected?: boolean
}

export interface VisualEdge {
  id: string
  sourceId: string
  targetId: string
  isAnimating: boolean
  isNew: boolean
  isRemoving: boolean
  edgeType?: 'normal' | 'changing' | 'new' | 'removing'
  label?: string
}

export interface PointerChange {
  from: string
  to: string | null
  label: string
  isNew: boolean
  isRemoving: boolean
}

export type StepOperation = 'init' | 'read' | 'compare' | 'swap' | 'move' | 'return' | 'done'

export interface AnimationStep {
  stepIndex: number
  description: string
  operation: StepOperation
  narration: string
  anchorIds: string[]
  focusNodeIds: string[]
  linkedListHead: ListNode | null
  visualNodes: VisualNode[]
  visualEdges: VisualEdge[]
  highlightLine: number
  variables: VariableState[]
  pointerHighlights: {
    nodeId: string
    pointerType: 'current' | 'prev' | 'temp' | 'fakeHead'
  }[]
  pointerChanges?: PointerChange[]
  allNodes?: Map<string, ListNode>
  operationType?: 'init' | 'check' | 'pointer-change' | 'swap-complete' | 'move-pointer' | 'return'
}

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

export function formatNodeValue(node: ListNode | null): string {
  if (node === null) return 'null'
  return `Node(${node.val})`
}

const START_X = 100
const SPACING = 120
const Y_NORMAL = 150

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

function generateVisualNodesFromOrder(
  nodeOrder: string[],
  allNodes: Map<string, ListNode>,
  highlights: Map<string, 'current' | 'prev' | 'temp' | 'fakeHead' | 'swapping'>,
  pointerTargets: Map<string, string[]> = new Map(),
  swappingNodes: Set<string> = new Set(),
  includeFakeHead = false,
  includeNullTail = false,
): VisualNode[] {
  const nodes: VisualNode[] = []

  if (includeFakeHead) {
    nodes.push({
      id: 'fakeHead', value: 0, x: START_X - SPACING, y: Y_NORMAL,
      highlight: highlights.has('fakeHead') ? 'fakeHead' : null,
      logicalIndex: -1, isSentinel: true, displayLabel: '虚拟头',
      pointerLabels: pointerTargets.get('fakeHead') || [],
    })
  }

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
      pointerLabels: pointerTargets.get(node.id) || [],
    })
  })

  if (includeNullTail) {
    nodes.push({
      id: 'null-tail', value: 0, x: START_X + nodeOrder.length * SPACING, y: Y_NORMAL,
      highlight: null, logicalIndex: nodeOrder.length, isNull: true, displayLabel: 'null',
    })
  }

  return nodes
}

function generateVisualEdgesFromOrder(
  nodeOrder: string[],
  changingEdges: Set<string> = new Set(),
  newEdges: Set<string> = new Set(),
  removingEdges: Set<string> = new Set(),
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
      label: 'next',
    })
  }

  return edges
}

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

function generateVisualNodes(
  head: ListNode | null,
  highlights: Map<string, 'current' | 'prev' | 'temp' | 'fakeHead' | 'swapping'>,
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
      label: `${current.val} → ${current.next.val}`,
    })
    current = current.next
  }

  return edges
}

export function generateSteps(input: number[]): AnimationStep[] {
  const steps: AnimationStep[] = []
  let stepIndex = 0
  const originalHead = createFromArray(input)

  if (originalHead === null) {
    steps.push({
      stepIndex: 0,
      description: '链表为空，无需交换',
      operation: 'done',
      narration: '没有节点可交换，因此直接返回空链表。',
      anchorIds: [`code-line-${CODE_LINES.RETURN}`],
      focusNodeIds: [],
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
      operation: 'done',
      narration: '只剩一个节点无法组成节点对，因此保留原顺序并返回。',
      anchorIds: [`code-line-${CODE_LINES.RETURN}`],
      focusNodeIds: [originalHead.id],
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

  const workingHead = clone(originalHead)!
  const allNodes = collectAllNodes(workingHead)
  const displayOrder: string[] = []
  let tempCurrent = workingHead
  while (tempCurrent) {
    displayOrder.push(tempCurrent.id)
    tempCurrent = tempCurrent.next!
  }

  const fakeHead = new ListNode(0, workingHead, 'fakeHead')
  let current: ListNode | null = workingHead
  let prev: ListNode | null = fakeHead

  const addStep = (
    description: string,
    line: number,
    currentNode: ListNode | null,
    prevNode: ListNode | null,
    tempNode: ListNode | null = null,
    operationType: AnimationStep['operationType'] = 'init',
    swappingNodeIds: string[] = [],
    pointerChanges: PointerChange[] = [],
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
    swappingNodeIds.forEach(id => {
      if (!highlights.has(id)) highlights.set(id, 'swapping')
    })

    const variables: VariableState[] = [
      { name: 'fakeHead', value: formatNodeValue(fakeHead), line },
      { name: 'current', value: formatNodeValue(currentNode), line },
      { name: 'prev', value: formatNodeValue(prevNode), line },
    ]
    if (tempNode !== null || line >= CODE_LINES.TEMP_ASSIGN) {
      variables.push({ name: 'temp', value: formatNodeValue(tempNode), line })
    }

    const operation: StepOperation = operationType === 'init' ? 'init'
      : operationType === 'check' ? 'compare'
        : operationType === 'swap-complete' ? 'swap'
          : operationType === 'move-pointer' ? 'move'
            : 'read'
    const focusNodeIds = operationType === 'check'
      ? [currentNode?.id, currentNode?.next?.id].filter((id): id is string => Boolean(id))
      : operationType === 'pointer-change' && pointerChanges.length > 0
        ? [pointerChanges[pointerChanges.length - 1].to].filter((id): id is string => Boolean(id))
        : operationType === 'swap-complete' && pointerChanges.length > 0
          ? [pointerChanges[pointerChanges.length - 1].from, pointerChanges[pointerChanges.length - 1].to].filter((id): id is string => Boolean(id))
          : [currentNode?.id || tempNode?.id || prevNode?.id].filter((id): id is string => Boolean(id))

    const pointerTargets = new Map<string, string[]>()
    for (const [name, target] of [['prev', prevNode], ['current', currentNode], ['temp', tempNode]] as const) {
      if (target) pointerTargets.set(target.id, [...(pointerTargets.get(target.id) || []), name])
    }

    const visualNodes = generateVisualNodesFromOrder(
      displayOrder,
      allNodes,
      highlights,
      pointerTargets,
      new Set(swappingNodeIds),
      true,
      pointerChanges.some(change => change.to === null),
    )
    const visualEdges = generateVisualEdgesFromOrder(displayOrder)
    if (pointerChanges.some(change => change.to === null)) {
      const tailNodeId = displayOrder[displayOrder.length - 1]
      if (tailNodeId) visualEdges.push({
        id: `edge-${tailNodeId}-null-tail`, sourceId: tailNodeId, targetId: 'null-tail',
        isAnimating: true, isNew: true, isRemoving: false, edgeType: 'new', label: '接回 null',
      })
    }

    const prefixNodeId = prevNode?.id || 'fakeHead'
    const prefixTargetId = prevNode?.id === 'fakeHead' ? fakeHead.next?.id : prevNode?.next?.id
    if (prefixTargetId) {
      const prefixEdgeIndex = visualEdges.findIndex(edge => edge.sourceId === prefixNodeId)
      if (prefixEdgeIndex >= 0) visualEdges.splice(prefixEdgeIndex, 1)
      visualEdges.unshift({
        id: `edge-${prefixNodeId}-${prefixTargetId}`,
        sourceId: prefixNodeId,
        targetId: prefixTargetId,
        isAnimating: false,
        isNew: false,
        isRemoving: false,
        edgeType: 'normal',
        label: `前驱接到 ${allNodes.get(prefixTargetId)?.val}`,
      })
    }

    for (const change of pointerChanges) {
      if (!change.to) continue
      const edgeId = `edge-${change.from}-${change.to}`
      if (!visualEdges.some(edge => edge.id === edgeId)) {
        visualEdges.push({
          id: edgeId,
          sourceId: change.from,
          targetId: change.to,
          isAnimating: true,
          isNew: change.isNew,
          isRemoving: false,
          edgeType: 'new',
          label: `${change.label} → ${allNodes.get(change.to)?.val ?? 'null'}`,
        })
      }
    }
    if (operationType === 'pointer-change' && pointerChanges.length > 0) {
      const change = pointerChanges[pointerChanges.length - 1]
      const edgeIndex = visualEdges.findIndex(edge => edge.sourceId === change.from && edge.targetId !== change.to)
      if (edgeIndex >= 0) visualEdges[edgeIndex] = { ...visualEdges[edgeIndex], isRemoving: true, edgeType: 'removing' }
      const newEdge = visualEdges.find(edge => edge.sourceId === change.from && edge.targetId === change.to)
      if (newEdge) newEdge.label = `${change.label} 改指向`
    }

    steps.push({
      stepIndex: stepIndex++,
      description,
      operation,
      narration: description,
      anchorIds: [`code-line-${line}`],
      focusNodeIds: focusNodeIds.filter(id => id !== 'fakeHead'),
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

  addStep(
    '先放入虚拟头节点，给链表前面加一个固定的“接头点”。',
    CODE_LINES.CREATE_FAKE_HEAD,
    current,
    prev,
    null,
    'init',
  )
  addStep(
    'current 站在第一个待交换节点，prev 站在它前面的接头点。',
    CODE_LINES.INIT_CURRENT_PREV,
    current,
    prev,
    null,
    'init',
  )

  while (current !== null && current.next !== null) {
    addStep(
      `先看能不能凑成一对：从 ${current.val} 开始，后面还有 ${current.next.val}，所以可以交换。`,
      CODE_LINES.WHILE_CONDITION,
      current,
      prev,
      null,
      'check',
    )

    const nextNode: ListNode = current.next
    const temp: ListNode | null = nextNode.next
    const currentIndex = displayOrder.indexOf(current.id)
    const nextIndex = displayOrder.indexOf(nextNode.id)

    prev!.next = nextNode
    addStep(
      `先改前面的接头：让 ${formatNodeValue(prev)} 指向第二个节点 ${nextNode.val}；第一个节点还没丢。`,
      CODE_LINES.PREV_NEXT_ASSIGN,
      current,
      prev,
      null,
      'pointer-change',
      [current.id, nextNode.id],
      [{ from: prev!.id, to: nextNode.id, label: 'prev.next', isNew: true, isRemoving: false }],
    )

    addStep(
      temp === null
        ? '先把后面的链表记在 temp：第二个节点后面是 null，交换后要接回 null。'
        : `先把后面的链表记在 temp：temp 暂存节点 ${temp.val}，等会儿接回去。`,
      CODE_LINES.TEMP_ASSIGN,
      current,
      prev,
      temp,
      'pointer-change',
      [current.id, nextNode.id],
    )

    nextNode.next = current
    if (currentIndex !== -1 && nextIndex !== -1) {
      displayOrder[currentIndex] = nextNode.id
      displayOrder[nextIndex] = current.id
    }
    addStep(
      `把第一对反过来：让第二个节点 ${nextNode.val} 指回第一个节点 ${current.val}。`,
      CODE_LINES.CURRENT_NEXT_NEXT,
      current,
      prev,
      temp,
      'swap-complete',
      [current.id, nextNode.id],
      [{ from: nextNode.id, to: current.id, label: 'nextNode.next', isNew: true, isRemoving: false }],
    )

    current.next = temp
    addStep(
      temp === null
        ? `把交换好的这对接回结尾：${current.val} 现在指向 null，链表到这里结束。`
        : `把交换好的这对接回后半段：${current.val} 指向暂存的节点 ${temp.val}，没有跳过后面的节点。`,
      CODE_LINES.CURRENT_NEXT_ASSIGN,
      current,
      prev,
      temp,
      'pointer-change',
      [],
      [{ from: current.id, to: temp?.id || null, label: 'current.next', isNew: true, isRemoving: false }],
    )

    prev = current
    addStep(
      `这一对已经排好：prev 移到节点 ${current.val}，为下一对找到前面的接头。`,
      CODE_LINES.PREV_ASSIGN,
      current,
      prev,
      temp,
      'move-pointer',
    )

    current = temp
    addStep(
      temp === null
        ? '后面没有节点了：current 到达 null，算法可以结束。'
        : `current 跳到下一对的开头 ${temp.val}，从这里继续重复同样三次改线。`,
      CODE_LINES.CURRENT_ASSIGN,
      current,
      prev,
      temp,
      'move-pointer',
    )
  }

  if (current === null) {
    addStep('current 已到 null，没有完整节点对剩下，交换结束。', CODE_LINES.WHILE_CONDITION, current, prev, null, 'check')
  } else {
    addStep(`只剩节点 ${current.val}，后面没有第二个节点配对，所以它保持原位。`, CODE_LINES.WHILE_CONDITION, current, prev, null, 'check')
  }

  const highlights = new Map<string, 'current' | 'prev' | 'temp' | 'fakeHead' | 'swapping'>()
  const visualNodes = generateVisualNodesFromOrder(displayOrder, allNodes, highlights)
  const visualEdges = generateVisualEdgesFromOrder(displayOrder)
  steps.push({
    stepIndex: stepIndex++,
    description: '返回 fakeHead.next，算法完成',
    operation: 'done',
    narration: '所有相邻节点对都已交换，因此从 fakeHead.next 返回新的链表头。',
    anchorIds: [`code-line-${CODE_LINES.RETURN}`],
    focusNodeIds: displayOrder.slice(0, 1),
    linkedListHead: clone(fakeHead.next),
    visualNodes,
    visualEdges,
    highlightLine: CODE_LINES.RETURN,
    variables: [{ name: 'fakeHead.next', value: formatNodeValue(fakeHead.next), line: CODE_LINES.RETURN }],
    pointerHighlights: [],
    operationType: 'return',
  })

  return steps
}

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

export function getExpectedResult(input: number[]): number[] {
  const head = createFromArray(input)
  const result = swapPairs(head)
  return toArray(result)
}
