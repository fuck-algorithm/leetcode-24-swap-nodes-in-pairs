import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { createFromArray, toArray, clone, getLength } from './LinkedList'

describe('LinkedList', () => {
  describe('createFromArray', () => {
    it('should create empty list from empty array', () => {
      expect(createFromArray([])).toBeNull()
    })

    it('should create single node from single element array', () => {
      const head = createFromArray([1])
      expect(head).not.toBeNull()
      expect(head!.val).toBe(1)
      expect(head!.next).toBeNull()
    })
  })

  describe('toArray', () => {
    it('should return empty array for null head', () => {
      expect(toArray(null)).toEqual([])
    })
  })

  describe('clone', () => {
    it('should return null for null head', () => {
      expect(clone(null)).toBeNull()
    })
  })

  /**
   * **Feature: leetcode-swap-nodes-visualization, Property 2: 算法结果正确性**
   * 
   * 这里测试链表的基础操作正确性，为算法结果正确性提供基础保证
   * *For any* 输入数组，createFromArray 然后 toArray 应该返回相同的数组
   * **Validates: Requirements 1.1**
   */
  describe('Property Tests', () => {
    it('Property: createFromArray then toArray should return original array (round-trip)', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 0, maxLength: 100 }),
          (arr) => {
            const head = createFromArray(arr)
            const result = toArray(head)
            expect(result).toEqual(arr)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property: clone should create independent copy with same values', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 0, maxLength: 100 }),
          (arr) => {
            const head = createFromArray(arr)
            const cloned = clone(head)
            
            // 值应该相同
            expect(toArray(cloned)).toEqual(arr)
            
            // 如果非空，应该是不同的对象
            if (head !== null && cloned !== null) {
              expect(cloned).not.toBe(head)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property: getLength should equal array length', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 0, maxLength: 100 }),
          (arr) => {
            const head = createFromArray(arr)
            expect(getLength(head)).toBe(arr.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
