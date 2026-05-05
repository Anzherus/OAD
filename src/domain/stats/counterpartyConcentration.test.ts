import { describe, expect, it } from 'vitest'
import { computeCounterpartyConcentration } from './counterpartyConcentration'
import type { NormalizedTransfer } from '../types'

function flow(
  focus: string,
  pairs: { other: string; amount: number }[],
): NormalizedTransfer[] {
  return pairs.map((p, i) =>
    p.amount >= 0
      ? {
          id: `x-${i}`,
          timestampSec: i,
          from: p.other,
          to: focus,
          amountNative: p.amount,
          asset: 'BTC',
        }
      : {
          id: `x-${i}`,
          timestampSec: i,
          from: focus,
          to: p.other,
          amountNative: p.amount,
          asset: 'BTC',
        },
  )
}

describe('computeCounterpartyConcentration', () => {
  it('50/50 two counterparties: low HHI*, full entropy', () => {
    const rows = flow('F', [
      { other: 'A', amount: 1 },
      { other: 'B', amount: 1 },
    ])
    const c = computeCounterpartyConcentration(rows, 'F')
    expect(c.counterpartiesCount).toBe(2)
    expect(c.hhi).toBeCloseTo(0.5)
    expect(c.hhiNormalized).toBeCloseTo(0)
    expect(c.entropyBits).toBeCloseTo(1)
    expect(c.maxEntropyBits).toBeCloseTo(1)
    expect(c.relativeUniformity).toBeCloseTo(1)
    expect(c.lorenz.at(-1)?.y).toBeCloseTo(1)
  })

  it('skewed split: higher HHI and HHI*', () => {
    const rows = flow('X', [
      { other: 'A', amount: 9 },
      { other: 'B', amount: 1 },
    ])
    const c = computeCounterpartyConcentration(rows, 'X')
    expect(c.hhi).toBeCloseTo(0.82)
    expect(c.hhiNormalized).toBeCloseTo((0.82 - 0.5) / 0.5)
    expect(c.relativeUniformity).toBeLessThan(1)
  })

  it('returns empty when nothing to attribute', () => {
    const c = computeCounterpartyConcentration([], 'F')
    expect(c.counterpartiesCount).toBe(0)
    expect(c.topShares).toEqual([])
  })
})
