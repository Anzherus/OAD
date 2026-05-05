import { fetchEtherscanAddressTransfers } from '@/adapters/etherscan'
import { fetchMempoolAddressTransfers } from '@/adapters/mempool'
import {
  buildFullReport,
  reportToJson,
} from '@/domain/report'
import {
  type AnalysisOptions,
  defaultAnalysisOptions,
} from '@/domain/types'
import { ChartsPanel } from '@/ui/components/ChartsPanel'
import { FlowPanel } from '@/ui/components/FlowPanel'
import { MetricStrip } from '@/ui/components/MetricStrip'
import { useCallback, useMemo, useState } from 'react'

type Chain = 'BTC' | 'ETH'

function isLikelyEthAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(s.trim())
}

function isLikelyBtcAddress(s: string): boolean {
  const t = s.trim()
  return (
    /^(bc1|tb1|bcrt1)[a-zA-HJ-NP-Z0-9]{25,87}$/.test(t) ||
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(t) ||
    /^2[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(t)
  )
}

export function OnchainAnalysis() {
  const [chain, setChain] = useState<Chain>('BTC')
  const [address, setAddress] = useState('')
  const [options, setOptions] = useState<AnalysisOptions>(defaultAnalysisOptions)
  const [graphMaxNodes, setGraphMaxNodes] = useState(24)
  const [graphMaxEdges, setGraphMaxEdges] = useState(40)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ReturnType<typeof buildFullReport> | null>(
    null,
  )

  const etherscanKey = import.meta.env.VITE_ETHERSCAN_API_KEY ?? ''

  const hint = useMemo(() => {
    if (!address.trim()) return 'Введите адрес и нажмите «Загрузить и посчитать».'
    if (chain === 'ETH' && !etherscanKey)
      return 'Для ETH добавьте VITE_ETHERSCAN_API_KEY в .env (см. .env.example).'
    if (chain === 'BTC' && !isLikelyBtcAddress(address))
      return 'Адрес не похож на типичный BTC-адрес — проверьте сеть.'
    if (chain === 'ETH' && !isLikelyEthAddress(address))
      return 'Адрес не похож на Ethereum (0x…).'
    return null
  }, [address, chain, etherscanKey])

  const run = useCallback(async () => {
    setError(null)
    setReport(null)
    setLoading(true)
    try {
      const maxFetch = Math.min(500, options.maxRows + 50)
      const rows =
        chain === 'BTC'
          ? await fetchMempoolAddressTransfers(address, maxFetch, 120)
          : await fetchEtherscanAddressTransfers(
              address,
              maxFetch,
              etherscanKey,
              200,
            )
      const r = buildFullReport(rows, address.trim(), chain, options, {
        maxNodes: graphMaxNodes,
        maxEdges: graphMaxEdges,
      })
      setReport(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [address, chain, etherscanKey, graphMaxEdges, graphMaxNodes, options])

  const exportJson = () => {
    if (!report) return
    const blob = new Blob([reportToJson(report)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${report.focusAddress.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const unit = chain === 'BTC' ? 'BTC' : 'ETH'

  return (
    <div className="space-y-8 text-left">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-50">Ончейн-анализ</h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Загрузка истории адреса из публичных API, расчёт
          описательной статистики, временных паттернов и упрощённого графа
          потоков.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-1">
        {(['BTC', 'ETH'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChain(c)}
            className={[
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              chain === c
                ? 'bg-violet-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-100',
            ].join(' ')}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Адрес
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={chain === 'BTC' ? 'bc1… или 1…' : '0x…'}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none ring-violet-500/30 focus:ring-2"
          />
          {hint ? (
            <p className="text-sm text-amber-200/90">{hint}</p>
          ) : null}
        </div>
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Лимиты
          </div>
          <label className="flex items-center justify-between gap-2 text-sm text-zinc-300">
            Макс. строк
            <input
              type="number"
              min={10}
              max={500}
              value={options.maxRows}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  maxRows: Number(e.target.value) || o.maxRows,
                }))
              }
              className="w-24 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-sm text-zinc-300">
            Порог пыли ({unit})
            <input
              type="text"
              inputMode="decimal"
              value={String(options.dustThresholdNative)}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  dustThresholdNative: Number(e.target.value) || 0,
                }))
              }
              className="w-28 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-sm text-zinc-300">
            Окно всплеска (сек)
            <input
              type="number"
              min={60}
              value={options.burstWindowSec}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  burstWindowSec: Number(e.target.value) || o.burstWindowSec,
                }))
              }
              className="w-24 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-sm text-zinc-300">
            Узлов графа
            <input
              type="number"
              min={4}
              max={80}
              value={graphMaxNodes}
              onChange={(e) => setGraphMaxNodes(Number(e.target.value) || 24)}
              className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-sm text-zinc-300">
            Рёбер графа
            <input
              type="number"
              min={4}
              max={120}
              value={graphMaxEdges}
              onChange={(e) => setGraphMaxEdges(Number(e.target.value) || 40)}
              className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading || !address.trim()}
          className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Загрузка…' : 'Загрузить и посчитать'}
        </button>
        <button
          type="button"
          onClick={exportJson}
          disabled={!report}
          className="rounded-lg border border-zinc-600 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Экспорт JSON
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-xl bg-zinc-800/60" />
          <div className="h-64 animate-pulse rounded-xl bg-zinc-800/60" />
        </div>
      ) : null}

      {report && !loading ? (
        <div className="space-y-10">
          {report.truncated ? (
            <p className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-2 text-sm text-amber-200/90">
              Показаны только последние {report.rowCount} событий (лимит в настройках).
            </p>
          ) : null}

          {/* Graph — primary focus */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Граф потоков</h3>
                <p className="text-xs text-zinc-500">Топ рёбер по объёму · нажмите ⛶ для полного экрана</p>
              </div>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
                {report.rowCount} событий · {report.asset}
              </span>
            </div>
            <FlowPanel graph={report.graph} />
          </section>

          {/* Metrics */}
          <section>
            <h3 className="mb-3 text-base font-semibold text-zinc-100">Сводные метрики</h3>
            <MetricStrip
              describe={report.describe}
              flags={report.flags}
              unit={unit}
              suspicion={report.suspicion}
            />
          </section>

          {/* Charts */}
          <section>
            <h3 className="mb-3 text-base font-semibold text-zinc-100">Статистические графики</h3>
            <ChartsPanel report={report} />
          </section>
        </div>
      ) : null}
    </div>
  )
}
