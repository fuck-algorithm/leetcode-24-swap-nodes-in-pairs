import { useCallback, useRef, useState } from 'react'
import './ControlPanel.css'

interface ControlPanelProps {
  currentStep: number
  totalSteps: number
  isPlaying: boolean
  canGoNext: boolean
  canGoPrev: boolean
  onPrevious: () => void
  onNext: () => void
  onPlayPause: () => void
  onReset: () => void
  onSeek: (step: number) => void
}

export function ControlPanel({
  currentStep,
  totalSteps,
  isPlaying,
  canGoNext,
  canGoPrev,
  onPrevious,
  onNext,
  onPlayPause,
  onReset,
  onSeek,
}: ControlPanelProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0

  const calculateStepFromPosition = useCallback((clientX: number) => {
    if (!progressRef.current) return currentStep
    const rect = progressRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    return Math.round(percentage * (totalSteps - 1))
  }, [totalSteps, currentStep])

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const step = calculateStepFromPosition(e.clientX)
    onSeek(step)
  }, [calculateStepFromPosition, onSeek])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const step = calculateStepFromPosition(e.clientX)
    onSeek(step)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const step = calculateStepFromPosition(moveEvent.clientX)
      onSeek(step)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [calculateStepFromPosition, onSeek])

  return (
    <div className="control-panel">
      <div className="control-buttons">
        <button
          className="control-btn"
          onClick={onReset}
          title="重置"
        >
          ⟲ 重置
        </button>
        <button
          className="control-btn"
          onClick={onPrevious}
          disabled={!canGoPrev}
          title="上一步 (←)"
        >
          ← 上一步
        </button>
        <button
          className="control-btn play-btn"
          onClick={onPlayPause}
          title={isPlaying ? '暂停 (空格)' : '播放 (空格)'}
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'} (空格)
        </button>
        <button
          className="control-btn"
          onClick={onNext}
          disabled={!canGoNext}
          title="下一步 (→)"
        >
          下一步 →
        </button>
      </div>
      <div className="step-indicator">
        步骤: {currentStep + 1} / {totalSteps}
      </div>
      <div 
        className={`progress-bar-container ${isDragging ? 'dragging' : ''}`}
        ref={progressRef}
        onClick={handleProgressClick}
        onMouseDown={handleMouseDown}
      >
        <div className="progress-bar-track">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div 
          className="progress-bar-thumb"
          style={{ left: `${progress}%` }}
        />
      </div>
    </div>
  )
}
