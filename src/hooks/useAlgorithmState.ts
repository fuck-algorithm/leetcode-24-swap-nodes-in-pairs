import { useState, useCallback, useEffect, useRef } from 'react'
import { generateSteps, AnimationStep } from '../engine/AlgorithmEngine'

export interface AlgorithmState {
  steps: AnimationStep[]
  currentStep: number
  isPlaying: boolean
  testCase: number[]
  totalSteps: number
}

export interface AlgorithmActions {
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  togglePlay: () => void
  reset: () => void
  setTestCase: (testCase: number[]) => void
  canGoNext: boolean
  canGoPrev: boolean
}

const DEFAULT_TEST_CASE = [1, 2, 3, 4]
const PLAYBACK_INTERVAL = 1000 // 1 second

export function useAlgorithmState(): AlgorithmState & AlgorithmActions {
  const [testCase, setTestCaseState] = useState<number[]>(DEFAULT_TEST_CASE)
  const [steps, setSteps] = useState<AnimationStep[]>(() => generateSteps(DEFAULT_TEST_CASE))
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const totalSteps = steps.length

  const canGoNext = currentStep < totalSteps - 1
  const canGoPrev = currentStep > 0

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1))
  }, [totalSteps])

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)))
  }, [totalSteps])

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const reset = useCallback(() => {
    setCurrentStep(0)
    setIsPlaying(false)
  }, [])

  const setTestCase = useCallback((newTestCase: number[]) => {
    setTestCaseState(newTestCase)
    const newSteps = generateSteps(newTestCase)
    setSteps(newSteps)
    setCurrentStep(0)
    setIsPlaying(false)
  }, [])

  // 自动播放逻辑
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, PLAYBACK_INTERVAL)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, totalSteps])

  // 当到达最后一步时停止播放
  useEffect(() => {
    if (currentStep >= totalSteps - 1 && isPlaying) {
      setIsPlaying(false)
    }
  }, [currentStep, totalSteps, isPlaying])

  return {
    steps,
    currentStep,
    isPlaying,
    testCase,
    totalSteps,
    nextStep,
    prevStep,
    goToStep,
    togglePlay,
    reset,
    setTestCase,
    canGoNext,
    canGoPrev,
  }
}
