import type { GraphEdge, NormalizedTransfer, TransactionGraph } from '../types'

type Agg = { weight: number; txIds: Set<string> }

export function buildTransactionGraph(
  rows: NormalizedTransfer[],
  focusAddress: string,
  maxNodes: number,
  maxEdges: number,
): TransactionGraph {
  // Normalize to lowercase for consistent comparison
  const focus = focusAddress.trim().toLowerCase()
  const map = new Map<string, Agg>()

  const edgeKey = (a: string, b: string) => `${a}\0${b}`

  for (const r of rows) {
    const tid = r.id
    const fromNorm = r.from?.toLowerCase() ?? null
    const toNorm = r.to?.toLowerCase() ?? null

    if (r.amountNative >= 0) {
      // inflow or zero-value call to focus
      const src = fromNorm ?? 'unknown_in'
      const dst = focus
      // skip self-loops (from === focus means it's actually an outflow mislabeled)
      if (src === focus) continue
      const k = edgeKey(src, dst)
      const cur = map.get(k) ?? { weight: 0, txIds: new Set<string>() }
      cur.weight += Math.abs(r.amountNative)
      cur.txIds.add(tid)
      map.set(k, cur)
    } else {
      // outflow from focus
      const src = focus
      const dst = toNorm ?? 'unknown_out'
      if (dst === focus) continue
      const k = edgeKey(src, dst)
      const cur = map.get(k) ?? { weight: 0, txIds: new Set<string>() }
      cur.weight += Math.abs(r.amountNative)
      cur.txIds.add(tid)
      map.set(k, cur)
    }
  }

  const edgesAll: GraphEdge[] = [...map.entries()]
    .map(([k, v]) => {
      const [source, target] = k.split('\0') as [string, string]
      return {
        source,
        target,
        weight: v.weight,
        txIds: [...v.txIds],
      }
    })
    .sort((a, b) => b.weight - a.weight || b.txIds.length - a.txIds.length)

  const picked = edgesAll.slice(0, maxEdges)
  const nodeIds = new Set<string>([focus])
  for (const e of picked) {
    nodeIds.add(e.source)
    nodeIds.add(e.target)
  }
  if (nodeIds.size > maxNodes) {
    const scored = [...nodeIds].map((id) => {
      let score = 0
      for (const e of picked) {
        if (e.source === id || e.target === id) score += e.weight
      }
      return { id, score }
    })
    scored.sort((a, b) => b.score - a.score)
    const keep = new Set(scored.slice(0, maxNodes).map((s) => s.id))
    keep.add(focus)
    const filteredEdges = picked.filter(
      (e) => keep.has(e.source) && keep.has(e.target),
    )
    return {
      nodes: [...keep].map((id) => ({
        id,
        label: id === focus ? `${id} (фокус)` : id,
        isFocus: id === focus,
      })),
      edges: filteredEdges,
    }
  }

  return {
    nodes: [...nodeIds].map((id) => ({
      id,
      label: id === focus ? `${id} (фокус)` : id,
      isFocus: id === focus,
    })),
    edges: picked,
  }
}
