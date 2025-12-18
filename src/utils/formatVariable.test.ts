import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { formatVariable, formatArray } from './formatVariable'
import { ListNode } from '../models/LinkedList'

describe('formatVariable', () => {
  it('should format null as "null"', () => {
    expect(formatVariable(null)).toBe('null')
  })

  it('should format node with value 0', () => {
    const node = new ListNode(0)
    expect(formatVariable(node)).toBe('Node(0)')
  })

  it('should format node with value 42', () => {
    const node = new ListNode(42)
    expect(formatVariable(node)).toBe('Node(42)')
  })

  /**
   * **Feature: leetcode-swap-nodes-visualization, Property 7: 变量格式化输出**
   * 
   * *For any* ListNode 或 null 值，formatVariable 函数应该返回 "null"（当值为 null 时）
   * 或 "Node(val)" 格式的字符串（当值为节点时）
   * **Validates: Requirements 3.5**
   */
  describe('Property 7: Variable formatting output', () => {
    it('Property: formatVariable should return valid format for any node', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (val) => {
            const node = new ListNode(val)
            const result = formatVariable(node)
            expect(result).toBe(`Node(${val})`)
            expect(result).toMatch(/^Node\(\d+\)$/)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property: formatVariable should always return "null" for null input', () => {
      expect(formatVariable(null)).toBe('null')
    })
  })
})

describe('formatArray', () => {
  it('should format empty array', () => {
    expect(formatArray([])).toBe('[]')
  })

  it('should format single element array', () => {
    expect(formatArray([1])).toBe('[1]')
  })

  it('should format multiple element array', () => {
    expect(formatArray([1, 2, 3, 4])).toBe('[1, 2, 3, 4]')
  })
})
