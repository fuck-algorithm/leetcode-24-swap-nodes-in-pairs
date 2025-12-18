import { ListNode } from '../models/LinkedList'

/**
 * 格式化变量值用于显示
 * - null 显示为 "null"
 * - 节点显示为 "Node(val)"
 */
export function formatVariable(value: ListNode | null): string {
  if (value === null) {
    return 'null'
  }
  return `Node(${value.val})`
}

/**
 * 格式化数组用于显示
 */
export function formatArray(arr: number[]): string {
  return `[${arr.join(', ')}]`
}

/**
 * 格式化指针名称
 */
export function formatPointerName(name: string): string {
  const pointerNames: Record<string, string> = {
    current: 'current',
    prev: 'prev',
    temp: 'temp',
    fakeHead: 'fakeHead',
  }
  return pointerNames[name] || name
}
