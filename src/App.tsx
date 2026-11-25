import { useState } from 'react'
import './App.css'
import { Header } from './components/Header'
import { ControlPanel } from './components/ControlPanel'
import { CodePanel } from './components/CodePanel'
import { Visualization } from './components/Visualization'
import { FloatingBall } from './components/FloatingBall'
import { useAlgorithmState } from './hooks/useAlgorithmState'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

// 生成随机有效链表数据
function generateRandomList(): number[] {
  const length = Math.floor(Math.random() * 6) + 1 // 1-6个节点
  const arr: number[] = []
  for (let i = 0; i < length; i++) {
    arr.push(Math.floor(Math.random() * 100) + 1) // 1-100的随机数
  }
  return arr
}

function App() {
  const {
    steps,
    currentStep,
    isPlaying,
    totalSteps,
    nextStep,
    prevStep,
    goToStep,
    togglePlay,
    reset,
    setTestCase,
    canGoNext,
    canGoPrev,
  } = useAlgorithmState()

  const [inputValue, setInputValue] = useState('[1,2,3,4]')
  const [inputError, setInputError] = useState('')

  useKeyboardShortcuts({
    onPrevStep: prevStep,
    onNextStep: nextStep,
    onTogglePlay: togglePlay,
  })

  const currentStepData = steps[currentStep]

  // 解析用户输入
  const parseInput = (input: string): number[] | null => {
    try {
      const trimmed = input.trim()
      if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
        return null
      }
      const parsed = JSON.parse(trimmed)
      if (!Array.isArray(parsed)) return null
      if (!parsed.every(item => typeof item === 'number' && Number.isInteger(item))) {
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  // 应用用户输入
  const handleApplyInput = () => {
    const parsed = parseInput(inputValue)
    if (parsed === null) {
      setInputError('格式错误，请输入有效数组，如 [1,2,3,4]')
      return
    }
    setInputError('')
    setTestCase(parsed)
  }

  // 随机生成
  const handleRandomGenerate = () => {
    const randomList = generateRandomList()
    const label = `[${randomList.join(',')}]`
    setInputValue(label)
    setInputError('')
    setTestCase(randomList)
  }

  return (
    <div className="app">
      <Header />
      
      <main className="main-content">
        <div className="left-panel">
          <div className="input-section">
            <div className="input-row">
              <label>输入链表：</label>
              <input
                type="text"
                className={`input-field ${inputError ? 'error' : ''}`}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setInputError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyInput()}
                placeholder="例如: [1,2,3,4]"
              />
              <button className="apply-btn" onClick={handleApplyInput}>
                应用
              </button>
              <button className="random-btn" onClick={handleRandomGenerate}>
                🎲 随机
              </button>
            </div>
            {inputError && <div className="input-error">{inputError}</div>}
          </div>
          
          <Visualization
            nodes={currentStepData?.visualNodes || []}
            edges={currentStepData?.visualEdges || []}
            reducedMotion={window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false}
            currentStep={currentStep}
            totalSteps={totalSteps}
            description={currentStepData?.description || ''}
            narration={currentStepData?.narration || currentStepData?.description || ''}
            operation={currentStepData?.operation}
          />
          
          <ControlPanel
            currentStep={currentStep}
            totalSteps={totalSteps}
            isPlaying={isPlaying}
            canGoNext={canGoNext}
            canGoPrev={canGoPrev}
            onPrevious={prevStep}
            onNext={nextStep}
            onPlayPause={togglePlay}
            onReset={reset}
            onSeek={goToStep}
          />
        </div>
        
        <div className="right-panel">
          <CodePanel
            highlightLine={currentStepData?.highlightLine || 1}
            variables={currentStepData?.variables || []}
            description={currentStepData?.description || ''}
          />
        </div>
      </main>
      
      <FloatingBall />
    </div>
  )
}

export default App
