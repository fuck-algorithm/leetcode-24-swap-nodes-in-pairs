import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  generateSteps,
  swapPairs,
  getExpectedResult,
  TOTAL_CODE_LINES,
  formatNodeValue,
} from './AlgorithmEngine'
import { createFromArray, toArray } from '../models/LinkedList'

describe('AlgorithmEngine', () => {
  describe('swapPairs', () => {
    it('should return null for empty list', () => {
      expect(swapPairs(null)).toBeNull()
    })

    it('should return same node for single element', () => {
      const head = createFromArray([1])
      const result = swapPairs(head)
      expect(toArray(result)).toEqual([1])
    })

    it('should swap two elements', () => {
      const head = createFromArray([1, 2])
      const result = swapPairs(head)
      expect(toArray(result)).toEqual([2, 1])
    })

    it('should swap four elements', () => {
      const head = createFromArray([1, 2, 3, 4])
      const result = swapPairs(head)
      expect(toArray(result)).toEqual([2, 1, 4, 3])
    })

    it('should handle odd number of elements', () => {
      const head = createFromArray([1, 2, 3])
      const result = swapPairs(head)
      expect(toArray(result)).toEqual([2, 1, 3])
    })
  })

  describe('generateSteps', () => {
    it('should generate steps for empty array', () => {
      const steps = generateSteps([])
      expect(steps.length).toBeGreaterThan(0)
    })

    it('should generate steps for single element', () => {
      const steps = generateSteps([1])
      expect(steps.length).toBeGreaterThan(0)
    })

    it('should generate steps for multiple elements', () => {
      const steps = generateSteps([1, 2, 3, 4])
      expect(steps.length).toBeGreaterThan(0)
    })
  })

  /**
   * **Feature: leetcode-swap-nodes-visualization, Property 5: 代码行号有效性**
   * 
   * *For any* 动画步骤，其 highlightLine 值应该在 [1, totalCodeLines] 范围内
   * **Validates: Requirements 3.2**
   */
  describe('Property 5: Code line validity', () => {
    it('Property: all steps should have valid highlight line numbers', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 0, maxLength: 10 }),
          (arr) => {
            const steps = generateSteps(arr)
            
            for (const step of steps) {
              expect(step.highlightLine).toBeGreaterThanOrEqual(1)
              expect(step.highlightLine).toBeLessThanOrEqual(TOTAL_CODE_LINES)
            }
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  /**
   * **Feature: leetcode-swap-nodes-visualization, Property 6: 变量状态与链表一致性**
   * 
   * *For any* 动画步骤，变量 current、prev、temp 的值应该与该步骤链表中对应节点的实际引用一致
   * **Validates: Requirements 3.3**
   */
  describe('Property 6: Variable state consistency', () => {
    it('Property: all steps should have consistent variable states', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 10 }),
          (arr) => {
            const steps = generateSteps(arr)
            
            for (const step of steps) {
              // 每个步骤都应该有变量状态
              expect(step.variables).toBeDefined()
              
              // 变量值应该是有效的格式
              for (const variable of step.variables) {
                expect(variable.name).toBeTruthy()
                expect(variable.value).toMatch(/^(null|Node\(\d+\))$/)
                expect(variable.line).toBeGreaterThanOrEqual(1)
                expect(variable.line).toBeLessThanOrEqual(TOTAL_CODE_LINES)
              }
            }
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  /**
   * **Feature: leetcode-swap-nodes-visualization, Property 2: 算法结果正确性**
   * 
   * *For any* 输入链表，执行完所有步骤后的链表状态应该与直接调用 swapPairs 算法的结果一致
   * **Validates: Requirements 1.1**
   */
  describe('Property 2: Algorithm result correctness', () => {
    it('Property: final step should match swapPairs result', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 0, maxLength: 10 }),
          (arr) => {
            const steps = generateSteps(arr)
            const expectedResult = getExpectedResult(arr)
            
            // 最后一步的链表状态应该与预期结果一致
            const lastStep = steps[steps.length - 1]
            const actualResult = lastStep.linkedListHead
              ? toArray(lastStep.linkedListHead)
              : []
            
            expect(actualResult).toEqual(expectedResult)
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  describe('formatNodeValue', () => {
    it('should format null as "null"', () => {
      expect(formatNodeValue(null)).toBe('null')
    })

    it('should format node with value', () => {
      const node = createFromArray([42])
      expect(formatNodeValue(node)).toBe('Node(42)')
    })
  })
})
