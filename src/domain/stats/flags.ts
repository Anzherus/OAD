import type { DescribeStats, HeuristicFlags, TemporalStats } from '../types'

export function computeFlags(
  describe: DescribeStats,
  temporal: TemporalStats,
): HeuristicFlags {
  const highBurstiness = temporal.burstWindows.length > 0
  const dustHeavy = describe.dustShare > 0.35
  const iqr = describe.q3Abs - describe.q1Abs
  const fence = describe.q3Abs + 3 * Math.max(iqr, 1e-12)
  const largeOutlier = describe.maxAbs > fence && describe.count >= 5

  return { highBurstiness, dustHeavy, largeOutlier }
}
