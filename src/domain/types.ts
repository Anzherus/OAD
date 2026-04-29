export type AssetSymbol = 'BTC' | 'ETH' | 'UNKNOWN'

/** Unified ledger row for statistics (on-chain or imported). */
export type NormalizedTransfer = {
  id: string
  timestampSec: number
  /** Counterparty or related address when known */
  from: string | null
  to: string | null
  /** Signed: positive = inflow to focus, negative = outflow */
  amountNative: number
  asset: AssetSymbol
  /** Optional label for off-chain events */
  eventType?: string
  rawRef?: string
}

export type AnalysisOptions = {
  /** Max transactions to analyze (newest first after sort) */
  maxRows: number
  /** Dust threshold in native units (BTC or ETH) */
  dustThresholdNative: number
  /** Burst window in seconds */
  burstWindowSec: number
  /** Min events in window to flag burst */
  burstMinEvents: number
}

export const defaultAnalysisOptions: AnalysisOptions = {
  maxRows: 200,
  dustThresholdNative: 0.00001,
  burstWindowSec: 3600,
  burstMinEvents: 8,
}

export type DescribeStats = {
  count: number
  sumIn: number
  sumOut: number
  net: number
  meanAbs: number
  medianAbs: number
  stdevAbs: number
  q1Abs: number
  q3Abs: number
  dustShare: number
  maxAbs: number
}

export type TemporalStats = {
  intervalsSec: number[]
  medianIntervalSec: number
  burstWindows: { startSec: number; endSec: number; count: number }[]
}

export type BenfordResult = {
  digitDistribution: Record<number, number>
  expectedBenford: Record<number, number>
  mad: number
  /** Rough label for teaching UI */
  conformity: 'rough_match' | 'weak' | 'insufficient_data'
}

export type HeuristicFlags = {
  highBurstiness: boolean
  dustHeavy: boolean
  largeOutlier: boolean
}

export type GraphEdge = {
  source: string
  target: string
  weight: number
  txIds: string[]
}

export type TransactionGraph = {
  nodes: { id: string; label: string; isFocus: boolean }[]
  edges: GraphEdge[]
}

export type FullReport = {
  generatedAtIso: string
  focusAddress: string
  asset: AssetSymbol
  options: AnalysisOptions
  rowCount: number
  truncated: boolean
  describe: DescribeStats
  temporal: TemporalStats
  benford: BenfordResult | null
  flags: HeuristicFlags
  graph: TransactionGraph
}
