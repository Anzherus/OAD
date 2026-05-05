import { parseImportedCsv, parseImportedJson } from '@/domain/import/csvJson'
import { buildFullReport, reportToJson } from '@/domain/report'
import {
  defaultAnalysisOptions,
  type AnalysisOptions,
  type NormalizedTransfer,
} from '@/domain/types'
import demoFixture from '@/fixtures/demo.json'
import { ChartsPanel } from '@/ui/components/ChartsPanel'
import { FlowPanel } from '@/ui/components/FlowPanel'
import { MetricStrip } from '@/ui/components/MetricStrip'
import { useCallback, useState } from 'react'

export function TraceImport() {
  const [focus, setFocus] = useState('focus_demo')
  const [options] = useState<AnalysisOptions>(defaultAnalysisOptions)
  const [graphMaxNodes] = useState(24)
  const [graphMaxEdges] = useState(40)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ReturnType<typeof buildFullReport> | null>(
    null,
  )

  const applyRows = useCallback(
    (rows: NormalizedTransfer[]) => {
      const r = buildFullReport(rows, focus.trim(), 'UNKNOWN', options, {
        maxNodes: graphMaxNodes,
        maxEdges: graphMaxEdges,
      })
      setReport(r)
    },
    [focus, graphMaxEdges, graphMaxNodes, options],
  )

  const loadDemo = () => {
    setError(null)
    try {
      const text = JSON.stringify(demoFixture)
      const { rows } = parseImportedJson(text)
      applyRows(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const onFile = async (file: File | null) => {
    if (!file) return
    setError(null)
    try {
      const text = await file.text()
      const lower = file.name.toLowerCase()
      const rows =
        lower.endsWith('.json')
          ? parseImportedJson(text).rows
          : parseImportedCsv(text).rows
      applyRows(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const exportJson = () => {
    if (!report) return
    const blob = new Blob([reportToJson(report)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `import-report.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadSampleCsv = () => {
    const csv = [
      'timestamp,amount,from,to,event_type',
      '2024-01-01T10:00:00Z,2.5,addr_alpha,focus_demo,wallet_receive',
      '2024-01-01T10:04:00Z,-0.8,focus_demo,addr_beta,transfer',
      '2024-01-01T10:05:00Z,-0.05,focus_demo,addr_beta,dust_split',
      '2024-01-02T09:00:00Z,1.5,addr_delta,focus_demo,wallet_receive',
      '2024-01-02T09:30:00Z,-0.75,focus_demo,addr_epsilon,transfer',
      '2024-01-03T07:00:00Z,5.0,addr_theta,focus_demo,wallet_receive',
      '2024-01-03T07:05:00Z,-2.0,focus_demo,addr_iota,transfer',
      '2024-01-03T07:10:00Z,-1.5,focus_demo,addr_kappa,transfer',
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-traces.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 text-left">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-50">Импорт следов</h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Загрузите CSV или JSON с колонками{' '}
          <code className="rounded bg-zinc-800 px-1 font-mono text-xs">
            timestamp, amount, from, to, event_type
          </code>
          . Суммы со знаком относительно фокуса: положительные — вход, отрицательные
          — выход (как после нормализации ончейн).
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Фокус (метка адреса)
          </label>
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className="mt-1 w-64 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm"
          />
        </div>
        <label className="cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">
          Выбрать файл
          <input
            type="file"
            accept=".csv,.json,application/json,text/csv"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          onClick={loadDemo}
          className="rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800"
        >
          Загрузить демо
        </button>
        <button
          type="button"
          onClick={exportJson}
          disabled={!report}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-100 disabled:opacity-50"
        >
          Экспорт JSON
        </button>
        <button
          type="button"
          onClick={downloadSampleCsv}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
        >
          Пример CSV ↓
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {report ? (
        <div className="space-y-10">
          {/* Graph — primary focus */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Граф потоков</h3>
                <p className="text-xs text-zinc-500">Топ рёбер по объёму · нажмите ⛶ для полного экрана</p>
              </div>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
                {report.rowCount} событий
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
              unit="нат."
              suspicion={report.suspicion}
            />
          </section>

          {/* Charts */}
          <section>
            <h3 className="mb-3 text-base font-semibold text-zinc-100">Статистические графики</h3>
            <ChartsPanel report={report} />
          </section>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Нет данных — загрузите файл или демо.</p>
      )}
    </div>
  )
}
