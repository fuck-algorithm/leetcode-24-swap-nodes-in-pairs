import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import './Visualization.css'
import { VisualNode, VisualEdge } from '../engine/AlgorithmEngine'

interface VisualizationProps {
  nodes: VisualNode[]
  edges: VisualEdge[]
  currentStep?: number
  reducedMotion: boolean
  totalSteps?: number
  description?: string
  narration?: string
  operation?: 'init' | 'read' | 'compare' | 'swap' | 'move' | 'return' | 'done'
}

const NODE_RADIUS = 30
const ARROW_SIZE = 10

// 高亮颜色映射
const HIGHLIGHT_COLORS: Record<string, string> = {
  current: '#18765a',
  prev: '#52736a',
  temp: '#347a68',
  fakeHead: '#697b75',
  swapping: '#b07a12',
}

// 高亮背景颜色（更浅）
const HIGHLIGHT_BG_COLORS: Record<string, string> = {
  current: '#d6eee5',
  prev: '#e5eeea',
  temp: '#e0f1eb',
  fakeHead: '#eef2f0',
  swapping: '#fff1ce',
}

export function Visualization({ 
  nodes, 
  edges,
  reducedMotion,
  currentStep = 0,
  totalSteps = 0, 
  description = '',
  narration = description,
  operation = 'init'
}: VisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 画布以节点 ID 做 keyed join，坐标由逻辑索引与容器尺寸确定。

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const svg = d3.select(svgRef.current)
    const container = containerRef.current
    const width = container.clientWidth
    const headerHeight = container.querySelector('.viz-header')?.getBoundingClientRect().height || 0
    const legendHeight = container.querySelector('.viz-legend')?.getBoundingClientRect().height || 0
    const arrayHeight = container.querySelector('.viz-array-view')?.getBoundingClientRect().height || 0
    const height = Math.max(1, container.clientHeight - headerHeight - legendHeight - arrayHeight)
    const animationDuration = reducedMotion ? 0 : 360

    // 设置 SVG 尺寸
    svg.attr('width', width).attr('height', height)

    // 逻辑坐标先映射到容器比例，再按节点整体范围居中，避免窄屏裁切。
    const scale = Math.min(width / 1080, height / 360, 1.2)
    const minX = nodes.length > 0 ? Math.min(...nodes.map(n => n.x)) : 0
    const maxX = nodes.length > 0 ? Math.max(...nodes.map(n => n.x)) : minX
    const contentWidth = (maxX - minX) * scale + NODE_RADIUS * 2
    const sentinelPadding = nodes.some(node => node.isSentinel) ? NODE_RADIUS * 2 + 16 : 0
    const offsetX = (width - contentWidth) / 2 - minX * scale + NODE_RADIUS + sentinelPadding
    const offsetY = height / 2 - 150 * scale

    // 创建或更新主容器
    let g = svg.select<SVGGElement>('.main-group')
    if (g.empty()) {
      g = svg.append('g').attr('class', 'main-group')
    }
    g.attr('transform', `translate(${offsetX}, ${offsetY}) scale(${scale})`)

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

    // 层级化组织数据边、指针和节点，避免快照切换时清空整幅画布。
    const edgesLayer = g.selectAll<SVGGElement, null>('.layer-edges').data([null]).join('g').attr('class', 'layer-edges')
    const nodesLayer = g.selectAll<SVGGElement, null>('.layer-nodes').data([null]).join('g').attr('class', 'layer-nodes')

    // 创建节点位置映射
    const nodePositions = new Map<string, { x: number; y: number }>()
    nodes.forEach(n => {
      nodePositions.set(n.id, { x: n.x, y: n.y })
    })
    const nodeById = new Map(nodes.map(node => [node.id, node]))

    // 绘制边（箭头）
    const edgeSelection = edgesLayer.selectAll<SVGLineElement, VisualEdge>('.edge')
      .data(edges, d => d.id)

    // 移除旧边
    edgeSelection.exit()
      .transition()
      .duration(animationDuration / 2)
      .style('opacity', 0)
      .remove()

    // 添加新边
    const edgeEnter = edgeSelection.enter()
      .append('line')
      .attr('class', 'edge')
      .style('opacity', 0)

    const edgeLabels = edgesLayer.selectAll<SVGTextElement, VisualEdge>('text.edge-label')
      .data(edges.filter(edge => edge.label && nodePositions.has(edge.sourceId) && nodePositions.has(edge.targetId)), edge => edge.id)
    edgeLabels.exit().remove()
    const edgeLabelEnter = edgeLabels.enter().append('text')
      .attr('class', 'edge-label').attr('text-anchor', 'middle').attr('dy', -9)
    edgeLabels.merge(edgeLabelEnter)
      .attr('class', edge => `edge-label${edge.isNew ? ' is-new' : ''}${edge.isRemoving ? ' is-removing' : ''}`)
      .text(edge => edge.label || '')
      .attr('x', edge => {
        const from = nodePositions.get(edge.sourceId)
        const to = nodePositions.get(edge.targetId)
        return from && to ? (from.x + to.x) / 2 : 0
      })
      .attr('y', edge => {
        const from = nodePositions.get(edge.sourceId)
        const to = nodePositions.get(edge.targetId)
        return from && to ? (from.y + to.y) / 2 : 0
      })
      .classed('is-new', edge => edge.isNew)
      .classed('is-removing', edge => edge.isRemoving)

    // 更新所有边
    edgeSelection.exit()
      .filter((_, index, groups) => {
        const edge = d3.select<SVGLineElement, VisualEdge>(groups[index]).datum()
        return !nodePositions.has(edge.sourceId) || !nodePositions.has(edge.targetId)
      })
      .remove()
    edgeSelection.merge(edgeEnter)
      .transition()
      .duration(animationDuration)
      .attr('x1', d => {
        const pos = nodePositions.get(d.sourceId)
        const radius = nodeById.get(d.sourceId)?.isNull ? 4 : NODE_RADIUS
        return pos ? pos.x + radius : 0
      })
      .attr('y1', d => {
        const pos = nodePositions.get(d.sourceId)
        return pos ? pos.y : 0
      })
      .attr('x2', d => {
        const pos = nodePositions.get(d.targetId)
        const radius = nodeById.get(d.targetId)?.isNull ? 4 : NODE_RADIUS
        return pos ? pos.x - radius : 0
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
    const nodeSelection = nodesLayer.selectAll<SVGGElement, VisualNode>('.node-group')
      .data(nodes, d => d.id)

    // 移除旧节点
    nodeSelection.exit()
      .transition()
      .duration(animationDuration / 2)
      .style('opacity', 0)
      .remove()

    // 添加新节点组
    const nodeEnter = nodeSelection.enter()
      .append('g')
      .attr('class', d => `node-group${d.isSentinel ? ' is-sentinel' : ''}${d.isNull ? ' is-null' : ''}`)
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('opacity', 0)

    // 添加节点圆形
    nodeEnter.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => d.isNull ? 4 : NODE_RADIUS)

    // 添加节点值文本
    nodeEnter.append('text')
      .attr('class', 'node-value')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '18px')
      .attr('font-weight', '600')

    // 添加指针标签
    nodeEnter.append('text')
      .attr('class', 'node-role')
      .attr('text-anchor', 'middle')
      .attr('y', NODE_RADIUS + 20)
      .attr('font-size', '12px')
      .attr('font-weight', '600')

    nodeEnter.append('text')
      .attr('class', 'pointer-label')
      .attr('text-anchor', 'middle')
      .attr('y', -NODE_RADIUS - 12)
      .attr('font-size', '10px')
      .attr('font-weight', '600')

    // 合并并更新所有节点
    const allNodes = nodeSelection.merge(nodeEnter)

    // 动画移动节点位置
    allNodes
      .transition()
      .duration(animationDuration)
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('opacity', 1)

    // 更新节点圆形样式
    allNodes.select('.node-circle')
      .transition()
      .duration(animationDuration)
      .attr('fill', d => {
        if (d.highlight) {
          return HIGHLIGHT_BG_COLORS[d.highlight] || '#fff'
        }
        return d.isSentinel ? '#eef2f0' : d.isNull ? '#fff' : '#fff'
      })
      .attr('stroke', d => {
        if (d.highlight) {
          return HIGHLIGHT_COLORS[d.highlight] || '#333'
        }
        return d.isSentinel || d.isNull ? '#879a92' : '#333'
      })
      .attr('stroke-width', d => d.highlight ? 3 : 2)
      .attr('stroke-dasharray', d => d.isSentinel || d.isNull ? '4 3' : 'none')

    // 更新节点值文本
    allNodes.select('.node-circle')
      .attr('r', d => d.isNull ? 4 : NODE_RADIUS)
      .attr('stroke-dasharray', d => d.isSentinel ? '4 3' : 'none')
    allNodes.select('.node-value')
      .text(d => d.isSentinel || d.isNull ? '' : d.value)
      .transition()
      .duration(animationDuration)
      .attr('fill', d => {
        if (d.highlight) {
          return HIGHLIGHT_COLORS[d.highlight] || '#333'
        }
        return '#333'
      })

    // 节点内显示数据，节点下方说明角色；指针始终用短标签。
    allNodes.select('.node-role')
      .text(d => d.displayLabel || (d.highlight === 'current' ? '当前节点' : d.highlight === 'prev' ? '前驱' : d.highlight === 'temp' ? '暂存后续' : ''))
      .attr('fill', d => d.highlight ? HIGHLIGHT_COLORS[d.highlight] : '#667a73')
    allNodes.select('.pointer-label')
      .text(d => (d.pointerLabels || []).join(' / '))
      .attr('fill', d => d.highlight ? HIGHLIGHT_COLORS[d.highlight] : '#667a73')

  }, [nodes, edges, currentStep, reducedMotion])

  // 固定图例说明三种需要追踪的指针。
  const pointerLegend = [
    { name: 'current', color: HIGHLIGHT_COLORS.current, label: '当前节点 current' },
    { name: 'prev', color: HIGHLIGHT_COLORS.prev, label: '前驱节点 prev' },
    { name: 'temp', color: HIGHLIGHT_COLORS.temp, label: '暂存后续 temp' },
    { name: 'swapping', color: HIGHLIGHT_COLORS.swapping, label: '交换中' },
  ]

  // 获取当前活跃的指针
  const activePointers = new Set(nodes.filter(n => n.highlight).map(n => n.highlight))

  // 获取操作类型的中文描述
  const getOperationLabel = (type: string) => {
    switch (type) {
      case 'init': return '初始化'
      case 'read': return '读取指针'
      case 'compare': return '检查节点对'
      case 'swap': return '交换指针'
      case 'move': return '推进指针'
      case 'done': return '完成'
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
          <span className={`operation-badge ${operation}`}>
            {getOperationLabel(operation)}
          </span>
          <span className="step-metrics">节点 {nodes.length} · 已交换 {nodes.filter(node => node.highlight === null).length}</span>
        </div>
        <div className="step-description">{narration || description}</div>
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
          <span className="array-label">从头开始:</span>
          <span className="array-content">
            {nodes.filter(node => !node.isSentinel && !node.isNull).map((n, i, list) => (
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
                {i < list.length - 1 && <span className="array-arrow">→</span>}
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
