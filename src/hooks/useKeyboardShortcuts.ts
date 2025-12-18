import { useEffect, useCallback } from 'react'

interface KeyboardShortcutsOptions {
  onPrevStep: () => void
  onNextStep: () => void
  onTogglePlay: () => void
  enabled?: boolean
}

/**
 * 键盘快捷键 Hook
 * - 左方向键：上一步
 * - 右方向键：下一步
 * - 空格键：播放/暂停
 */
export function useKeyboardShortcuts({
  onPrevStep,
  onNextStep,
  onTogglePlay,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // 忽略在输入框中的按键
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          onPrevStep()
          break
        case 'ArrowRight':
          event.preventDefault()
          onNextStep()
          break
        case ' ':
          event.preventDefault()
          onTogglePlay()
          break
      }
    },
    [enabled, onPrevStep, onNextStep, onTogglePlay]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * 快捷键提示文案
 */
export const SHORTCUT_HINTS = {
  prevStep: '← 上一步',
  nextStep: '下一步 →',
  play: '播放 (空格)',
  pause: '暂停 (空格)',
}
