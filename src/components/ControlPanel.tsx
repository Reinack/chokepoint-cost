import { useEffect, useState, type ReactNode } from 'react'
import {
  CHOKEPOINTS,
  OPT_IN_CHOKEPOINTS,
  type Chokepoint,
  type ChokepointId,
} from '../data/chokepoints'
import { PORT_BY_ID, type PortRegion } from '../data/ports'
import { SCENARIOS, type Scenario } from '../data/scenarios'
import { VESSEL_CLASSES } from '../data/vessels'
import { availability, type TransitContext } from '../engine/graph'
import type { CostParams } from '../engine/cost'
import { useI18n } from '../i18n'
import { COMPACT_QUERY, useMediaQuery } from '../hooks/useMediaQuery'
import { PortPicker } from './PortPicker'

interface Props {
  originId: string
  destinationId: string
  onOriginChange: (id: string) => void
  onDestinationChange: (id: string) => void
  onSwap: () => void
  onScenario: (scenario: Scenario) => void
  vesselId: string
  onVesselChange: (id: string) => void
  month: number
  onMonthChange: (month: number) => void
  iceClass: boolean
  onIceClassChange: (value: boolean) => void
  closed: Set<ChokepointId>
  enabled: Set<ChokepointId>
  onToggleChokepoint: (id: ChokepointId) => void
  onToggleEnabled: (id: ChokepointId) => void
  onCloseAll: () => void
  onReset: () => void
  context: TransitContext
  params: CostParams
  onParamsChange: (next: Partial<CostParams>) => void
  onSpeedChange: (value: number | null) => void
  onCharterChange: (value: number | null) => void
  onResetParams: () => void
}

const REGION_ORDER: PortRegion[] = [
  'north-europe',
  'mediterranean',
  'black-sea',
  'middle-east',
  'south-asia',
  'southeast-asia',
  'east-asia',
  'oceania',
  'africa',
  'north-america',
  'latin-america',
]

export function ControlPanel(props: Props) {
  const { t, formatNumber } = useI18n()
  const compact = useMediaQuery(COMPACT_QUERY)
  const vessel = VESSEL_CLASSES.find((v) => v.id === props.vesselId)!

  const closable = CHOKEPOINTS.filter((c) => !OPT_IN_CHOKEPOINTS.includes(c.id))
  const optIn = CHOKEPOINTS.filter((c) => OPT_IN_CHOKEPOINTS.includes(c.id))

  return (
    <aside className="panel panel--controls">
      <Section collapsible={compact} title={t.form.scenarios}>
        <p className="hint">{t.form.scenariosHint}</p>
        <ul className="scenarios">
          {SCENARIOS.map((scenario) => {
            const active =
              scenario.origin === props.originId &&
              scenario.destination === props.destinationId &&
              scenario.vessel === props.vesselId &&
              props.closed.size === 1 &&
              props.closed.has(scenario.close)
            return (
              <li key={scenario.close}>
                <button
                  type="button"
                  className="scenario"
                  aria-pressed={active}
                  onClick={() => props.onScenario(scenario)}
                >
                  <span className="scenario__name">{t.chokepoint[scenario.close]}</span>
                  <span className="scenario__lane">
                    {PORT_BY_ID.get(scenario.origin)!.name} → {PORT_BY_ID.get(scenario.destination)!.name}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Section>

      <section className="field-group field-group--route">
        <h2>{t.form.route}</h2>
        <PortPicker
          label={t.form.origin}
          value={props.originId}
          regions={REGION_ORDER}
          onChange={props.onOriginChange}
        />
        <button type="button" className="button button--swap" onClick={props.onSwap}>
          {t.form.swap}
        </button>
        <PortPicker
          label={t.form.destination}
          value={props.destinationId}
          regions={REGION_ORDER}
          onChange={props.onDestinationChange}
        />
      </section>

      <Section
        collapsible={compact}
        title={t.form.vessel}
        badge={`${formatNumber(vessel.capacity)} ${vessel.capacityUnit}`}
      >
        <label className="field">
          <span>{t.form.vesselClass}</span>
          <select value={props.vesselId} onChange={(e) => props.onVesselChange(e.target.value)}>
            {VESSEL_CLASSES.map((v) => (
              <option key={v.id} value={v.id}>
                {t.vessel[v.id as keyof typeof t.vessel]} · {formatNumber(v.capacity)}{' '}
                {v.capacityUnit}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.form.month}</span>
          <select value={props.month} onChange={(e) => props.onMonthChange(Number(e.target.value))}>
            {t.month.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={props.iceClass}
            onChange={(e) => props.onIceClassChange(e.target.checked)}
          />
          <span>
            {t.form.iceClass}
            <small>{t.form.iceClassHint}</small>
          </span>
        </label>
      </Section>

      <Section
        collapsible={compact}
        title={t.form.chokepoints}
        badge={props.closed.size > 0 ? String(props.closed.size) : undefined}
        actions={
          <div className="field-group__actions">
            <button type="button" className="button button--tiny" onClick={props.onCloseAll}>
              {t.form.closeAll}
            </button>
            <button type="button" className="button button--tiny" onClick={props.onReset}>
              {t.form.reset}
            </button>
          </div>
        }
      >
        <p className="hint">{t.form.chokepointsHint}</p>

        <ul className="chokepoints">
          {closable.map((chokepoint) => (
            <ChokepointRow
              key={chokepoint.id}
              chokepoint={chokepoint}
              checked={props.closed.has(chokepoint.id)}
              context={props.context}
              onToggle={() => props.onToggleChokepoint(chokepoint.id)}
            />
          ))}
        </ul>

        <ul className="chokepoints chokepoints--optin">
          {optIn.map((chokepoint) => (
            <ChokepointRow
              key={chokepoint.id}
              chokepoint={chokepoint}
              checked={props.enabled.has(chokepoint.id)}
              context={props.context}
              optIn
              onToggle={() => props.onToggleEnabled(chokepoint.id)}
            />
          ))}
        </ul>
      </Section>

      <Section
        collapsible={compact}
        title={t.form.assumptions}
        actions={
          <button type="button" className="button button--tiny" onClick={props.onResetParams}>
            {t.param.resetParams}
          </button>
        }
      >

        <label className="field field--inline">
          <span>{t.param.fuelPrice}</span>
          <span className="field__input">
            <input
              type="number"
              min={100}
              max={2000}
              step={10}
              value={props.params.fuelUsdPerTonne}
              onChange={(e) => props.onParamsChange({ fuelUsdPerTonne: Number(e.target.value) })}
            />
            <em>$/t</em>
          </span>
        </label>

        <label className="field field--inline">
          <span>{t.param.speed}</span>
          <span className="field__input">
            <input
              type="number"
              min={8}
              max={25}
              step={0.5}
              value={props.params.speedKn}
              onChange={(e) => props.onSpeedChange(Number(e.target.value))}
            />
            <em>kn</em>
          </span>
        </label>

        <label className="field field--inline">
          <span>{t.param.charter}</span>
          <span className="field__input">
            <input
              type="number"
              min={0}
              max={500000}
              step={1000}
              value={props.params.charterUsdPerDay}
              onChange={(e) => props.onCharterChange(Number(e.target.value))}
            />
            <em>$/d</em>
          </span>
        </label>

        <label className="field field--inline">
          <span>{t.param.utilisation}</span>
          <span className="field__input">
            <input
              type="number"
              min={10}
              max={100}
              step={5}
              value={Math.round(props.params.utilisation * 100)}
              onChange={(e) => props.onParamsChange({ utilisation: Number(e.target.value) / 100 })}
            />
            <em>%</em>
          </span>
        </label>

        <label className="field field--inline">
          <span>{t.param.co2Price}</span>
          <span className="field__input">
            <input
              type="number"
              min={0}
              max={400}
              step={5}
              value={props.params.etsUsdPerTonneCo2}
              onChange={(e) => props.onParamsChange({ etsUsdPerTonneCo2: Number(e.target.value) })}
            />
            <em>$/t</em>
          </span>
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={props.params.includeCharter}
            onChange={(e) => props.onParamsChange({ includeCharter: e.target.checked })}
          />
          <span>{t.param.includeCharter}</span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={props.params.includeWarRisk}
            onChange={(e) => props.onParamsChange({ includeWarRisk: e.target.checked })}
          />
          <span>{t.param.includeWarRisk}</span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={props.params.includeEts}
            onChange={(e) => props.onParamsChange({ includeEts: e.target.checked })}
          />
          <span>{t.param.includeEts}</span>
        </label>
      </Section>
    </aside>
  )
}

/**
 * A control group that folds away on small screens. The chokepoint list and the
 * assumptions together run past a phone screen, which pushed the map — the
 * thing the user came for — below a long scroll.
 */
function Section({
  title,
  actions,
  badge,
  collapsible,
  children,
}: {
  title: string
  actions?: ReactNode
  badge?: string
  collapsible: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(!collapsible)
  useEffect(() => setOpen(!collapsible), [collapsible])

  if (!collapsible) {
    return (
      <section className="field-group">
        <div className="field-group__head">
          <h2>{title}</h2>
          {actions}
        </div>
        {children}
      </section>
    )
  }

  return (
    <details
      className="field-group field-group--foldable"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <h2>{title}</h2>
        {badge && <span className="badge badge--count">{badge}</span>}
      </summary>
      {actions && <div className="field-group__actions">{actions}</div>}
      {children}
    </details>
  )
}

function ChokepointRow({
  chokepoint,
  checked,
  context,
  optIn,
  onToggle,
}: {
  chokepoint: Chokepoint
  checked: boolean
  context: TransitContext
  optIn?: boolean
  onToggle: () => void
}) {
  const { t } = useI18n()
  // Ask availability as if nothing were closed, so the badge reports physical
  // and seasonal limits rather than echoing the user's own choice back at them.
  const physical = availability(chokepoint, {
    ...context,
    closed: new Set(),
    enabled: new Set(chokepoint.id ? [chokepoint.id] : []),
  })

  return (
    <li className={`chokepoint${physical.usable ? '' : ' chokepoint--blocked'}`}>
      <label>
        <input type="checkbox" checked={checked} onChange={onToggle} />
        <span className="chokepoint__name">{t.chokepoint[chokepoint.id]}</span>
      </label>
      {!physical.usable && physical.reason && (
        <span className="badge badge--muted">{t.reason[physical.reason]}</span>
      )}
      {physical.usable && chokepoint.tradeSharePct !== undefined && (
        <span className="badge">{chokepoint.tradeSharePct}%</span>
      )}
      {optIn && physical.usable && <span className="badge badge--accent">{t.map.open}</span>}
    </li>
  )
}
