import type {
  BenfordResult,
  CounterpartyConcentrationStats,
  DescribeStats,
  HeuristicFlags,
  SuspicionBreakdown,
  SuspicionScore,
  TemporalStats,
} from '../types'

/**
 * Эвристический индекс «подозрительности» по совокупности уже посчитанной статистики (0–100%).
 * Не является вероятностью проступка — только сводка для выделения паттернов.
 *
 * Обозначения: I[условие] = 1 если истина, иначе 0; clamp(x,a,b) = min(b, max(a,x)).
 *
 * Сырой балл (до ограничения сверху):
 *
 *   S_raw = s_burst + s_dust + s_outlier + s_benford + s_conc + s_trunc
 *
 *   • s_burst — временные всплески:
 *       s_burst = 22·I[W > 0] + min(10, 5·max(0, W − 1)),
 *     где W — число обнаруженных окон всплесков.
 *
 *   • s_dust — доля пыли D = dustShare ∈ [0, 1]:
 *       s_dust = 24 · clamp((D − 0,18) / (0,50 − 0,18), 0, 1).
 *     При D ≤ 18% вклад 0; при D ≥ 50% вклад полный (24).
 *
 *   • s_outlier — крупный выброс по суммам (флаг largeOutlier):
 *       s_outlier = 16 · I[outlier].
 *
 *   • s_benford — расхождение распределения первых цифр с законом Бенфорда (MAD из теста).
 *     Если данных мало (conformity === 'insufficient_data') или benford === null → 0.
 *       s_benford = 18 · clamp((M − 0,014) / (0,056 − 0,014), 0, 1).
 *     При M ≤ 0,014 → 0; при M ≥ 0,056 → полный вклад 18.
 *
 *   • s_conc — концентрация объёма между контрагентами (нормированный HHI*, N ≥ 2):
 *       s_conc = 17 · H* · I[N ≥ 2],   H* = hhiNormalized.
 *     Один контрагент (N < 2) → вклад 0.
 *
 *   • s_trunc — выборка обрезана по maxRows:
 *       s_trunc = 5 · I[truncated].
 *
 * Итоговый процент: P = min(100, round(S_raw)).
 *
 * Метка уровня: низкий P≤25, умеренный ≤50, повышенный ≤75, высокий >75.
 */
export function computeSuspicionScore(
  describe: DescribeStats,
  temporal: TemporalStats,
  benford: BenfordResult | null,
  flags: HeuristicFlags,
  concentration: CounterpartyConcentrationStats,
  truncated: boolean,
): SuspicionScore {
  const W = temporal.burstWindows.length
  const burstPoints = (W > 0 ? 22 : 0) + Math.min(10, 5 * Math.max(0, W - 1))

  const D = describe.dustShare
  const dustPoints = 24 * clamp((D - 0.18) / (0.5 - 0.18), 0, 1)

  const outlierPoints = flags.largeOutlier ? 16 : 0

  let benfordPoints = 0
  if (benford && benford.conformity !== 'insufficient_data') {
    benfordPoints = 18 * clamp((benford.mad - 0.014) / (0.056 - 0.014), 0, 1)
  }

  const N = concentration.counterpartiesCount
  const concPoints =
    N >= 2 ? 17 * clamp(concentration.hhiNormalized, 0, 1) : 0

  const truncPoints = truncated ? 5 : 0

  const rawSum =
    burstPoints +
    dustPoints +
    outlierPoints +
    benfordPoints +
    concPoints +
    truncPoints

  const percent = Math.min(100, Math.round(rawSum))

  const breakdown: SuspicionBreakdown = {
    burstPoints,
    dustPoints,
    outlierPoints,
    benfordPoints,
    concentrationPoints: concPoints,
    dataQualityPoints: truncPoints,
    rawSum,
  }

  const label: SuspicionScore['label'] =
    percent <= 25
      ? 'низкий'
      : percent <= 50
        ? 'умеренный'
        : percent <= 75
          ? 'повышенный'
          : 'высокий'

  return { percent, label, breakdown }
}

function clamp(x: number, lo: number, hi: number): number {
  if (!Number.isFinite(x)) return lo
  return Math.min(hi, Math.max(lo, x))
}
