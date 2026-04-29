import type { NormalizedTransfer } from '@/domain/types'
import { fetchJsonCached } from './memoryCache'

const MEMPOOL_BASE = 'https://mempool.space/api'

type MempoolPrevout = {
  scriptpubkey_address?: string
  value?: number
}

type MempoolVin = { prevout?: MempoolPrevout }
type MempoolVout = { scriptpubkey_address?: string; value?: number }

export type MempoolTx = {
  txid: string
  vin?: MempoolVin[]
  vout?: MempoolVout[]
  status?: { block_time?: number; confirmed?: boolean }
}

function satToBtc(sat: number): number {
  return sat / 1e8
}

export function normalizeMempoolTx(focus: string, tx: MempoolTx): NormalizedTransfer {
  const txid = tx.txid
  let satIn = 0
  for (const vin of tx.vin ?? []) {
    const a = vin.prevout?.scriptpubkey_address
    const v = vin.prevout?.value ?? 0
    if (a === focus) satIn += v
  }
  let satOut = 0
  for (const vo of tx.vout ?? []) {
    if (vo.scriptpubkey_address === focus) {
      satOut += vo.value ?? 0
    }
  }
  const deltaSat = satOut - satIn
  const amountNative = satToBtc(deltaSat)

  let from: string | null = null
  let to: string | null = null
  if (amountNative > 0) {
    let best = 0
    for (const vin of tx.vin ?? []) {
      const a = vin.prevout?.scriptpubkey_address
      const v = vin.prevout?.value ?? 0
      if (a && a !== focus && v > best) {
        best = v
        from = a
      }
    }
  } else if (amountNative < 0) {
    let best = 0
    for (const vo of tx.vout ?? []) {
      const a = vo.scriptpubkey_address
      const v = vo.value ?? 0
      if (a && a !== focus && v > best) {
        best = v
        to = a
      }
    }
  }

  const ts = tx.status?.block_time ?? Math.floor(Date.now() / 1000)

  return {
    id: txid,
    timestampSec: ts,
    from,
    to,
    amountNative,
    asset: 'BTC',
    rawRef: txid,
  }
}

export async function fetchMempoolAddressTransfers(
  address: string,
  maxTx: number,
  requestDelayMs: number,
): Promise<NormalizedTransfer[]> {
  const focus = address.trim()
  const out: MempoolTx[] = []
  let lastSeen: string | undefined

  while (out.length < maxTx) {
    const path = lastSeen
      ? `/address/${encodeURIComponent(focus)}/txs/chain/${lastSeen}`
      : `/address/${encodeURIComponent(focus)}/txs`
    const url = `${MEMPOOL_BASE}${path}`
    const batch = (await fetchJsonCached(
      url,
      url,
      undefined,
      out.length ? requestDelayMs : 0,
    )) as MempoolTx[]

    if (!Array.isArray(batch) || batch.length === 0) break
    for (const tx of batch) {
      if (out.length >= maxTx) break
      out.push(tx)
    }
    lastSeen = batch[batch.length - 1]?.txid
    if (!lastSeen || batch.length < 25) break
  }

  return out.map((tx) => normalizeMempoolTx(focus, tx))
}
