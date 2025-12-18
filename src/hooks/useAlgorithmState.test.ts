import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import * as fc from 'fast-check'
import { useAlgorithmState } from './useAlgorithmState'

describe('useAlgorithmState', () => {
  it('should initialize with default test case', () => {
    const { result } = renderHook(() => useAlgorithmState())
    
    expect(result.current.testCase).toEqual([1, 2, 3, 4])
    expect(result.current.currentStep).toBe(0)
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.steps.length).toBeGreaterThan(0)
  })

  it('should go to next step', () => {
    const { result } = renderHook(() => useAlgorithmState())
    
    act(() => {
      result.current.nextStep()
    })
    
    expect(result.current.currentStep).toBe(1)
  })

  it('should go to previous step', () => {
    const { result } = renderHook(() => useAlgorithmState())
    
    act(() => {
      result.current.nextStep()
      result.current.nextStep()
      result.current.prevStep()
    })
    
    expect(result.current.currentStep).toBe(1)
  })

  it('should not go below step 0', () => {
    const { result } = renderHook(() => useAlgorithmState())
    
    act(() => {
      result.current.prevStep()
    })
    
    expect(result.current.currentStep).toBe(0)
  })

  it('should not go beyond last step', () => {
    const { result } = renderHook(() => useAlgorithmState())
    const totalSteps = result.current.totalSteps
    
    act(() => {
      for (let i = 0; i < totalSteps + 5; i++) {
        result.current.nextStep()
      }
    })
    
    expect(result.current.currentStep).toBe(totalSteps - 1)
  })

  it('should reset to step 0', () => {
    const { result } = renderHook(() => useAlgorithmState())
    
    act(() => {
      result.current.nextStep()
      result.current.nextStep()
      result.current.reset()
    })
    
    expect(result.current.currentStep).toBe(0)
    expect(result.current.isPlaying).toBe(false)
  })

  it('should toggle play state', () => {
    const { result } = renderHook(() => useAlgorithmState())
    
    expect(result.current.isPlaying).toBe(false)
    
    act(() => {
      result.current.togglePlay()
    })
    
    expect(result.current.isPlaying).toBe(true)
    
    act(() => {
      result.current.togglePlay()
    })
    
    expect(result.current.isPlaying).toBe(false)
  })

  it('should change test case and reset', () => {
    const { result } = renderHook(() => useAlgorithmState())
    
    act(() => {
      result.current.nextStep()
      result.current.setTestCase([1, 2])
    })
    
    expect(result.current.testCase).toEqual([1, 2])
    expect(result.current.currentStep).toBe(0)
    expect(result.current.isPlaying).toBe(false)
  })

  /**
   * **Feature: leetcode-swap-nodes-visualization, Property 3: 步骤导航一致性**
   * 
   * *For any* 有效步骤索引 n（0 < n < totalSteps），从步骤 n 执行 prevStep 后再执行 nextStep，
   * 应该回到步骤 n 且状态完全一致
   * **Validates: Requirements 2.1, 2.2**
   */
  describe('Property 3: Step navigation consistency', () => {
    it('Property: prevStep then nextStep should return to same step', () => {
      const { result } = renderHook(() => useAlgorithmState())
      const totalSteps = result.current.totalSteps

      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Math.max(1, totalSteps - 1) }),
          (targetStep) => {
            // Go to target step
            act(() => {
              result.current.reset()
              for (let i = 0; i < targetStep; i++) {
                result.current.nextStep()
              }
            })
            
            const stepBefore = result.current.currentStep
            
            // prevStep then nextStep
            act(() => {
              result.current.prevStep()
              result.current.nextStep()
            })
            
            expect(result.current.currentStep).toBe(stepBefore)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  /**
   * **Feature: leetcode-swap-nodes-visualization, Property 8: 测试用例重置一致性**
   * 
   * *For any* 测试用例数组，调用 reset 后，currentStep 应该为 0，
   * 且初始链表状态应该与输入数组一致
   * **Validates: Requirements 6.2**
   */
  describe('Property 8: Test case reset consistency', () => {
    it('Property: setTestCase should reset to step 0 with correct initial state', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 0, maxLength: 10 }),
          (testCase) => {
            const { result } = renderHook(() => useAlgorithmState())
            
            act(() => {
              result.current.nextStep()
              result.current.nextStep()
              result.current.setTestCase(testCase)
            })
            
            expect(result.current.currentStep).toBe(0)
            expect(result.current.testCase).toEqual(testCase)
            expect(result.current.isPlaying).toBe(false)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  /**
   * **Feature: leetcode-swap-nodes-visualization, Property 4: 步骤边界检查**
   * 
   * *For any* 步骤状态，当 currentStep === 0 时 canGoPrev 应该返回 false；
   * 当 currentStep === totalSteps - 1 时 canGoNext 应该返回 false
   * **Validates: Requirements 2.5, 2.6**
   */
  describe('Property 4: Step boundary check', () => {
    it('Property: canGoPrev should be false at step 0', () => {
      const { result } = renderHook(() => useAlgorithmState())
      
      expect(result.current.currentStep).toBe(0)
      expect(result.current.canGoPrev).toBe(false)
    })

    it('Property: canGoNext should be false at last step', () => {
      const { result } = renderHook(() => useAlgorithmState())
      const totalSteps = result.current.totalSteps
      
      act(() => {
        for (let i = 0; i < totalSteps; i++) {
          result.current.nextStep()
        }
      })
      
      expect(result.current.currentStep).toBe(totalSteps - 1)
      expect(result.current.canGoNext).toBe(false)
    })

    it('Property: canGoPrev and canGoNext should be correct for middle steps', () => {
      const { result } = renderHook(() => useAlgorithmState())
      const totalSteps = result.current.totalSteps
      
      if (totalSteps > 2) {
        act(() => {
          result.current.nextStep()
        })
        
        expect(result.current.canGoPrev).toBe(true)
        expect(result.current.canGoNext).toBe(true)
      }
    })
  })
})
