import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import './Visualization.css'
import { VisualNode, VisualEdge } from '../engine/AlgorithmEngine'

interface VisualizationProps {
  nodes: VisualNode[]
  edges: VisualEdge[]
  currentStep?: number
  totalSteps?: number
  description?: string
  operationType?: 'init' | 'check' | 'pointer-change' | 'swap-complete' | 'move-pointer' | 'return'
}

const NODE_RADIUS = 30
const ARROW_SIZE = 10

// 高亮颜色映射
const HIGHLIGHT_COLORS: Record<string, string> = {
  current: '#ef4444',  // 红色
  prev: '#3b82f6',     // 蓝色
  temp: '#10b981',     // 绿色
  fakeHead: '#8b5cf6', // 紫色
  swapping: '#f59e0b', // 橙色
}

// 高亮背景颜色（更浅）
const HIGHLIGHT_BG_COLORS: Record<string, string> = {
  current: '#fef2f2',
  prev: '#eff6ff',
  temp: '#ecfdf5',
  fakeHead: '#f5f3ff',
  swapping: '#fffbeb',
}

export function Visualization({ 
  nodes, 
  edges, 
  currentStep = 0, 
  totalSteps = 0, 
  description = '',
  operationType = 'init'
}: VisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 动画持续时间
  const ANIMATION_DURATION = 500

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const svg = d3.select(svgRef.current)
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight - 120 // 减去顶部信息栏和底部的高度

    // 设置 SVG 尺寸
    svg.attr('width', width).attr('height', height)

    // 计算居中偏移
    const nodesWidth = nodes.length > 0 
      ? Math.max(...nodes.map(n => n.x)) - Math.min(...nodes.map(n => n.x)) + NODE_RADIUS * 2
      : 0
    const minX = nodes.length > 0 ? Math.min(...nodes.map(n => n.x)) : 0
    const offsetX = (width - nodesWidth) / 2 - minX + NODE_RADIUS
    const offsetY = height / 2 - 150 + 30

    // 创建或更新主容器
    let g = svg.select<SVGGElement>('.main-group')
    if (g.empty()) {
      g = svg.append('g').attr('class', 'main-group')
    }
    g.attr('transform', `translate(${offsetX}, ${offsetY})`)

    // 创建箭头标记
    let defs = svg.select<SVGDefsElement>('defs')
    if (defs.empty()) {
      defs = svg.append('defs')
      
      // 普通箭头
      defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', NODE_RADIUS + ARROW_SIZE)
        .attr('refY', 0)
        .attr('markerWidth', ARROW_SIZE)
        .attr('markerHeight', ARROW_SIZE)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#666')

      // 高亮箭头（用于新建的边）
      defs.append('marker')
        .attr('id', 'arrowhead-new')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', NODE_RADIUS + ARROW_SIZE)
        .attr('refY', 0)
        .attr('markerWidth', ARROW_SIZE)
        .attr('markerHeight', ARROW_SIZE)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#f59e0b')

      // 移除中的箭头
      defs.append('marker')
        .attr('id', 'arrowhead-removing')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', NODE_RADIUS + ARROW_SIZE)
        .attr('refY', 0)
        .attr('markerWidth', ARROW_SIZE)
        .attr('markerHeight', ARROW_SIZE)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#ef4444')
    }

    // 创建节点位置映射
    const nodePositions = new Map<string, { x: number; y: number }>()
    nodes.forEach(n => {
      nodePositions.set(n.id, { x: n.x, y: n.y })
    })

    // 绘制边（箭头）
    const edgeSelection = g.selectAll<SVGLineElement, VisualEdge>('.edge')
      .data(edges, d => d.id)

    // 移除旧边
    edgeSelection.exit()
      .transition()
      .duration(ANIMATION_DURATION / 2)
      .style('opacity', 0)
      .remove()

    // 添加新边
    const edgeEnter = edgeSelection.enter()
      .append('line')
      .attr('class', 'edge')
      .style('opacity', 0)

    // 更新所有边
    edgeSelection.merge(edgeEnter)
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('x1', d => {
        const pos = nodePositions.get(d.sourceId)
        return pos ? pos.x + NODE_RADIUS : 0
      })
      .attr('y1', d => {
        const pos = nodePositions.get(d.sourceId)
        return pos ? pos.y : 0
      })
      .attr('x2', d => {
        const pos = nodePositions.get(d.targetId)
        return pos ? pos.x - NODE_RADIUS : 0
      })
      .attr('y2', d => {
        const pos = nodePositions.get(d.targetId)
        return pos ? pos.y : 0
      })
      .attr('stroke', d => {
        if (d.isNew || d.edgeType === 'new') return '#f59e0b'
        if (d.isRemoving || d.edgeType === 'removing') return '#ef4444'
        return '#666'
      })
      .attr('stroke-width', d => (d.isNew || d.isAnimating) ? 3 : 2)
      .attr('stroke-dasharray', d => d.isRemoving ? '5,5' : 'none')
      .attr('marker-end', d => {
        if (d.isNew || d.edgeType === 'new') return 'url(#arrowhead-new)'
        if (d.isRemoving || d.edgeType === 'removing') return 'url(#arrowhead-removing)'
        return 'url(#arrowhead)'
      })
      .style('opacity', 1)


    // 绘制节点组
    const nodeSelection = g.selectAll<SVGGElement, VisualNode>('.node-group')
      .data(nodes, d => d.id)

    // 移除旧节点
    nodeSelection.exit()
      .transition()
      .duration(ANIMATION_DURATION / 2)
      .style('opacity', 0)
      .remove()

    // 添加新节点组
    const nodeEnter = nodeSelection.enter()
      .append('g')
      .attr('class', 'node-group')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('opacity', 0)

    // 添加节点圆形
    nodeEnter.append('circle')
      .attr('class', 'node-circle')
      .attr('r', NODE_RADIUS)

    // 添加节点值文本
    nodeEnter.append('text')
      .attr('class', 'node-value')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '18px')
      .attr('font-weight', '600')

    // 添加指针标签
    nodeEnter.append('text')
      .attr('class', 'pointer-label')
      .attr('text-anchor', 'middle')
      .attr('y', -NODE_RADIUS - 15)
      .attr('font-size', '14px')
      .attr('font-weight', '600')

    // 合并并更新所有节点
    const allNodes = nodeSelection.merge(nodeEnter)

    // 动画移动节点位置
    allNodes
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('opacity', 1)

    // 更新节点圆形样式
    allNodes.select('.node-circle')
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('fill', d => {
        if (d.highlight) {
          return HIGHLIGHT_BG_COLORS[d.highlight] || '#fff'
        }
        return '#fff'
      })
      .attr('stroke', d => {
        if (d.highlight) {
          return HIGHLIGHT_COLORS[d.highlight] || '#333'
        }
        return '#333'
      })
      .attr('stroke-width', d => d.highlight ? 3 : 2)

    // 更新节点值文本
    allNodes.select('.node-value')
      .text(d => d.value)
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('fill', d => {
        if (d.highlight) {
          return HIGHLIGHT_COLORS[d.highlight] || '#333'
        }
        return '#333'
      })

    // 更新指针标签
    allNodes.select('.pointer-label')
      .text(d => d.highlight || '')
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('fill', d => d.highlight ? HIGHLIGHT_COLORS[d.highlight!] : '#666')

  }, [nodes, edges, currentStep])

  // 指针颜色映射（用于图例）
  const pointerLegend = [
    { name: 'current', color: HIGHLIGHT_COLORS.current, label: '当前节点 (current)' },
    { name: 'prev', color: HIGHLIGHT_COLORS.prev, label: '前驱节点 (prev)' },
    { name: 'temp', color: HIGHLIGHT_COLORS.temp, label: '临时指针 (temp)' },
    { name: 'swapping', color: HIGHLIGHT_COLORS.swapping, label: '交换中' },
  ]

  // 获取当前活跃的指针
  const activePointers = new Set(nodes.filter(n => n.highlight).map(n => n.highlight))

  // 获取操作类型的中文描述
  const getOperationLabel = (type: string) => {
    switch (type) {
      case 'init': return '初始化'
      case 'check': return '条件检查'
      case 'pointer-change': return '指针变化'
      case 'swap-complete': return '交换完成'
      case 'move-pointer': return '移动指针'
      case 'return': return '返回结果'
      default: return ''
    }
  }

  return (
    <div className="visualization" ref={containerRef}>
      {/* 顶部信息栏 */}
      <div className="viz-header">
        <div className="viz-step-info">
          <span className="step-badge">步骤 {currentStep + 1} / {totalSteps}</span>
          {operationType && (
            <span className={`operation-badge ${operationType}`}>
              {getOperationLabel(operationType)}
            </span>
          )}
        </div>
        <div className="step-description">{description}</div>
      </div>

      {/* 图例 */}
      <div className="viz-legend">
        {pointerLegend.map(item => (
          <div 
            key={item.name} 
            className={`legend-item ${activePointers.has(item.name as VisualNode['highlight']) ? 'active' : ''}`}
          >
            <span 
              className="legend-color" 
              style={{ backgroundColor: item.color }}
            />
            <span className="legend-label">{item.label}</span>
          </div>
        ))}
      </div>

      {/* SVG 画布 */}
      <svg ref={svgRef} className="viz-svg" />

      {/* 链表数组表示 */}
      {nodes.length > 0 && (
        <div className="viz-array-view">
          <span className="array-label">链表顺序:</span>
          <span className="array-content">
            {nodes.map((n, i) => (
              <span key={n.id} className="array-node">
                <span 
                  className={`array-value ${n.highlight ? 'highlighted' : ''}`}
                  style={{ 
                    borderColor: n.highlight ? HIGHLIGHT_COLORS[n.highlight] : undefined,
                    backgroundColor: n.highlight ? HIGHLIGHT_BG_COLORS[n.highlight] : undefined
                  }}
                >
                  {n.value}
                </span>
                {i < nodes.length - 1 && <span className="array-arrow">→</span>}
              </span>
            ))}
          </span>
        </div>
      )}

      {nodes.length === 0 && (
        <div className="empty-state">
          空链表
        </div>
      )}
    </div>
  )
}
