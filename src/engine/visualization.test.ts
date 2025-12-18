import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { generateSteps } from './AlgorithmEngine'

/**
 * **Feature: leetcode-swap-nodes-visualization, Property 1: 链表渲染一致性**
 * 
 * *For any* 输入数组，渲染生成的可视化节点数量应该等于数组长度，
 * 且每个节点的 value 应该与数组对应位置的值一致；
 * 边的数量应该等于节点数量减 1（非空链表情况下）
 * **Validates: Requirements 1.1, 1.2**
 */
describe('Property 1: Linked list rendering consistency', () => {
  it('Property: initial step should have correct number of visual nodes', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 0, maxLength: 10 }),
        (arr) => {
          const steps = generateSteps(arr)
          const firstStep = steps[0]
          
          // 节点数量应该等于数组长度
          expect(firstStep.visualNodes.length).toBe(arr.length)
          
          // 每个节点的值应该与数组对应位置的值一致
          if (arr.length > 0) {
            const nodeValues = firstStep.visualNodes.map(n => n.value)
            expect(nodeValues).toEqual(arr)
          }
        }
      ),
      { numRuns: 30 }
    )
  })

  it('Property: edges count should be nodes count minus 1 for non-empty list', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 10 }),
        (arr) => {
          const steps = generateSteps(arr)
          const firstStep = steps[0]
          
          // 边的数量应该等于节点数量减 1
          expect(firstStep.visualEdges.length).toBe(Math.max(0, arr.length - 1))
        }
      ),
      { numRuns: 30 }
    )
  })

  it('Property: empty array should have no nodes and no edges', () => {
    const steps = generateSteps([])
    const firstStep = steps[0]
    
    expect(firstStep.visualNodes.length).toBe(0)
    expect(firstStep.visualEdges.length).toBe(0)
  })
})

/**
 * **Feature: leetcode-swap-nodes-visualization, Property 9: 节点高亮正确性**
 * 
 * *For any* 动画步骤，visualNodes 中有高亮标记的节点应该有有效的高亮类型
 * **Validates: Requirements 1.4**
 */
describe('Property 9: Node highlight correctness', () => {
  it('Property: highlighted nodes should have valid highlight types', () => {
    const validHighlightTypes = ['current', 'prev', 'temp', 'fakeHead', 'swapping', null]
    
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 10 }),
        (arr) => {
          const steps = generateSteps(arr)
          
          for (const step of steps) {
            for (const node of step.visualNodes) {
              expect(validHighlightTypes).toContain(node.highlight)
            }
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  it('Property: pointerHighlights should reference valid pointer types', () => {
    const validPointerTypes = ['current', 'prev', 'temp', 'fakeHead']
    
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 10 }),
        (arr) => {
          const steps = generateSteps(arr)
          
          for (const step of steps) {
            for (const highlight of step.pointerHighlights) {
              expect(validPointerTypes).toContain(highlight.pointerType)
            }
          }
        }
      ),
      { numRuns: 20 }
    )
  })
})
