import { describe, expect, it } from 'vitest'
import { describeTransfers } from './describe'
import type { NormalizedTransfer } from '../types'

const rows: NormalizedTransfer[] = [
  {
    id: '1',
    timestampSec: 1,
    from: 'a',
    to: 'f',
    amountNative: 1,
    asset: 'BTC',
  },
  {
    id: '2',
    timestampSec: 2,
    from: 'f',
    to: 'b',
    amountNative: -0.5,
    asset: 'BTC',
  },
  {
    id: '3',
    timestampSec: 3,
    from: 'c',
    to: 'f',
    amountNative: 0.000001,
    asset: 'BTC',
  },
]

describe('describeTransfers', () => {
  it('aggregates in/out and dust', () => {
    const d = describeTransfers(rows, 0.00001)
    expect(d.count).toBe(3)
    expect(d.sumIn).toBeCloseTo(1.000001)
    expect(d.sumOut).toBeCloseTo(0.5)
    expect(d.net).toBeCloseTo(0.500001)
    expect(d.maxAbs).toBeCloseTo(1)
    expect(d.dustShare).toBeGreaterThan(0)
  })
})
