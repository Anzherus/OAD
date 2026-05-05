import type { DescribeStats, HeuristicFlags, SuspicionScore } from '@/domain/types'

const fmt = (n: number, digits = 6) =>
  Number.isFinite(n) ? n.toLocaleString('ru-RU', { maximumFractionDigits: digits }) : '—'

function SuspicionBlock({ suspicion }: { suspicion: SuspicionScore }) {
  const { percent, label, breakdown } = suspicion
  const barColor =
    percent <= 25
      ? 'bg-emerald-500'
      : percent <= 50
        ? 'bg-amber-500'
        : percent <= 75
          ? 'bg-orange-500'
          : 'bg-red-500'

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-4 text-left">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Эвристический индекс подозрительности
          </div>
          <p className="mt-1 max-w-xl text-xs text-zinc-500">
            Сводная оценка 0–100% по уже посчитанным метрикам; не означает вину. Уровень:{' '}
            <span className="font-semibold text-zinc-300">{label}</span>
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-bold tabular-nums text-zinc-50">{percent}</span>
          <span className="pb-1 text-lg text-zinc-500">%</span>
        </div>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <div className="mt-4 grid gap-2 text-[11px] text-zinc-500 sm:grid-cols-2 lg:grid-cols-3">
        <BreakdownRow k="Всплески" v={breakdown.burstPoints} />
        <BreakdownRow k="Пыль (градация)" v={breakdown.dustPoints} />
        <BreakdownRow k="Крупный выброс сумм" v={breakdown.outlierPoints} />
        <BreakdownRow k="Бенфорд (MAD)" v={breakdown.benfordPoints} />
        <BreakdownRow k="Концентрация объёма (HHI*)" v={breakdown.concentrationPoints} />
        <BreakdownRow k="Обрезка выборки" v={breakdown.dataQualityPoints} />
      </div>
      <p className="mt-2 text-[11px] text-zinc-600">
        Σ баллов до ограничения 100%: {breakdown.rawSum.toFixed(1)} · см. suspicionScore.ts (формула)
      </p>
    </div>
  )
}

function BreakdownRow({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between gap-2 rounded border border-zinc-800/80 bg-zinc-950/40 px-2 py-1.5">
      <span>{k}</span>
      <span className="font-mono text-zinc-400">+{v.toFixed(1)}</span>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'green' | 'red' | 'amber' | 'violet'
}) {
  const valueColor =
    accent === 'green'
      ? 'text-emerald-300'
      : accent === 'red'
        ? 'text-red-300'
        : accent === 'amber'
          ? 'text-amber-300'
          : accent === 'violet'
            ? 'text-violet-300'
            : 'text-zinc-100'

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold leading-tight ${valueColor}`}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-zinc-600">{sub}</div> : null}
    </div>
  )
}

function FlagBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={[
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
        active
          ? 'border border-amber-700/50 bg-amber-950/30 text-amber-200'
          : 'border border-zinc-800 bg-zinc-900/30 text-zinc-500',
      ].join(' ')}
    >
      <span
        className={[
          'h-2 w-2 shrink-0 rounded-full',
          active ? 'bg-amber-400' : 'bg-zinc-700',
        ].join(' ')}
      />
      {label}
    </div>
  )
}

export function MetricStrip({
  describe,
  flags,
  unit,
  suspicion,
}: {
  describe: DescribeStats
  flags: HeuristicFlags
  unit: string
  suspicion: SuspicionScore
}) {
  const netAccent =
    describe.net > 0 ? 'green' : describe.net < 0 ? 'red' : undefined

  return (
    <div className="space-y-4">
      <SuspicionBlock suspicion={suspicion} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Событий"
          value={String(describe.count)}
        />
        <MetricCard
          label={`Вход (${unit})`}
          value={fmt(describe.sumIn)}
          accent="green"
        />
        <MetricCard
          label={`Выход (${unit})`}
          value={fmt(describe.sumOut)}
          accent="red"
        />
        <MetricCard
          label={`Чистый поток`}
          value={fmt(describe.net)}
          sub={unit}
          accent={netAccent}
        />
        <MetricCard
          label="Медиана |Δ|"
          value={fmt(describe.medianAbs)}
          sub={unit}
        />
        <MetricCard
          label="Доля «пыли»"
          value={`${(describe.dustShare * 100).toFixed(1)}%`}
          accent={describe.dustShare > 0.35 ? 'amber' : undefined}
        />
      </div>

      {/* Flags row */}
      <div className="grid gap-2 sm:grid-cols-3">
        <FlagBadge active={flags.highBurstiness} label="Всплеск активности" />
        <FlagBadge active={flags.dustHeavy} label="Много пыли (> 35%)" />
        <FlagBadge active={flags.largeOutlier} label="Крупный выброс" />
      </div>
      <p className="text-xs text-zinc-600">
        Эвристики — индикаторы для внимания аналитика, не доказательство.
      </p>
    </div>
  )
}
