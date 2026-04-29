import type { DescribeStats, NormalizedTransfer } from '../types'

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] === undefined) return sorted[base] ?? 0
  return (sorted[base] ?? 0) + rest * ((sorted[base + 1] ?? 0) - (sorted[base] ?? 0))
}

export function describeTransfers(
  rows: NormalizedTransfer[],
  dustThresholdNative: number,
): DescribeStats {
  const amounts = rows.map((r) => r.amountNative)
  const abs = amounts.map((a) => Math.abs(a)).sort((a, b) => a - b)
  const count = rows.length
  const sumIn = amounts.filter((a) => a > 0).reduce((s, a) => s + a, 0)
  const sumOut = amounts.filter((a) => a < 0).reduce((s, a) => s + Math.abs(a), 0)
  const net = sumIn - sumOut
  const meanAbs = count ? abs.reduce((s, v) => s + v, 0) / count : 0
  const medianAbs = count ? quantile(abs, 0.5) : 0
  const variance =
    count > 1
      ? abs.reduce((s, v) => s + (v - meanAbs) ** 2, 0) / (count - 1)
      : 0
  const stdevAbs = Math.sqrt(variance)
  const q1Abs = count ? quantile(abs, 0.25) : 0
  const q3Abs = count ? quantile(abs, 0.75) : 0
  const dustCount = abs.filter((v) => v > 0 && v < dustThresholdNative).length
  const nonZero = abs.filter((v) => v > 0).length
  const dustShare = nonZero ? dustCount / nonZero : 0
  const maxAbs = abs.length ? abs[abs.length - 1]! : 0

  return {
    count,
    sumIn,
    sumOut,
    net,
    meanAbs,
    medianAbs,
    stdevAbs,
    q1Abs,
    q3Abs,
    dustShare,
    maxAbs,
  }
}
