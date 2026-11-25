import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  generateSteps,
  swapPairs,
  getExpectedResult,
  TOTAL_CODE_LINES,
  CODE_LINES,
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

    it('preserves node objects while swapping links', () => {
      const head = createFromArray([1, 2, 3, 4])
      const nodes = [head!, head!.next!, head!.next!.next!, head!.next!.next!.next!]
      const result = swapPairs(head)
      expect(result).toBe(nodes[1])
      expect(result?.next).toBe(nodes[0])
      expect(result?.next?.next).toBe(nodes[3])
      expect(result?.next?.next?.next).toBe(nodes[2])
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

    it('gives every step a clear narration, focus and code anchor', () => {
      for (const step of generateSteps([1, 2, 3, 4])) {
        expect(step.operation).toBeTruthy()
        expect(step.narration.trim().length).toBeGreaterThan(10)
        expect(step.anchorIds).toContain(`code-line-${step.highlightLine}`)
        expect(step.focusNodeIds.length).toBeLessThanOrEqual(
          step.operation === 'compare' || step.operation === 'swap' ? 2 : 1,
        )
      }
    })

    it('shows the sentinel head and null endpoint when reconnecting the list', () => {
      const steps = generateSteps([1, 2, 3, 4])
      expect(steps[0].visualNodes.some(node => node.id === 'fakeHead')).toBe(true)
      expect(steps[0].visualEdges.some(edge => edge.sourceId === 'fakeHead')).toBe(true)
      expect(steps.some(step => step.visualNodes.some(node => node.isNull))).toBe(true)
    })
  })

  describe('Property 5: Code line validity', () => {
    it('all steps should have valid highlight line numbers', () => {
      fc.assert(fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 0, maxLength: 10 }),
        arr => {
          for (const step of generateSteps(arr)) {
            expect(step.highlightLine).toBeGreaterThanOrEqual(1)
            expect(step.highlightLine).toBeLessThanOrEqual(TOTAL_CODE_LINES)
          }
        }), { numRuns: 30 })
    })
  })

  describe('Property 6: Variable state consistency', () => {
    it('all steps should have consistent variable states', () => {
      fc.assert(fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 10 }),
        arr => {
          for (const step of generateSteps(arr)) {
            expect(step.variables).toBeDefined()
            for (const variable of step.variables) {
              expect(variable.name).toBeTruthy()
              expect(variable.value).toMatch(/^(null|Node\(\d+\))$/)
              expect(variable.line).toBeGreaterThanOrEqual(1)
              expect(variable.line).toBeLessThanOrEqual(TOTAL_CODE_LINES)
            }
          }
        }), { numRuns: 30 })
    })
  })

  describe('Property 2: Algorithm result correctness', () => {
    it('final step should match swapPairs result', () => {
      fc.assert(fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 0, maxLength: 10 }),
        arr => {
          const steps = generateSteps(arr)
          const lastStep = steps[steps.length - 1]
          expect(lastStep.linkedListHead ? toArray(lastStep.linkedListHead) : []).toEqual(getExpectedResult(arr))
        }), { numRuns: 30 })
    })
  })

  describe('formatNodeValue', () => {
    it('formats null as "null"', () => expect(formatNodeValue(null)).toBe('null'))
    it('formats a node value', () => expect(formatNodeValue(createFromArray([42]))).toBe('Node(42)'))
  })

  it('keeps the Java return line mapping stable', () => expect(CODE_LINES.RETURN).toBe(12))
})
