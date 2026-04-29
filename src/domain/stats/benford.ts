import type { BenfordResult, NormalizedTransfer } from '../types'

const BENFORD = [0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046]

function leadingDigit(x: number): number | null {
  if (!Number.isFinite(x) || x === 0) return null
  let a = Math.abs(x)
  while (a >= 10) a /= 10
  while (a < 1 && a > 0) a *= 10
  const d = Math.floor(a)
  return d >= 1 && d <= 9 ? d : null
}

/** Mean Absolute Deviation vs Benford for first-digit test (Nigrini-style coarse band). */
export function benfordFirstDigit(rows: NormalizedTransfer[]): BenfordResult | null {
  const vals = rows
    .map((r) => Math.abs(r.amountNative))
    .filter((v) => v > 0)
  if (vals.length < 30) {
    const digitDistribution = Object.fromEntries(
      Array.from({ length: 9 }, (_, i) => [i + 1, 0]),
    ) as Record<number, number>
    return {
      digitDistribution,
      expectedBenford: Object.fromEntries(
        BENFORD.map((p, i) => [i + 1, p]),
      ) as Record<number, number>,
      mad: 0,
      conformity: 'insufficient_data',
    }
  }
  const counts: Record<number, number> = Object.fromEntries(
    Array.from({ length: 9 }, (_, i) => [i + 1, 0]),
  ) as Record<number, number>
  for (const v of vals) {
    const d = leadingDigit(v)
    if (d) counts[d] = (counts[d] ?? 0) + 1
  }
  const n = vals.length
  let mad = 0
  for (let d = 1; d <= 9; d++) {
    const obs = (counts[d] ?? 0) / n
    mad += Math.abs(obs - BENFORD[d - 1]!)
  }
  mad /= 9
  let conformity: BenfordResult['conformity'] = 'weak'
  if (mad < 0.015) conformity = 'rough_match'
  else if (mad > 0.05) conformity = 'weak'

  return {
    digitDistribution: counts,
    expectedBenford: Object.fromEntries(
      BENFORD.map((p, i) => [i + 1, p]),
    ) as Record<number, number>,
    mad,
    conformity,
  }
}
