export function AboutMethods() {
  return (
    <article className="space-y-10 text-left">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-50">О методах</h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Приложение демонстрирует применение базовых статистических методов к
          нормализованным «цифровым следам» транзакций криптовалют. Ниже —
          краткое описание каждого метода, его математической основы и
          интерпретации результатов в контексте криминалистики.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-amber-200/80">
          Важно: выводы носят учебный характер и не являются криминалистическим
          заключением. Реальные дела требуют процессуального оформления,
          контроля цепочки хранения данных (chain of custody) и экспертизы.
        </p>
      </div>

      {/* Descriptive stats */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-100">
          1. Описательная статистика сумм
        </h3>
        <p className="max-w-3xl text-sm text-zinc-400">
          Для каждого набора транзакций вычисляются базовые меры центральной
          тенденции и разброса по абсолютным значениям сумм |Δ|:
        </p>
        <ul className="ml-4 list-disc space-y-1 text-sm text-zinc-400">
          <li>
            <span className="font-medium text-zinc-200">Среднее (mean)</span> —
            чувствительно к выбросам; резкое превышение над медианой указывает
            на крупные нетипичные транзакции.
          </li>
          <li>
            <span className="font-medium text-zinc-200">Медиана</span> —
            устойчивая оценка «типичной» суммы; используется как базовая линия
            при сравнении с другими адресами.
          </li>
          <li>
            <span className="font-medium text-zinc-200">
              Стандартное отклонение (σ)
            </span>{' '}
            — мера разброса; высокое σ при малой медиане говорит о
            неоднородности потоков.
          </li>
          <li>
            <span className="font-medium text-zinc-200">
              Квартили Q1 / Q3 и IQR
            </span>{' '}
            — межквартильный размах IQR = Q3 − Q1 используется для выявления
            выбросов по правилу Тьюки: значения выше Q3 + 3·IQR считаются
            «крайними выбросами».
          </li>
          <li>
            <span className="font-medium text-zinc-200">Доля «пыли»</span> —
            доля транзакций ниже порога (по умолчанию 0,00001 нат. ед.).
            Высокая доля пыли (&gt; 35 %) может указывать на dust-атаку или
            автоматизированное дробление.
          </li>
        </ul>
      </section>

      {/* Temporal */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-100">
          2. Временной анализ (temporal analysis)
        </h3>
        <p className="max-w-3xl text-sm text-zinc-400">
          Транзакции сортируются по времени, вычисляются интервалы Δt между
          соседними событиями. Анализируются:
        </p>
        <ul className="ml-4 list-disc space-y-1 text-sm text-zinc-400">
          <li>
            <span className="font-medium text-zinc-200">
              Распределение интервалов
            </span>{' '}
            — гистограмма позволяет визуально отличить равномерный (ручной)
            ввод от пачечного (автоматизированного) поведения.
          </li>
          <li>
            <span className="font-medium text-zinc-200">
              Медиана интервала
            </span>{' '}
            — устойчивая оценка «ритма» адреса. Медиана &lt; 60 сек при
            большом числе транзакций — признак бота или скрипта.
          </li>
          <li>
            <span className="font-medium text-zinc-200">
              Всплески (burst windows)
            </span>{' '}
            — скользящее окно фиксированной ширины (по умолчанию 3600 сек).
            Если в окне ≥ N событий (по умолчанию 8), окно помечается как
            «всплеск». Метод аналогичен sliding-window burst detection,
            применяемому в анализе сетевого трафика.
          </li>
        </ul>
      </section>

      {/* Benford */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-100">
          3. Закон Бенфорда (Benford's Law)
        </h3>
        <p className="max-w-3xl text-sm text-zinc-400">
          Закон Бенфорда утверждает, что в наборах «естественных» числовых
          данных первая значащая цифра d встречается с вероятностью:
        </p>
        <pre className="rounded-lg bg-zinc-900 px-4 py-3 font-mono text-sm text-violet-300">
          P(d) = log₁₀(1 + 1/d),  d ∈ &#123;1…9&#125;
        </pre>
        <p className="max-w-3xl text-sm text-zinc-400">
          Для оценки отклонения используется{' '}
          <span className="font-medium text-zinc-200">
            MAD (Mean Absolute Deviation)
          </span>{' '}
          по методике Нигрини:
        </p>
        <pre className="rounded-lg bg-zinc-900 px-4 py-3 font-mono text-sm text-violet-300">
          MAD = (1/9) · Σ |obs(d) − P(d)|
        </pre>
        <ul className="ml-4 list-disc space-y-1 text-sm text-zinc-400">
          <li>MAD &lt; 0,015 — приблизительное соответствие закону.</li>
          <li>MAD &gt; 0,05 — слабое соответствие, возможна аномалия.</li>
          <li>
            Требуется ≥ 30 ненулевых значений; при меньшем объёме результат
            ненадёжен.
          </li>
          <li>
            Отклонение от закона Бенфорда не является доказательством
            мошенничества — оно лишь указывает на необходимость дополнительной
            проверки.
          </li>
        </ul>
      </section>

      {/* Graph */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-100">
          4. Граф потоков транзакций
        </h3>
        <p className="max-w-3xl text-sm text-zinc-400">
          Транзакции представляются как направленный взвешенный граф G = (V, E),
          где вершины — адреса, рёбра — агрегированные потоки между ними,
          вес ребра — суммарный объём переводов.
        </p>
        <ul className="ml-4 list-disc space-y-1 text-sm text-zinc-400">
          <li>
            <span className="font-medium text-zinc-200">Фокусный адрес</span>{' '}
            выделен в центре; входящие рёбра — от контрагентов к фокусу,
            исходящие — от фокуса к получателям.
          </li>
          <li>
            Отображаются только топ-N рёбер по весу (настраивается), чтобы
            снизить визуальный шум.
          </li>
          <li>
            В реальных расследованиях граф расширяется на несколько «хопов»
            (hop analysis) для выявления кластеров связанных адресов.
          </li>
          <li>
            Граф интерактивен: узлы можно перетаскивать, масштабировать
            колесом мыши, использовать миникарту для навигации.
          </li>
        </ul>
      </section>

      {/* Heuristics */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-100">
          5. Эвристические флаги
        </h3>
        <p className="max-w-3xl text-sm text-zinc-400">
          На основе вычисленных метрик формируются три бинарных флага —
          индикаторы, требующие внимания аналитика:
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="py-2 pr-6 text-left font-medium text-zinc-300">Флаг</th>
                <th className="py-2 pr-6 text-left font-medium text-zinc-300">Условие</th>
                <th className="py-2 text-left font-medium text-zinc-300">Возможная интерпретация</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              <tr>
                <td className="py-2 pr-6 font-mono text-violet-300">highBurstiness</td>
                <td className="py-2 pr-6 text-zinc-400">Есть хотя бы одно burst-окно</td>
                <td className="py-2 text-zinc-400">Автоматизированная активность, mixing-сервис</td>
              </tr>
              <tr>
                <td className="py-2 pr-6 font-mono text-violet-300">dustHeavy</td>
                <td className="py-2 pr-6 text-zinc-400">Доля пыли &gt; 35 %</td>
                <td className="py-2 text-zinc-400">Dust-атака, дробление для деанонимизации</td>
              </tr>
              <tr>
                <td className="py-2 pr-6 font-mono text-violet-300">largeOutlier</td>
                <td className="py-2 pr-6 text-zinc-400">max &gt; Q3 + 3·IQR при n ≥ 5</td>
                <td className="py-2 text-zinc-400">Крупная нетипичная транзакция, возможный вывод средств</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Suspicion score formula */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-100">
          6. Эвристический индекс подозрительности (рейтинг кошелька)
        </h3>
        <p className="max-w-3xl text-sm text-zinc-400">
          На сводной панели показывается целое число{' '}
          <span className="font-medium text-zinc-200">P от 0 до 100 %</span> —
          не вероятность проступка и не криминалистическое заключение, а суммарная
          оценка «на что обратить внимание» по уже посчитанным метрикам. Исходный
          код:{' '}
          <code className="rounded bg-zinc-800 px-1 font-mono text-xs text-zinc-300">
            src/domain/stats/suspicionScore.ts
          </code>
          .
        </p>
        <p className="max-w-3xl text-sm text-zinc-400">
          Обозначения:{' '}
          <span className="font-mono text-violet-300/90">I[условие]</span> = 1,
          если условие выполняется, иначе 0;{' '}
          <span className="font-mono text-violet-300/90">clamp(x, a, b)</span> =
          min(b, max(a, x)).
        </p>
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-sm font-medium text-zinc-200">Шаг 1. Сырой балл</p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 px-4 py-3 font-mono text-sm leading-relaxed text-violet-300">
{`S_raw = s_burst + s_dust + s_outlier + s_benford + s_conc + s_trunc`}
          </pre>
          <p className="text-sm text-zinc-400">Компоненты (все неотрицательные):</p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-900 px-4 py-3 font-mono text-[13px] leading-relaxed text-violet-300">
{`s_burst   = 22·I[W > 0] + min(10, 5·max(0, W − 1))
            W — число окон всплесков активности

s_dust    = 24 · clamp((D − 0.18) / (0.50 − 0.18), 0, 1)
            D — доля пыли (0…1); при D ≤ 18% вклад 0, при D ≥ 50% вклад 24

s_outlier = 16 · I[крупный выброс суммы — тот же критерий, что флаг largeOutlier]

s_benford = 0  (если теста Бенфорда нет или недостаточно данных)
          = 18 · clamp((M − 0.014) / (0.056 − 0.014), 0, 1)  иначе
            M — MAD отклонения от закона Бенфорда

s_conc    = 17 · H* · I[N ≥ 2]
            H* — нормированный индекс Херфиндаля (hhiNormalized),
            N — число уникальных контрагентов по объёму

s_trunc   = 5 · I[выборка усечена по лимиту «макс. строк» в настройках]`}
          </pre>
          <p className="text-sm font-medium text-zinc-200">Шаг 2. Итог в процентах</p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 px-4 py-3 font-mono text-sm leading-relaxed text-violet-300">
{`P = min(100, round(S_raw))`}
          </pre>
          <p className="text-sm text-zinc-400">
            Уровень текстовой метки:{' '}
            <span className="text-zinc-300">низкий</span> при P ≤ 25;
            <span className="text-zinc-300"> умеренный</span> при 26–50;
            <span className="text-zinc-300"> повышенный</span> при 51–75;
            <span className="text-zinc-300"> высокий</span> при P &gt; 75.
          </p>
        </div>
      </section>

      {/* Data sources */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-100">Источники данных</h3>
        <ul className="ml-4 list-disc space-y-1 text-sm text-zinc-400">
          <li>
            <span className="font-medium text-zinc-200">Bitcoin:</span> публичный
            REST API{' '}
            <a
              href="https://mempool.space/docs/api"
              target="_blank"
              rel="noreferrer"
              className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
            >
              mempool.space
            </a>
            . Ключ не требуется.
          </li>
          <li>
            <span className="font-medium text-zinc-200">Ethereum:</span>{' '}
            <a
              href="https://docs.etherscan.io/"
              target="_blank"
              rel="noreferrer"
              className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
            >
              Etherscan API
            </a>
            . Требуется бесплатный ключ{' '}
            <code className="rounded bg-zinc-800 px-1 font-mono text-xs text-zinc-300">
              VITE_ETHERSCAN_API_KEY
            </code>{' '}
            в файле{' '}
            <code className="rounded bg-zinc-800 px-1 font-mono text-xs text-zinc-300">
              .env
            </code>
            .
          </li>
          <li>
            <span className="font-medium text-zinc-200">Импорт файлов</span> —
            CSV или JSON с полями{' '}
            <code className="rounded bg-zinc-800 px-1 font-mono text-xs text-zinc-300">
              timestamp, amount, from, to, event_type
            </code>
            . Имитирует экспорт с носителя или из внешнего инструмента.
          </li>
        </ul>
      </section>

      {/* Limitations */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-100">Ограничения</h3>
        <ul className="ml-4 list-disc space-y-1 text-sm text-zinc-400">
          <li>Лимиты провайдеров API и усечение истории (до 500 транзакций).</li>
          <li>
            Упрощённый граф — только топ рёбер по объёму, без полной
            кластеризации адресов.
          </li>
          <li>
            Не учитываются внутренние транзакции ETH (internal txs) и токены
            ERC-20/ERC-721.
          </li>
          <li>
            Закон Бенфорда применим только к «органическим» данным с широким
            диапазоном значений; для синтетических или округлённых сумм
            результат ненадёжен.
          </li>
          <li>
            Все вычисления выполняются в браузере — данные не передаются на
            сторонние серверы (кроме запросов к API провайдеров).
          </li>
        </ul>
      </section>
    </article>
  )
}
