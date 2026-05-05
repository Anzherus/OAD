import type {
  CounterpartyConcentrationStats,
  NormalizedTransfer,
} from '../types'

const LOG2 = Math.log(2)

function log2safe(x: number): number {
  return Math.log(x) / LOG2
}

/** Volume |amount| aggregated per immediate counterparty of focus (aligned with transaction graph semantics). */
export function computeCounterpartyConcentration(
  rows: NormalizedTransfer[],
  focusAddress: string,
  topForChart = 12,
): CounterpartyConcentrationStats {
  const focus = focusAddress.trim().toLowerCase()
  const volMap = new Map<string, number>()

  for (const r of rows) {
    const fromNorm = r.from?.toLowerCase() ?? null
    const toNorm = r.to?.toLowerCase() ?? null
    const a = Math.abs(r.amountNative)
    if (a === 0) continue

    if (r.amountNative >= 0) {
      const src = fromNorm ?? 'unknown_in'
      if (src === focus) continue
      volMap.set(src, (volMap.get(src) ?? 0) + a)
    } else {
      const dst = toNorm ?? 'unknown_out'
      if (dst === focus) continue
      volMap.set(dst, (volMap.get(dst) ?? 0) + a)
    }
  }

  const entries = [...volMap.entries()].filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)

  if (entries.length === 0 || total <= 0) {
    return {
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
  }

  const n = entries.length
  const shares = entries.map(([id, v]) => ({
    id,
    volume: v,
    share: v / total,
  }))

  shares.sort((a, b) => b.volume - a.volume)

  const hhi = shares.reduce((s, row) => s + row.share * row.share, 0)

  let hhiNormalized = 0
  if (n > 1) {
    const minHhi = 1 / n
    const denom = 1 - minHhi
    hhiNormalized = denom > 0 ? (hhi - minHhi) / denom : 0
    hhiNormalized = Math.min(1, Math.max(0, hhiNormalized))
  }

  let entropyBits = 0
  for (const row of shares) {
    const p = row.share
    if (p > 0) entropyBits -= p * log2safe(p)
  }
  const maxEntropyBits = n > 1 ? log2safe(n) : 0
  const relativeUniformity =
    maxEntropyBits > 0 ? Math.min(1, entropyBits / maxEntropyBits) : 1

  const topSlices = shares.slice(0, topForChart)
  const restVol = shares
    .slice(topForChart)
    .reduce((s, row) => s + row.volume, 0)
  const topShares = topSlices.map((row) => ({
    label: shortenId(row.id),
    share: row.share,
    volume: row.volume,
  }))
  if (restVol > 0) {
    topShares.push({
      label: `прочие (${shares.length - topForChart})`,
      share: restVol / total,
      volume: restVol,
    })
  }

  const sortedAsc = [...shares].sort((a, b) => a.volume - b.volume)
  const lorenz: CounterpartyConcentrationStats['lorenz'] = [{ x: 0, y: 0 }]
  let cum = 0
  for (let k = 0; k < sortedAsc.length; k++) {
    cum += sortedAsc[k]!.volume
    lorenz.push({
      x: (k + 1) / n,
      y: cum / total,
    })
  }

  return {
    totalVolumeAbs: total,
    counterpartiesCount: n,
    hhi,
    hhiNormalized,
    entropyBits,
    maxEntropyBits,
    relativeUniformity,
    topShares,
    lorenz,
  }
}

function shortenId(id: string): string {
  if (id.length <= 14) return id
  return `${id.slice(0, 6)}…${id.slice(-4)}`
}
