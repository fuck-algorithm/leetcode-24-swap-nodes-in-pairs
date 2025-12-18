/**
 * 链表节点类
 */
export class ListNode {
  id: string
  val: number
  next: ListNode | null

  constructor(val: number = 0, next: ListNode | null = null, id?: string) {
    this.id = id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.val = val
    this.next = next
  }
}

/**
 * 从数组创建链表
 */
export function createFromArray(arr: number[]): ListNode | null {
  if (arr.length === 0) return null

  const head = new ListNode(arr[0], null, `node-0`)
  let current = head

  for (let i = 1; i < arr.length; i++) {
    current.next = new ListNode(arr[i], null, `node-${i}`)
    current = current.next
  }

  return head
}

/**
 * 将链表转换为数组
 */
export function toArray(head: ListNode | null): number[] {
  const result: number[] = []
  let current = head

  while (current !== null) {
    result.push(current.val)
    current = current.next
  }

  return result
}

/**
 * 深拷贝链表（带循环检测）
 */
export function clone(head: ListNode | null): ListNode | null {
  if (head === null) return null

  const nodeMap = new Map<string, ListNode>()
  const visited = new Set<string>()
  let current: ListNode | null = head

  // 第一遍：创建所有节点（带循环检测）
  while (current !== null && !visited.has(current.id)) {
    visited.add(current.id)
    nodeMap.set(current.id, new ListNode(current.val, null, current.id))
    current = current.next
  }

  // 第二遍：连接节点
  visited.clear()
  current = head
  while (current !== null && !visited.has(current.id)) {
    visited.add(current.id)
    const clonedNode = nodeMap.get(current.id)!
    if (current.next !== null && nodeMap.has(current.next.id)) {
      clonedNode.next = nodeMap.get(current.next.id) || null
    }
    current = current.next
  }

  return nodeMap.get(head.id) || null
}

/**
 * 获取链表长度
 */
export function getLength(head: ListNode | null): number {
  let count = 0
  let current = head

  while (current !== null) {
    count++
    current = current.next
  }

  return count
}

/**
 * 获取链表中所有节点的 ID 列表
 */
export function getNodeIds(head: ListNode | null): string[] {
  const ids: string[] = []
  let current = head

  while (current !== null) {
    ids.push(current.id)
    current = current.next
  }

  return ids
}
