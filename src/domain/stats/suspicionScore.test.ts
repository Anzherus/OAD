import { describe, expect, it } from 'vitest'
import { computeSuspicionScore } from './suspicionScore'
import type {
  BenfordResult,
  CounterpartyConcentrationStats,
  DescribeStats,
  HeuristicFlags,
  TemporalStats,
} from '../types'

const zeroDescribe: DescribeStats = {
  count: 0,
  sumIn: 0,
  sumOut: 0,
  net: 0,
  meanAbs: 0,
  medianAbs: 0,
  stdevAbs: 0,
  q1Abs: 0,
  q3Abs: 0,
  dustShare: 0,
  maxAbs: 0,
}

const emptyTemporal: TemporalStats = {
  intervalsSec: [],
  medianIntervalSec: 0,
  burstWindows: [],
}

const neutralFlags: HeuristicFlags = {
  highBurstiness: false,
  dustHeavy: false,
  largeOutlier: false,
}

const neutralConc: CounterpartyConcentrationStats = {
  totalVolumeAbs: 0,
  counterpartiesCount: 0,
  hhi: 0,
  hhiNormalized: 0,
  entropyBits: 0,
  maxEntropyBits: 0,
  relativeUniformity: 0,
  topShares: [],
  lorenz: [{ x: 0, y: 0 }],
}

describe('computeSuspicionScore', () => {
  it('empty-ish report → 0', () => {
    const s = computeSuspicionScore(
      zeroDescribe,
      emptyTemporal,
      null,
      neutralFlags,
      neutralConc,
      false,
    )
    expect(s.percent).toBe(0)
    expect(s.label).toBe('низкий')
  })

  it('all signals strong → capped at 100', () => {
    const desc: DescribeStats = {
      ...zeroDescribe,
      count: 10,
      dustShare: 0.55,
      q1Abs: 1,
      q3Abs: 3,
      maxAbs: 100,
    }
    const temporal: TemporalStats = {
      ...emptyTemporal,
      burstWindows: [
        { startSec: 1, endSec: 2, count: 8 },
        { startSec: 10, endSec: 20, count: 9 },
      ],
    }
    const flags: HeuristicFlags = {
      highBurstiness: true,
      dustHeavy: true,
      largeOutlier: true,
    }
    const benford: BenfordResult = {
      digitDistribution: {},
      expectedBenford: {},
      mad: 0.08,
      conformity: 'weak',
    }
    const conc: CounterpartyConcentrationStats = {
      ...neutralConc,
      counterpartiesCount: 5,
      hhiNormalized: 1,
    }
    const s = computeSuspicionScore(desc, temporal, benford, flags, conc, true)
    expect(s.percent).toBe(100)
    expect(s.breakdown.rawSum).toBeGreaterThanOrEqual(99.5)
  })
})
