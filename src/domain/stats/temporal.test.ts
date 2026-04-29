import { describe, expect, it } from 'vitest'
import { temporalFromTransfers } from './temporal'
import type { NormalizedTransfer } from '../types'

function r(
  id: string,
  t: number,
  amt: number,
): NormalizedTransfer {
  return {
    id,
    timestampSec: t,
    from: null,
    to: null,
    amountNative: amt,
    asset: 'BTC',
  }
}

describe('temporalFromTransfers', () => {
  it('computes intervals and burst window', () => {
    const rows = [
      r('1', 0, 1),
      r('2', 10, 1),
      r('3', 20, 1),
      r('4', 30, 1),
      r('5', 40, 1),
      r('6', 50, 1),
      r('7', 60, 1),
      r('8', 70, 1),
      r('9', 80, 1),
    ]
    const tmp = temporalFromTransfers(rows, 100, 5)
    expect(tmp.intervalsSec.length).toBe(8)
    expect(tmp.medianIntervalSec).toBe(10)
    expect(tmp.burstWindows.length).toBeGreaterThanOrEqual(1)
  })
})
