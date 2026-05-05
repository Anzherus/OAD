import type { FullReport } from '@/domain/types'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function histogram(values: number[], bins: number): { x: string; count: number }[] {
  if (values.length === 0) return []
  const mx = Math.max(...values, 1)
  const step = mx / bins
  const counts = new Array(bins).fill(0)
  for (const v of values) {
    const i = Math.min(bins - 1, Math.floor(v / step))
    counts[i] = (counts[i] ?? 0) + 1
  }
  return counts.map((c, i) => ({
    x: `${(i * step).toFixed(0)}–${((i + 1) * step).toFixed(0)}s`,
    count: c,
  }))
}

function formatTs(sec: number): string {
  const d = new Date(sec * 1000)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function ChartsPanel({ report }: { report: FullReport }) {
  const intervalData = histogram(report.temporal.intervalsSec, 12)

  const benford = report.benford
  const benfordBars =
    benford && benford.conformity !== 'insufficient_data'
      ? Object.entries(benford.digitDistribution).map(([d, c]) => ({
          digit: d,
          count: c as number,
          expected: Math.round((benford.expectedBenford[Number(d)] ?? 0) * report.rowCount),
        }))
      : []

  // For timeline we use the burst windows data
  const burstData = report.temporal.burstWindows.map((w, i) => ({
    name: `Всплеск ${i + 1}`,
    count: w.count,
    start: formatTs(w.startSec),
  }))

  // Scatter: abs amounts (we reconstruct from describe percentiles as reference lines)
  const { q1Abs, medianAbs, q3Abs, meanAbs, maxAbs } = report.describe

  const conc = report.concentration
  const shareBarData = conc.topShares.map((r) => ({
    ...r,
    sharePct: Math.round(r.share * 10000) / 100,
  }))
  const lorenzSeries = conc.lorenz.map((p) => ({
    ...p,
    ideal: p.x,
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Counterparty concentration — full width */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 lg:col-span-2">
        <h3 className="mb-1 text-left text-sm font-semibold text-zinc-200">
          Концентрация контрагентов по объёму (|сумма|)
        </h3>
        {conc.counterpartiesCount === 0 ? (
          <p className="text-left text-sm text-zinc-500">Нет связанных контрагентов с ненулевым объёмом.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="min-h-64 w-full">
              <p className="mb-2 text-left text-xs font-medium text-zinc-500">Топ долей объёма (%)</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shareBarData}
                    layout="vertical"
                    margin={{ left: 8, right: 8, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 'dataMax']}
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      unit="%"
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={108}
                      tick={{ fill: '#a1a1aa', fontSize: 9 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        fontSize: 12,
                      }}
                      formatter={(value: unknown, _n, item) => {
                        const row = (item as { payload?: { volume?: number } })?.payload
                        const v =
                          typeof row?.volume === 'number'
                            ? row.volume.toLocaleString('ru-RU', {
                                maximumFractionDigits: 8,
                              })
                            : ''
                        return [`${String(value)}%`, v ? `объём ${v}` : '']
                      }}
                    />
                    <Bar dataKey="sharePct" fill="#22d3ee" radius={[0, 4, 4, 0]} name="доля %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="min-h-64 w-full">
              <p className="mb-2 text-left text-xs font-medium text-zinc-500">
                Кривая Лоренца (неравенство объёма между адресами)
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lorenzSeries} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      domain={[0, 1]}
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
                      label={{
                        value: 'доля контрагентов (по счёту)',
                        fill: '#71717a',
                        fontSize: 10,
                        position: 'insideBottom',
                        offset: -4,
                      }}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
                      label={{
                        value: 'накопл. объём',
                        fill: '#71717a',
                        angle: -90,
                        position: 'insideLeft',
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        fontSize: 12,
                      }}
                      formatter={(v: unknown, name: unknown) => [
                        `${(Number(v) * 100).toFixed(1)}%`,
                        String(name) === 'ideal' ? 'равномерно' : 'факт',
                      ]}
                      labelFormatter={(lx) => `контрагенты: ${(Number(lx) * 100).toFixed(0)}%`}
                    />
                    <Line
                      type="linear"
                      dataKey="ideal"
                      stroke="#52525b"
                      strokeDasharray="5 5"
                      dot={false}
                      name="равномерно"
                      strokeWidth={1.5}
                    />
                    <Line
                      type="stepAfter"
                      dataKey="y"
                      stroke="#f472b6"
                      dot={false}
                      name="факт"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        {conc.counterpartiesCount > 0 ? (
          <p className="mt-4 text-left text-xs text-zinc-500">
            Контрагентов (N): {conc.counterpartiesCount} · HHI: {conc.hhi.toFixed(4)}
            {conc.counterpartiesCount > 1
              ? ` · HHI* (норм. 0–1): ${conc.hhiNormalized.toFixed(4)}`
              : ''}
            {' · '}
            H (Шеннон): {conc.entropyBits.toFixed(3)} бит (макс. log₂N ≈ {conc.maxEntropyBits.toFixed(3)}) ·
            относит. равномерность: {(conc.relativeUniformity * 100).toFixed(1)}%
          </p>
        ) : null}
      </div>

      {/* Intervals histogram */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h3 className="mb-3 text-left text-sm font-semibold text-zinc-200">
          Интервалы между событиями (сек.)
        </h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={intervalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="x" tick={{ fill: '#a1a1aa', fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }} />
              <Bar dataKey="count" fill="#7c6cf8" radius={[4, 4, 0, 0]} name="кол-во" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-left text-xs text-zinc-500">
          Медиана интервала: {report.temporal.medianIntervalSec.toLocaleString('ru-RU')} сек.
          {report.temporal.burstWindows.length > 0
            ? ` · Всплесков: ${report.temporal.burstWindows.length}`
            : ''}
        </p>
      </div>

      {/* Benford */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h3 className="mb-3 text-left text-sm font-semibold text-zinc-200">
          Закон Бенфорда (первая значащая цифра сумм)
        </h3>
        {benfordBars.length === 0 ? (
          <p className="text-left text-sm text-zinc-500">
            Недостаточно данных для устойчивой проверки (нужно ≥ 30 ненулевых сумм).
          </p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benfordBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="digit" tick={{ fill: '#a1a1aa' }} />
                <YAxis tick={{ fill: '#a1a1aa' }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }} />
                <Bar dataKey="count" fill="#34d399" name="наблюдаемо" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expected" fill="#fbbf24" name="ожидание (Бенфорд)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {benford ? (
          <p className="mt-2 text-left text-xs text-zinc-500">
            MAD ≈ {benford.mad.toFixed(4)} · соответствие: {
              benford.conformity === 'rough_match' ? 'приблизительное' :
              benford.conformity === 'weak' ? 'слабое' : 'недостаточно данных'
            }
          </p>
        ) : null}
      </div>

      {/* Percentile reference chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h3 className="mb-3 text-left text-sm font-semibold text-zinc-200">
          Распределение сумм — квартили
        </h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: 'Q1', value: q1Abs },
                { name: 'Медиана', value: medianAbs },
                { name: 'Среднее', value: meanAbs },
                { name: 'Q3', value: q3Abs },
                { name: 'Макс', value: maxAbs },
              ]}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis type="number" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={60} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }}
                formatter={(v: unknown) => (typeof v === 'number' ? v.toLocaleString('ru-RU', { maximumFractionDigits: 8 }) : String(v))}
              />
              <Bar dataKey="value" fill="#a78bfa" radius={[0, 4, 4, 0]} name="значение" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-left text-xs text-zinc-500">
          IQR = {(q3Abs - q1Abs).toLocaleString('ru-RU', { maximumFractionDigits: 8 })}
          {report.describe.stdevAbs > 0
            ? ` · σ = ${report.describe.stdevAbs.toLocaleString('ru-RU', { maximumFractionDigits: 8 })}`
            : ''}
        </p>
      </div>

      {/* Burst windows or interval line */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h3 className="mb-3 text-left text-sm font-semibold text-zinc-200">
          {burstData.length > 0 ? 'Всплески активности' : 'Интервалы — линейный ряд'}
        </h3>
        {burstData.length > 0 ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={burstData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }}
                  formatter={(v: unknown) => [`${String(v)} событий`, 'Кол-во']}
                  labelFormatter={(l: unknown, payload: readonly { payload?: unknown }[]) => {
                    const item = (payload?.[0]?.payload) as { start?: string } | undefined
                    return `${String(l)} (с ${item?.start ?? ''})`
                  }}
                />
                <Bar dataKey="count" fill="#f87171" radius={[4, 4, 0, 0]} name="событий" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={report.temporal.intervalsSec.map((v, i) => ({ i: i + 1, sec: v }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="i" tick={{ fill: '#a1a1aa', fontSize: 10 }} label={{ value: '№ пары', fill: '#71717a', fontSize: 10, position: 'insideBottomRight', offset: -4 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }} formatter={(v: unknown) => [`${String(v)} сек`, 'Интервал']} />
                <ReferenceLine y={report.temporal.medianIntervalSec} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: 'медиана', fill: '#fbbf24', fontSize: 10 }} />
                <Line type="monotone" dataKey="sec" stroke="#7c6cf8" dot={false} strokeWidth={1.5} name="интервал" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {burstData.length === 0 && (
          <p className="mt-2 text-left text-xs text-zinc-500">
            Всплесков не обнаружено при текущих настройках окна.
          </p>
        )}
      </div>
    </div>
  )
}
