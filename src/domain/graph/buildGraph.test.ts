import { describe, expect, it } from 'vitest'
import { buildTransactionGraph } from './buildGraph'
import type { NormalizedTransfer } from '../types'

describe('buildTransactionGraph', () => {
  it('creates edges for in/out flows', () => {
    // addresses are lowercase — consistent with how adapters normalize them
    const focus = 'f'
    const rows: NormalizedTransfer[] = [
      {
        id: '1',
        timestampSec: 1,
        from: 'a',
        to: focus,
        amountNative: 2,
        asset: 'BTC',
      },
      {
        id: '2',
        timestampSec: 2,
        from: focus,
        to: 'b',
        amountNative: -1,
        asset: 'BTC',
      },
    ]
    const g = buildTransactionGraph(rows, focus, 20, 20)
    expect(g.nodes.some((n) => n.isFocus)).toBe(true)
    expect(g.edges.length).toBe(2)
    const e1 = g.edges.find((e) => e.source === 'a')
    expect(e1?.weight).toBeCloseTo(2)
  })
})
