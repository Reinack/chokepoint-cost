import { useMemo, useState } from 'react'
import { CHOKEPOINTS, type ChokepointId } from './data/chokepoints'
import { DEFAULT_DESTINATION, DEFAULT_ORIGIN, PORT_BY_ID } from './data/ports'
import { DEFAULT_VESSEL_ID, VESSEL_BY_ID } from './data/vessels'
import { blockedNodes, findRoute, routeWeights, type TransitContext } from './engine/graph'
import { DEFAULT_COST_PARAMS, costVoyage, diff, type CostParams } from './engine/cost'
import { useI18n } from './i18n'
import { ControlPanel } from './components/ControlPanel'
import { MapView } from './components/MapView'
import { ResultsPanel } from './components/ResultsPanel'
import { LanguageSwitch } from './components/LanguageSwitch'
import { MethodologyDialog } from './components/MethodologyDialog'

export default function App() {
  const { t } = useI18n()

  const [originId, setOriginId] = useState(DEFAULT_ORIGIN)
  const [destinationId, setDestinationId] = useState(DEFAULT_DESTINATION)
  const [vesselId, setVesselId] = useState(DEFAULT_VESSEL_ID)
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [iceClass, setIceClass] = useState(false)
  const [closed, setClosed] = useState<Set<ChokepointId>>(
    () => new Set<ChokepointId>(['suez-canal']),
  )
  const [enabled, setEnabled] = useState<Set<ChokepointId>>(() => new Set<ChokepointId>())
  const [speedOverride, setSpeedOverride] = useState<number | null>(null)
  const [charterOverride, setCharterOverride] = useState<number | null>(null)
  const [params, setParams] = useState(DEFAULT_COST_PARAMS)
  const [methodologyOpen, setMethodologyOpen] = useState(false)

  const vessel = VESSEL_BY_ID.get(vesselId)!
  const speedKn = speedOverride ?? vessel.serviceSpeedKn
  const charterUsdPerDay = charterOverride ?? vessel.charterUsdPerDay
  const costParams: CostParams = { ...params, speedKn, charterUsdPerDay }

  const analysis = useMemo(() => {
    const context: TransitContext = { vessel, month, iceClass, closed, enabled }
    const weights = routeWeights(vessel, costParams)
    const baselineRoute = findRoute(
      originId,
      destinationId,
      blockedNodes({ ...context, closed: new Set<ChokepointId>() }),
      weights,
    )
    const alternativeRoute = findRoute(originId, destinationId, blockedNodes(context), weights)

    const baseline = baselineRoute
      ? costVoyage(baselineRoute, vessel, costParams, originId, destinationId)
      : null
    const alternative = alternativeRoute
      ? costVoyage(alternativeRoute, vessel, costParams, originId, destinationId)
      : null

    return {
      baselineRoute,
      alternativeRoute,
      baseline,
      alternative,
      delta: baseline && alternative ? diff(baseline, alternative) : null,
      context,
    }
    // costParams is rebuilt every render; depend on its fields instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    originId,
    destinationId,
    vessel,
    month,
    iceClass,
    closed,
    enabled,
    speedKn,
    charterUsdPerDay,
    params,
  ])

  const toggleChokepoint = (id: ChokepointId) => {
    setClosed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleEnabled = (id: ChokepointId) => {
    setEnabled((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__mark" aria-hidden="true" />
          <div>
            <h1>{t.app.title}</h1>
            <p>{t.app.tagline}</p>
          </div>
        </div>
        <div className="app__header-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setMethodologyOpen(true)}
          >
            {t.nav.about}
          </button>
          <LanguageSwitch />
        </div>
      </header>

      <ControlPanel
        originId={originId}
        destinationId={destinationId}
        onOriginChange={setOriginId}
        onDestinationChange={setDestinationId}
        onSwap={() => {
          setOriginId(destinationId)
          setDestinationId(originId)
        }}
        onScenario={(scenario) => {
          setOriginId(scenario.origin)
          setDestinationId(scenario.destination)
          setVesselId(scenario.vessel)
          setSpeedOverride(null)
          setCharterOverride(null)
          setClosed(new Set([scenario.close]))
        }}
        vesselId={vesselId}
        onVesselChange={(id) => {
          setVesselId(id)
          setSpeedOverride(null)
          setCharterOverride(null)
        }}
        month={month}
        onMonthChange={setMonth}
        iceClass={iceClass}
        onIceClassChange={setIceClass}
        closed={closed}
        enabled={enabled}
        onToggleChokepoint={toggleChokepoint}
        onToggleEnabled={toggleEnabled}
        onCloseAll={() => setClosed(new Set(CHOKEPOINTS.map((c) => c.id)))}
        onReset={() => setClosed(new Set())}
        context={analysis.context}
        params={costParams}
        onParamsChange={(next) => setParams((p) => ({ ...p, ...next }))}
        onSpeedChange={setSpeedOverride}
        onCharterChange={setCharterOverride}
        onResetParams={() => {
          setParams(DEFAULT_COST_PARAMS)
          setSpeedOverride(null)
          setCharterOverride(null)
        }}
      />

      <MapView
        baseline={analysis.baselineRoute}
        alternative={analysis.alternativeRoute}
        origin={PORT_BY_ID.get(originId)!}
        destination={PORT_BY_ID.get(destinationId)!}
        closed={closed}
        context={analysis.context}
        onToggleChokepoint={toggleChokepoint}
      />

      <ResultsPanel
        baseline={analysis.baseline}
        alternative={analysis.alternative}
        delta={analysis.delta}
        vessel={vessel}
        params={costParams}
        anyClosed={closed.size > 0}
      />

      {methodologyOpen && <MethodologyDialog onClose={() => setMethodologyOpen(false)} />}
    </div>
  )
}
