import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import './Visualization.css'
import { VisualNode, VisualEdge, VariableState } from '../engine/AlgorithmEngine'

interface VisualizationProps {
  nodes: VisualNode[]
  edges: VisualEdge[]
  currentStep?: number
  totalSteps?: number
  description?: string
  variables?: VariableState[]
}

const NODE_RADIUS = 25
const ARROW_SIZE = 8

// 高亮颜色映射
const HIGHLIGHT_COLORS: Record<string, string> = {
  current: '#ef4444',  // 红色
  prev: '#3b82f6',     // 蓝色
  temp: '#10b981',     // 绿色
  fakeHead: '#8b5cf6', // 紫色
  swapping: '#f59e0b', // 橙色
}

export function Visualization({ 
  nodes, 
  edges, 
  currentStep = 0, 
  totalSteps = 0, 
  description = '',
  variables = []
}: VisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const svg = d3.select(svgRef.current)
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // 清除之前的内容
    svg.selectAll('*').remove()

    // 设置 SVG 尺寸
    svg.attr('width', width).attr('height', height)

    // 创建箭头标记
    const defs = svg.append('defs')
    defs
      .append('marker')
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

    // 计算居中偏移
    const nodesWidth = nodes.length > 0 
      ? Math.max(...nodes.map(n => n.x)) - Math.min(...nodes.map(n => n.x)) + NODE_RADIUS * 2
      : 0
    const offsetX = (width - nodesWidth) / 2 - (nodes.length > 0 ? Math.min(...nodes.map(n => n.x)) : 0) + NODE_RADIUS
    const offsetY = height / 2 - (nodes.length > 0 ? nodes[0].y : 150)

    const g = svg.append('g').attr('transform', `translate(${offsetX}, ${offsetY})`)

    // 绘制边（箭头）
    g.selectAll('.edge')
      .data(edges)
      .enter()
      .append('line')
      .attr('class', 'edge')
      .attr('x1', d => {
        const sourceNode = nodes.find(n => n.id === d.sourceId)
        return sourceNode ? sourceNode.x + NODE_RADIUS : 0
      })
      .attr('y1', d => {
        const sourceNode = nodes.find(n => n.id === d.sourceId)
        return sourceNode ? sourceNode.y : 0
      })
      .attr('x2', d => {
        const targetNode = nodes.find(n => n.id === d.targetId)
        return targetNode ? targetNode.x - NODE_RADIUS : 0
      })
      .attr('y2', d => {
        const targetNode = nodes.find(n => n.id === d.targetId)
        return targetNode ? targetNode.y : 0
      })
      .attr('stroke', '#666')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)')

    // 绘制节点组
    const nodeGroups = g
      .selectAll('.node-group')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)

    // 绘制节点圆形
    nodeGroups
      .append('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', d => d.highlight ? HIGHLIGHT_COLORS[d.highlight] || '#fff' : '#fff')
      .attr('stroke', d => d.highlight ? HIGHLIGHT_COLORS[d.highlight] || '#333' : '#333')
      .attr('stroke-width', 2)

    // 绘制节点值
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .attr('fill', d => d.highlight ? '#fff' : '#333')
      .text(d => d.value)

    // 绘制指针标签
    nodeGroups
      .filter(d => d.highlight !== null)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -NODE_RADIUS - 10)
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', d => d.highlight ? HIGHLIGHT_COLORS[d.highlight!] : '#666')
      .text(d => d.highlight || '')

  }, [nodes, edges])

  // 指针颜色映射（用于图例）
  const pointerLegend = [
    { name: 'current', color: HIGHLIGHT_COLORS.current, label: '当前节点' },
    { name: 'prev', color: HIGHLIGHT_COLORS.prev, label: '前驱节点' },
    { name: 'temp', color: HIGHLIGHT_COLORS.temp, label: '临时指针' },
    { name: 'fakeHead', color: HIGHLIGHT_COLORS.fakeHead, label: '虚拟头' },
  ]

  // 获取当前活跃的指针
  const activePointers = new Set(nodes.filter(n => n.highlight).map(n => n.highlight))

  return (
    <div className="visualization" ref={containerRef}>
      {/* 顶部信息栏 */}
      <div className="viz-header">
        <div className="viz-step-info">
          <span className="step-badge">步骤 {currentStep + 1} / {totalSteps}</span>
          <span className="step-description">{description}</span>
        </div>
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
      <svg ref={svgRef} />

      {/* 变量状态面板 */}
      {variables.length > 0 && (
        <div className="viz-variables">
          <div className="variables-title">变量状态</div>
          <div className="variables-list">
            {variables.map((v, i) => (
              <div key={i} className="variable-item">
                <span className="var-name">{v.name}</span>
                <span className="var-equals">=</span>
                <span className="var-value">{v.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 链表数组表示 */}
      {nodes.length > 0 && (
        <div className="viz-array-view">
          <span className="array-label">链表:</span>
          <span className="array-content">
            [{nodes.map(n => n.value).join(' → ')}]
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
