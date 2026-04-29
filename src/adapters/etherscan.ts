import type { NormalizedTransfer } from '@/domain/types'
import { fetchJsonCached } from './memoryCache'

/**
 * Etherscan API V2 base URL.
 * V2 uses https://api.etherscan.io/v2/api with chainid param.
 * Dev proxy rewrites /etherscan-api → https://api.etherscan.io to avoid CORS.
 */
function etherscanBase(): string {
  const v = import.meta.env.VITE_ETHERSCAN_BASE as string | undefined
  if (v) return v.replace(/\/$/, '')
  if (import.meta.env.DEV) return '/etherscan-api'
  return 'https://api.etherscan.io'
}

type EtherscanTx = {
  hash: string
  from: string
  to: string
  value: string
  timeStamp: string
  isError?: string
}

type EtherscanResponse = {
  status: string
  message: string
  result: EtherscanTx[] | string
}

export async function fetchEtherscanAddressTransfers(
  address: string,
  maxRows: number,
  apiKey: string,
  requestDelayMs: number,
): Promise<NormalizedTransfer[]> {
  if (!apiKey.trim()) {
    throw new Error('Нужен API-ключ Etherscan (VITE_ETHERSCAN_API_KEY).')
  }
  const focus = address.trim().toLowerCase()
  const base = etherscanBase()
  const rows: NormalizedTransfer[] = []
  let page = 1
  const offset = Math.min(100, maxRows)

  while (rows.length < maxRows) {
    const params = new URLSearchParams({
      chainid: '1',          // V2: Ethereum mainnet
      module: 'account',
      action: 'txlist',
      address: focus,
      startblock: '0',
      endblock: '99999999',
      page: String(page),
      offset: String(offset),
      sort: 'desc',
      apikey: apiKey.trim(),
    })
    // V2 endpoint: /v2/api
    const url = `${base}/v2/api?${params.toString()}`
    const data = (await fetchJsonCached(
      `etherscan:${focus}:p${page}`,
      url,
      undefined,
      page > 1 ? requestDelayMs : 0,
    )) as EtherscanResponse

    if (data.status === '0' && typeof data.result === 'string') {
      if (data.result.toLowerCase().includes('rate limit')) {
        throw new Error('Лимит Etherscan: снизьте частоту или подождите.')
      }
      if (data.result.toLowerCase().includes('invalid api key')) {
        throw new Error('Неверный API-ключ Etherscan.')
      }
      if (data.message === 'No transactions found') break
      throw new Error(data.result)
    }

    const list = Array.isArray(data.result) ? data.result : []
    if (list.length === 0) break

    for (const t of list) {
      if (rows.length >= maxRows) break
      if (t.isError === '1') continue
      const ts = Number(t.timeStamp)
      const wei = BigInt(t.value || '0')
      const eth = Number(wei) / 1e18
      const from = t.from.toLowerCase()
      const to = (t.to || '').toLowerCase()

      // Determine signed amount relative to focus address
      // Include zero-value txs (contract calls) — they still appear in the graph
      let amountNative: number
      if (to === focus) {
        amountNative = eth  // inflow (may be 0 for contract calls to focus)
      } else if (from === focus) {
        amountNative = -eth // outflow (may be 0 for contract calls from focus)
      } else {
        continue // unrelated
      }

      rows.push({
        id: t.hash,
        timestampSec: ts,
        from: from || null,   // already lowercase
        to: to || null,       // already lowercase
        amountNative,
        asset: 'ETH',
        rawRef: t.hash,
      })
    }
    if (list.length < offset) break
    page++
  }

  return rows
}
