import type { DescribeStats, HeuristicFlags } from '@/domain/types'

const fmt = (n: number, digits = 6) =>
  Number.isFinite(n) ? n.toLocaleString('ru-RU', { maximumFractionDigits: digits }) : '—'

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
}: {
  describe: DescribeStats
  flags: HeuristicFlags
  unit: string
}) {
  const netAccent =
    describe.net > 0 ? 'green' : describe.net < 0 ? 'red' : undefined

  return (
    <div className="space-y-4">
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
