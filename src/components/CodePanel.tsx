import { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-java'
// 不导入默认主题，使用自定义深色主题
import './CodePanel.css'
import { VariableState } from '../engine/AlgorithmEngine'

const JAVA_CODE = `public ListNode swapPairs(ListNode head) {
    ListNode fakeHead = new ListNode(0, head);
    ListNode current = head, prev = fakeHead;
    while (current != null && current.next != null) {
        prev.next = current.next;
        ListNode temp = current.next.next;
        current.next.next = current;
        current.next = temp;
        prev = current;
        current = temp;
    }
    return fakeHead.next;
}`

interface CodePanelProps {
  highlightLine: number
  variables: VariableState[]
  description: string
}

// 变量颜色映射
const VARIABLE_COLORS: Record<string, string> = {
  fakeHead: '#8b5cf6',
  current: '#ef4444',
  prev: '#3b82f6',
  temp: '#10b981',
  'fakeHead.next': '#f59e0b',
}

export function CodePanel({ highlightLine, variables, description }: CodePanelProps) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [])

  const lines = JAVA_CODE.split('\n')

  // 获取当前高亮行的变量
  const highlightedLineVariables = variables.filter((v) => v.line === highlightLine)

  return (
    <div className="code-panel">
      <div className="code-header">
        <span className="code-title">Java 代码</span>
        <span className="debug-indicator">
          <span className="debug-dot"></span>
          调试模式
        </span>
      </div>
      <div className="code-description">{description}</div>
      <div className="code-container">
        <pre className="code-pre">
          {lines.map((line, index) => {
            const lineNumber = index + 1
            const isHighlighted = lineNumber === highlightLine

            return (
              <div
                key={index}
                className={`code-line ${isHighlighted ? 'highlighted' : ''}`}
              >
                <span className="line-gutter">
                  {isHighlighted && <span className="breakpoint-arrow">▶</span>}
                </span>
                <span className="line-number">{lineNumber}</span>
                <code
                  ref={index === 0 ? codeRef : undefined}
                  className="language-java line-content"
                  dangerouslySetInnerHTML={{
                    __html: Prism.highlight(line, Prism.languages.java, 'java'),
                  }}
                />
              </div>
            )
          })}
        </pre>
      </div>
      
      {/* 变量监视面板 */}
      <div className="variables-panel">
        <div className="variables-header">
          <span className="variables-icon">👁</span>
          <span>变量监视</span>
        </div>
        <div className="variables-content">
          {highlightedLineVariables.length > 0 ? (
            highlightedLineVariables.map((v, i) => (
              <div key={i} className="variable-row">
                <span 
                  className="variable-name"
                  style={{ color: VARIABLE_COLORS[v.name] || '#6366f1' }}
                >
                  {v.name}
                </span>
                <span className="variable-equals">=</span>
                <span className="variable-value">{v.value}</span>
              </div>
            ))
          ) : (
            <div className="no-variables">暂无变量</div>
          )}
        </div>
      </div>
    </div>
  )
}
