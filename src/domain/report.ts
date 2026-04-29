import { benfordFirstDigit } from './stats/benford'
import { describeTransfers } from './stats/describe'
import { computeFlags } from './stats/flags'
import { temporalFromTransfers } from './stats/temporal'
import { buildTransactionGraph } from './graph/buildGraph'
import type {
  AnalysisOptions,
  AssetSymbol,
  FullReport,
  NormalizedTransfer,
} from './types'

export function buildFullReport(
  rowsInput: NormalizedTransfer[],
  focusAddress: string,
  asset: AssetSymbol,
  options: AnalysisOptions,
  graphLimits: { maxNodes: number; maxEdges: number },
): FullReport {
  const sorted = [...rowsInput].sort((a, b) => b.timestampSec - a.timestampSec)
  const truncated = sorted.length > options.maxRows
  const rows = sorted.slice(0, options.maxRows)

  const describe = describeTransfers(rows, options.dustThresholdNative)
  const temporal = temporalFromTransfers(
    rows,
    options.burstWindowSec,
    options.burstMinEvents,
  )
  const benford =
    rows.length >= 10 ? benfordFirstDigit(rows) : null
  const flags = computeFlags(describe, temporal)
  const graph = buildTransactionGraph(
    rows,
    focusAddress,
    graphLimits.maxNodes,
    graphLimits.maxEdges,
  )

  return {
    generatedAtIso: new Date().toISOString(),
    focusAddress,
    asset,
    options,
    rowCount: rows.length,
    truncated,
    describe,
    temporal,
    benford,
    flags,
    graph,
  }
}

export function reportToJson(report: FullReport): string {
  return JSON.stringify(report, null, 2)
}
