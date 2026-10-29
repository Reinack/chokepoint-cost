import { CHOKEPOINT_BY_ID, type ChokepointId } from '../data/chokepoints'
import { PORT_BY_ID } from '../data/ports'
import type { VesselClass } from '../data/vessels'
import type { Route } from './graph'

/** Tonnes of CO2 released per tonne of fuel oil burnt (IMO factor for VLSFO). */
export const CO2_PER_FUEL_TONNE = 3.114

export interface CostParams {
  fuelUsdPerTonne: number
  /** Actual speed sailed, which the user may drop below the class default. */
  speedKn: number
  /** Opportunity cost of the ship's time. */
  charterUsdPerDay: number
  includeCharter: boolean
  includeWarRisk: boolean
  includeCo2: boolean
  /** EU ETS allowance price, USD per tonne of CO2. */
  etsUsdPerTonneCo2: number
  includeEts: boolean
  /** Share of nominal capacity actually filled, for the per-unit figures. */
  utilisation: number
}

export const DEFAULT_COST_PARAMS: Omit<CostParams, 'speedKn' | 'charterUsdPerDay'> = {
  fuelUsdPerTonne: 620,
  includeCharter: true,
  includeWarRisk: true,
  includeCo2: true,
  etsUsdPerTonneCo2: 85,
  includeEts: true,
  utilisation: 0.85,
}

export interface LineItem {
  id: string
  usd: number
}

export interface VoyageCost {
  distanceNm: number
  days: number
  fuelTonnes: number
  co2Tonnes: number
  fuelUsd: number
  charterUsd: number
  tollsUsd: number
  warRiskUsd: number
  escortUsd: number
  etsUsd: number
  totalUsd: number
  tollDetail: LineItem[]
  warRiskDetail: LineItem[]
  chokepoints: ChokepointId[]
}

/**
 * EU ETS maritime scope: the full emissions of a voyage between two EEA ports,
 * half of a voyage with a single EEA end, nothing otherwise.
 */
export function etsCoverage(originPortId: string, destinationPortId: string): number {
  const a = PORT_BY_ID.get(originPortId)?.eea ?? false
  const b = PORT_BY_ID.get(destinationPortId)?.eea ?? false
  if (a && b) return 1
  if (a || b) return 0.5
  return 0
}

export function costVoyage(
  route: Route,
  vessel: VesselClass,
  params: CostParams,
  originPortId: string,
  destinationPortId: string,
): VoyageCost {
  const speed = Math.max(1, params.speedKn)
  const days = route.distanceNm / (speed * 24)

  // Fuel burn scales roughly with the cube of speed, so sailing slower over a
  // longer route is not a free saving — the propeller law is what makes slow
  // steaming worth modelling at all.
  const speedRatio = speed / vessel.serviceSpeedKn
  const burnPerDay = vessel.fuelTonnesPerDay * speedRatio ** 3
  const fuelTonnes = burnPerDay * days
  const co2Tonnes = fuelTonnes * CO2_PER_FUEL_TONNE

  const fuelUsd = fuelTonnes * params.fuelUsdPerTonne
  const charterUsd = params.includeCharter ? days * params.charterUsdPerDay : 0

  const tollDetail: LineItem[] = []
  const warRiskDetail: LineItem[] = []
  let tollsUsd = 0
  let warRiskUsd = 0
  let escortUsd = 0

  for (const id of route.chokepoints) {
    const c = CHOKEPOINT_BY_ID.get(id)
    if (!c) continue
    if (c.tollUsdPerNetTon !== undefined) {
      const usd = c.tollUsdPerNetTon * vessel.canalNetTons
      tollDetail.push({ id, usd })
      tollsUsd += usd
    }
    if (params.includeWarRisk && c.warRiskPct !== undefined) {
      const usd = (c.warRiskPct / 100) * vessel.hullValueUsd
      warRiskDetail.push({ id, usd })
      warRiskUsd += usd
    }
    if (c.escortUsd !== undefined) escortUsd += c.escortUsd
  }

  const etsUsd =
    params.includeEts && params.includeCo2
      ? co2Tonnes * etsCoverage(originPortId, destinationPortId) * params.etsUsdPerTonneCo2
      : 0

  const totalUsd = fuelUsd + charterUsd + tollsUsd + warRiskUsd + escortUsd + etsUsd

  return {
    distanceNm: route.distanceNm,
    days,
    fuelTonnes,
    co2Tonnes,
    fuelUsd,
    charterUsd,
    tollsUsd,
    warRiskUsd,
    escortUsd,
    etsUsd,
    totalUsd,
    tollDetail,
    warRiskDetail,
    chokepoints: route.chokepoints,
  }
}

export interface CostDelta {
  distanceNm: number
  days: number
  fuelTonnes: number
  co2Tonnes: number
  fuelUsd: number
  charterUsd: number
  tollsUsd: number
  warRiskUsd: number
  escortUsd: number
  etsUsd: number
  totalUsd: number
}

export function diff(baseline: VoyageCost, alternative: VoyageCost): CostDelta {
  return {
    distanceNm: alternative.distanceNm - baseline.distanceNm,
    days: alternative.days - baseline.days,
    fuelTonnes: alternative.fuelTonnes - baseline.fuelTonnes,
    co2Tonnes: alternative.co2Tonnes - baseline.co2Tonnes,
    fuelUsd: alternative.fuelUsd - baseline.fuelUsd,
    charterUsd: alternative.charterUsd - baseline.charterUsd,
    tollsUsd: alternative.tollsUsd - baseline.tollsUsd,
    warRiskUsd: alternative.warRiskUsd - baseline.warRiskUsd,
    escortUsd: alternative.escortUsd - baseline.escortUsd,
    etsUsd: alternative.etsUsd - baseline.etsUsd,
    totalUsd: alternative.totalUsd - baseline.totalUsd,
  }
}

/** Cargo units the per-unit figures are divided by. */
export function billableUnits(vessel: VesselClass, utilisation: number) {
  return {
    capacity: vessel.capacity * utilisation,
    tonnes: vessel.cargoTonnes * utilisation,
  }
}

/**
 * A liner service sails a fixed round trip on a fixed weekly rhythm, so a
 * longer route is absorbed by adding ships rather than by arriving late. This
 * is plain arithmetic on the round-trip time, not an elasticity estimate.
 */
export function extraShipsForWeeklyService(deltaDays: number): number {
  return Math.ceil((deltaDays * 2) / 7)
}
