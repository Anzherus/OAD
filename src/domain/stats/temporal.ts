import type { NormalizedTransfer, TemporalStats } from '../types'

export function temporalFromTransfers(
  rows: NormalizedTransfer[],
  burstWindowSec: number,
  burstMinEvents: number,
): TemporalStats {
  const sorted = [...rows].sort((a, b) => a.timestampSec - b.timestampSec)
  const intervalsSec: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const cur = sorted[i]
    if (prev && cur) {
      intervalsSec.push(Math.max(0, cur.timestampSec - prev.timestampSec))
    }
  }
  const si = [...intervalsSec].sort((a, b) => a - b)
  const medianIntervalSec = si.length ? si[Math.floor(si.length / 2)]! : 0

  const burstWindows: TemporalStats['burstWindows'] = []
  if (sorted.length && burstWindowSec > 0) {
    let winStart = sorted[0]!.timestampSec
    let countInWin = 1
    for (let i = 1; i < sorted.length; i++) {
      const t = sorted[i]!.timestampSec
      if (t - winStart <= burstWindowSec) {
        countInWin++
      } else {
        if (countInWin >= burstMinEvents) {
          burstWindows.push({
            startSec: winStart,
            endSec: sorted[i - 1]!.timestampSec,
            count: countInWin,
          })
        }
        winStart = t
        countInWin = 1
      }
    }
    if (countInWin >= burstMinEvents) {
      const last = sorted[sorted.length - 1]!
      burstWindows.push({
        startSec: winStart,
        endSec: last.timestampSec,
        count: countInWin,
      })
    }
  }

  return { intervalsSec, medianIntervalSec, burstWindows }
}
