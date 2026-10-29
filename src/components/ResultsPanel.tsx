import type { VesselClass } from "../data/vessels";
import {
  billableUnits,
  extraShipsForWeeklyService,
  type CostDelta,
  type CostParams,
  type VoyageCost,
} from "../engine/cost";
import { useI18n } from "../i18n";

interface Props {
  baseline: VoyageCost | null;
  alternative: VoyageCost | null;
  delta: CostDelta | null;
  vessel: VesselClass;
  params: CostParams;
  anyClosed: boolean;
}

export function ResultsPanel({
  baseline,
  alternative,
  delta,
  vessel,
  params,
  anyClosed,
}: Props) {
  const { t, formatNumber, formatUsd, formatPercent } = useI18n();

  if (!baseline) {
    return (
      <section className="panel panel--results">
        <h2>{t.result.title}</h2>
        <p className="notice notice--warn">{t.result.baselineInfeasible}</p>
      </section>
    );
  }

  if (!alternative || !delta) {
    return (
      <section className="panel panel--results">
        <h2>{t.result.title}</h2>
        <p className="notice notice--warn">
          <strong>{t.result.infeasible}.</strong> {t.result.infeasibleHint}
        </p>
      </section>
    );
  }

  const units = billableUnits(vessel, params.utilisation);
  const increase =
    baseline.totalUsd > 0 ? delta.totalUsd / baseline.totalUsd : 0;

  const components = [
    { id: "fuel", label: t.result.fuel, usd: delta.fuelUsd },
    params.includeCharter
      ? { id: "charter", label: t.result.charter, usd: delta.charterUsd }
      : null,
    { id: "tolls", label: t.result.tolls, usd: delta.tollsUsd },
    params.includeWarRisk
      ? { id: "warRisk", label: t.result.warRisk, usd: delta.warRiskUsd }
      : null,
    delta.escortUsd !== 0
      ? { id: "escort", label: t.result.escort, usd: delta.escortUsd }
      : null,
    params.includeEts
      ? { id: "ets", label: t.result.ets, usd: delta.etsUsd }
      : null,
  ].filter(
    (c): c is { id: string; label: string; usd: number } =>
      c !== null && c.usd !== 0,
  );

  const scale = Math.max(1, ...components.map((c) => Math.abs(c.usd)));

  return (
    <section className="panel panel--results">
      <div className="results__head">
        <h2>{t.result.title}</h2>
        {!anyClosed && <p className="notice">{t.result.noClosure}</p>}
      </div>

      <div className="stat-row stat-row--primary">
        <Stat
          label={t.result.extraDistance}
          value={`${formatNumber(delta.distanceNm)} ${t.units.nm}`}
          tone={delta.distanceNm > 0 ? "up" : "flat"}
        />
        <Stat
          label={t.result.extraDays}
          value={`${formatNumber(delta.days, 1)} ${t.units.days}`}
          tone={delta.days > 0 ? "up" : "flat"}
        />
        <Stat
          label={t.result.extraCost}
          value={formatUsd(delta.totalUsd, { sign: true })}
          tone={delta.totalUsd > 0 ? "up" : "flat"}
          emphasis
        />
        <Stat
          label={t.result.increase}
          value={formatPercent(increase, increase < 0.1 ? 1 : 0)}
          tone={increase > 0 ? "up" : "flat"}
        />
      </div>

      <div className="stat-row stat-row--secondary">
        <Stat
          label={`${t.result.perUnit} (${vessel.capacityUnit})`}
          value={formatUsd(delta.totalUsd / units.capacity, { compact: false })}
        />
        <Stat
          label={t.result.perTonne}
          value={formatUsd(delta.totalUsd / units.tonnes, { compact: false })}
        />
        <Stat
          label={t.result.extraShips}
          value={formatNumber(extraShipsForWeeklyService(delta.days))}
          hint={t.result.extraShipsHint}
        />
        <Stat
          label={t.result.co2}
          value={`${formatNumber(delta.co2Tonnes)} ${t.units.tonnes}`}
        />
      </div>

      <div className="breakdown">
        <div className="breakdown__head">
          <h3>{t.result.breakdown}</h3>
          <div className="breakdown__legend">
            <span>
              <i className="legend__swatch legend__swatch--adds" />
              {t.result.extraCost}
            </span>
            <span>
              <i className="legend__swatch legend__swatch--saves" />
              {t.result.savings}
            </span>
          </div>
        </div>

        <ul className="bars" dir="ltr">
          {components.map((component) => {
            const share = Math.abs(component.usd) / scale;
            const positive = component.usd > 0;
            return (
              <li key={component.id} className="bars__row">
                <span className="bars__label">{component.label}</span>
                <span className="bars__track">
                  <span className="bars__half bars__half--negative">
                    {!positive && (
                      <i
                        className="bars__fill bars__fill--negative"
                        style={{ width: `${share * 100}%` }}
                      />
                    )}
                  </span>
                  <span className="bars__zero" aria-hidden="true" />
                  <span className="bars__half bars__half--positive">
                    {positive && (
                      <i
                        className="bars__fill bars__fill--positive"
                        style={{ width: `${share * 100}%` }}
                      />
                    )}
                  </span>
                </span>
                <span className="bars__value">
                  {formatUsd(component.usd, { sign: true })}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="table-scroll">
        <table className="compare">
          <caption className="visually-hidden">{t.result.breakdown}</caption>
          <thead>
            <tr>
              <th scope="col">{t.result.component}</th>
              <th scope="col">{t.result.baseline}</th>
              <th scope="col">{t.result.alternative}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{t.result.distance}</th>
              <td>
                {formatNumber(baseline.distanceNm)} {t.units.nm}
              </td>
              <td>
                {formatNumber(alternative.distanceNm)} {t.units.nm}
              </td>
            </tr>
            <tr>
              <th scope="row">{t.result.duration}</th>
              <td>
                {formatNumber(baseline.days, 1)} {t.units.days}
              </td>
              <td>
                {formatNumber(alternative.days, 1)} {t.units.days}
              </td>
            </tr>
            <tr>
              <th scope="row">{t.result.fuel}</th>
              <td>{formatUsd(baseline.fuelUsd)}</td>
              <td>{formatUsd(alternative.fuelUsd)}</td>
            </tr>
            {params.includeCharter && (
              <tr>
                <th scope="row">{t.result.charter}</th>
                <td>{formatUsd(baseline.charterUsd)}</td>
                <td>{formatUsd(alternative.charterUsd)}</td>
              </tr>
            )}
            <tr>
              <th scope="row">{t.result.tolls}</th>
              <td>{formatUsd(baseline.tollsUsd)}</td>
              <td>{formatUsd(alternative.tollsUsd)}</td>
            </tr>
            {params.includeWarRisk && (
              <tr>
                <th scope="row">{t.result.warRisk}</th>
                <td>{formatUsd(baseline.warRiskUsd)}</td>
                <td>{formatUsd(alternative.warRiskUsd)}</td>
              </tr>
            )}
            {params.includeEts && (
              <tr>
                <th scope="row">{t.result.ets}</th>
                <td>{formatUsd(baseline.etsUsd)}</td>
                <td>{formatUsd(alternative.etsUsd)}</td>
              </tr>
            )}
            <tr className="compare__total">
              <th scope="row">{t.result.totalCost}</th>
              <td>{formatUsd(baseline.totalUsd)}</td>
              <td>{formatUsd(alternative.totalUsd)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="via">
        <RouteChips
          label={t.result.baseline}
          chokepoints={baseline.chokepoints}
          variant="baseline"
        />
        <RouteChips
          label={t.result.alternative}
          chokepoints={alternative.chokepoints}
          variant="alternative"
        />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  tone?: "up" | "flat";
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`stat${emphasis ? " stat--emphasis" : ""}`} title={hint}>
      <span className="stat__label">{label}</span>
      <span className={`stat__value${tone === "up" ? " stat__value--up" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function RouteChips({
  label,
  chokepoints,
  variant,
}: {
  label: string;
  chokepoints: readonly string[];
  variant: "baseline" | "alternative";
}) {
  const { t } = useI18n();
  return (
    <div className="via__row">
      <span
        className={`via__marker via__marker--${variant}`}
        aria-hidden="true"
      />
      <span className="via__label">
        {label} · {t.result.viaChokepoints}
      </span>
      <span className="via__chips">
        {chokepoints.length === 0 ? (
          <em className="via__none">{t.result.none}</em>
        ) : (
          chokepoints.map((id) => (
            <span key={id} className="chip">
              {t.chokepoint[id as keyof typeof t.chokepoint]}
            </span>
          ))
        )}
      </span>
    </div>
  );
}
