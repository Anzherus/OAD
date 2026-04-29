import { z } from 'zod'
import type { AssetSymbol, NormalizedTransfer } from '../types'

const rowSchema = z.object({
  timestamp: z.union([z.number(), z.string()]),
  amount: z.number(),
  from: z.string().nullable().optional(),
  to: z.string().nullable().optional(),
  event_type: z.string().optional(),
  eventType: z.string().optional(),
  id: z.string().optional(),
  asset: z.enum(['BTC', 'ETH', 'UNKNOWN']).optional(),
})

const fileSchema = z.union([
  z.array(rowSchema),
  z.object({ transfers: z.array(rowSchema) }),
])

function parseTimestamp(t: number | string): number {
  if (typeof t === 'number') {
    return t > 1e12 ? Math.floor(t / 1000) : t
  }
  const ms = Date.parse(t)
  if (Number.isNaN(ms)) throw new Error(`Bad timestamp: ${t}`)
  return Math.floor(ms / 1000)
}

export function parseImportedJson(text: string): {
  rows: NormalizedTransfer[]
  asset: AssetSymbol
} {
  const data: unknown = JSON.parse(text)
  const parsed = fileSchema.parse(data)
  const list = Array.isArray(parsed) ? parsed : parsed.transfers
  const asset: AssetSymbol = 'UNKNOWN'
  const rows: NormalizedTransfer[] = list.map((r, i) => ({
    id: r.id ?? `import-${i}`,
    timestampSec: parseTimestamp(r.timestamp),
    from: r.from ?? null,
    to: r.to ?? null,
    amountNative: r.amount,
    asset: r.asset ?? 'UNKNOWN',
    eventType: r.eventType ?? r.event_type,
    rawRef: 'import-json',
  }))
  return { rows, asset: rows[0]?.asset ?? asset }
}

/** Minimal CSV: timestamp,amount[,from,to][,event_type] header optional */
export function parseImportedCsv(text: string): {
  rows: NormalizedTransfer[]
  asset: AssetSymbol
} {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return { rows: [], asset: 'UNKNOWN' }
  let start = 0
  const first = lines[0]!.toLowerCase()
  if (first.includes('timestamp') && first.includes('amount')) {
    start = 1
  }
  const rows: NormalizedTransfer[] = []
  for (let i = start; i < lines.length; i++) {
    const parts = lines[i]!.split(',').map((p) => p.trim().replace(/^"|"$/g, ''))
    const tsRaw = parts[0]
    const amtRaw = parts[1]
    if (!tsRaw || amtRaw === undefined) continue
    const amount = Number(amtRaw)
    if (Number.isNaN(amount)) continue
    rows.push({
      id: `csv-${i}`,
      timestampSec: parseTimestamp(
        /^\d+$/.test(tsRaw) ? Number(tsRaw) : tsRaw,
      ),
      from: parts[2] || null,
      to: parts[3] || null,
      amountNative: amount,
      asset: 'UNKNOWN',
      eventType: parts[4],
      rawRef: 'import-csv',
    })
  }
  return { rows, asset: 'UNKNOWN' }
}
