import type { TransactionGraph } from '@/domain/types'
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useState } from 'react'

function layout(g: TransactionGraph): { nodes: Node[]; edges: Edge[] } {
  const focus = g.nodes.find((n) => n.isFocus)
  const others = g.nodes.filter((n) => !n.isFocus)
  const R = 260
  const nodes: Node[] = []
  if (focus) {
    nodes.push({
      id: focus.id,
      position: { x: 0, y: 0 },
      data: { label: focus.label },
      style: {
        background: 'rgba(124,108,248,0.18)',
        border: '2px solid #7c6cf8',
        borderRadius: 10,
        color: '#e4e4f0',
        fontWeight: 600,
        fontSize: 12,
        padding: '6px 12px',
      },
    })
  }
  others.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(others.length, 1)
    nodes.push({
      id: n.id,
      position: { x: R * Math.cos(angle), y: R * Math.sin(angle) },
      data: { label: n.label },
      style: {
        background: 'rgba(39,39,42,0.9)',
        border: '1px solid #3f3f46',
        borderRadius: 8,
        color: '#a1a1aa',
        fontSize: 11,
        padding: '4px 10px',
      },
    })
  })
  const edges: Edge[] = g.edges.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    label: e.weight.toFixed(6),
    labelStyle: { fill: '#71717a', fontSize: 10 },
    labelBgStyle: { fill: '#18181b', fillOpacity: 0.85 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#a78bfa' },
    style: { stroke: '#7c6cf8', strokeWidth: 1.5 },
  }))
  return { nodes, edges }
}

export function FlowPanel({ graph }: { graph: TransactionGraph }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const { nodes: n, edges: e } = layout(graph)
    setNodes(n)
    setEdges(e)
  }, [graph, setNodes, setEdges])

  // Close fullscreen on Escape
  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreen])

  const containerCls = fullscreen
    ? 'fixed inset-0 z-50 bg-zinc-950'
    : 'h-[480px] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950'

  return (
    <div className={containerCls}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="#27272a" />
        <MiniMap
          maskColor="rgba(0,0,0,0.5)"
          nodeColor={() => '#7c6cf8'}
          style={{ background: '#18181b', border: '1px solid #3f3f46' }}
        />
        <Controls style={{ background: '#18181b', border: '1px solid #3f3f46' }} />

        {/* Fullscreen toggle */}
        <div className="absolute right-3 top-3 z-10">
          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            title={fullscreen ? 'Свернуть (Esc)' : 'На весь экран'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/90 text-zinc-400 backdrop-blur hover:border-violet-600 hover:text-violet-300 transition-colors"
          >
            {fullscreen ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 1H1v4M9 1h4v4M5 13H1V9M9 13h4V9" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M1 5V1h4M9 1h4v4M1 9v4h4M13 9v4H9" />
              </svg>
            )}
          </button>
        </div>

        {/* Node/edge count badge */}
        <div className="absolute left-3 top-3 z-10 flex gap-2">
          <span className="rounded-md border border-zinc-800 bg-zinc-900/90 px-2 py-0.5 font-mono text-xs text-zinc-500 backdrop-blur">
            {graph.nodes.length} узлов · {graph.edges.length} рёбер
          </span>
        </div>
      </ReactFlow>
    </div>
  )
}
