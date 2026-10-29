/**
 * Representative vessel classes.
 *
 * Figures are order-of-magnitude industry typicals for a laden voyage, chosen
 * so that the *differences* between routes are defensible. Everything the cost
 * model actually multiplies is editable in the UI.
 */

export type VesselCategory = 'container' | 'tanker' | 'bulker' | 'gas' | 'roro'
export type CapacityUnit = 'TEU' | 'DWT' | 'm3' | 'CEU'

export interface VesselClass {
  id: string
  category: VesselCategory
  capacity: number
  capacityUnit: CapacityUnit
  /** Typical laden cargo mass, used for the $/tonne figure. */
  cargoTonnes: number
  serviceSpeedKn: number
  /** Total daily fuel burn at service speed, main engine plus auxiliaries. */
  fuelTonnesPerDay: number
  /** Time-charter equivalent — the opportunity cost of the extra days. */
  charterUsdPerDay: number
  /** Canal net tonnage, the basis on which transit dues are assessed. */
  canalNetTons: number
  /** Insured hull and machinery value, the base for war-risk premiums. */
  hullValueUsd: number
  loaM: number
  beamM: number
  draftM: number
}

export const VESSEL_CLASSES: VesselClass[] = [
  {
    id: 'container-ulcv',
    category: 'container',
    capacity: 23000,
    capacityUnit: 'TEU',
    cargoTonnes: 220000,
    serviceSpeedKn: 18.5,
    fuelTonnesPerDay: 175,
    charterUsdPerDay: 110000,
    canalNetTons: 130000,
    hullValueUsd: 150_000_000,
    loaM: 400,
    beamM: 61.5,
    draftM: 16.0,
  },
  {
    id: 'container-neopanamax',
    category: 'container',
    capacity: 14000,
    capacityUnit: 'TEU',
    cargoTonnes: 140000,
    serviceSpeedKn: 18,
    fuelTonnesPerDay: 120,
    charterUsdPerDay: 75000,
    canalNetTons: 85000,
    hullValueUsd: 110_000_000,
    loaM: 366,
    beamM: 48.2,
    draftM: 15.0,
  },
  {
    id: 'container-panamax',
    category: 'container',
    capacity: 4500,
    capacityUnit: 'TEU',
    cargoTonnes: 45000,
    serviceSpeedKn: 17,
    fuelTonnesPerDay: 70,
    charterUsdPerDay: 32000,
    canalNetTons: 35000,
    hullValueUsd: 45_000_000,
    loaM: 294,
    beamM: 32.2,
    draftM: 13.5,
  },
  {
    id: 'container-feeder',
    category: 'container',
    capacity: 1700,
    capacityUnit: 'TEU',
    cargoTonnes: 17000,
    serviceSpeedKn: 15.5,
    fuelTonnesPerDay: 28,
    charterUsdPerDay: 14000,
    canalNetTons: 13000,
    hullValueUsd: 18_000_000,
    loaM: 172,
    beamM: 27.6,
    draftM: 9.5,
  },
  {
    id: 'tanker-vlcc',
    category: 'tanker',
    capacity: 300000,
    capacityUnit: 'DWT',
    cargoTonnes: 280000,
    serviceSpeedKn: 14.5,
    fuelTonnesPerDay: 70,
    charterUsdPerDay: 48000,
    canalNetTons: 100000,
    hullValueUsd: 120_000_000,
    loaM: 333,
    beamM: 60,
    draftM: 22.5,
  },
  {
    id: 'tanker-suezmax',
    category: 'tanker',
    capacity: 160000,
    capacityUnit: 'DWT',
    cargoTonnes: 150000,
    serviceSpeedKn: 14.5,
    fuelTonnesPerDay: 55,
    charterUsdPerDay: 36000,
    canalNetTons: 55000,
    hullValueUsd: 75_000_000,
    loaM: 274,
    beamM: 48,
    draftM: 17.0,
  },
  {
    id: 'tanker-aframax',
    category: 'tanker',
    capacity: 110000,
    capacityUnit: 'DWT',
    cargoTonnes: 100000,
    serviceSpeedKn: 14,
    fuelTonnesPerDay: 45,
    charterUsdPerDay: 32000,
    canalNetTons: 38000,
    hullValueUsd: 60_000_000,
    loaM: 250,
    beamM: 44,
    draftM: 14.8,
  },
  {
    id: 'tanker-mr',
    category: 'tanker',
    capacity: 50000,
    capacityUnit: 'DWT',
    cargoTonnes: 45000,
    serviceSpeedKn: 14,
    fuelTonnesPerDay: 28,
    charterUsdPerDay: 22000,
    canalNetTons: 18000,
    hullValueUsd: 40_000_000,
    loaM: 183,
    beamM: 32.2,
    draftM: 13.0,
  },
  {
    id: 'bulker-capesize',
    category: 'bulker',
    capacity: 180000,
    capacityUnit: 'DWT',
    cargoTonnes: 170000,
    serviceSpeedKn: 14,
    fuelTonnesPerDay: 50,
    charterUsdPerDay: 26000,
    canalNetTons: 60000,
    hullValueUsd: 55_000_000,
    loaM: 292,
    beamM: 45,
    draftM: 18.2,
  },
  {
    id: 'bulker-panamax',
    category: 'bulker',
    capacity: 82000,
    capacityUnit: 'DWT',
    cargoTonnes: 78000,
    serviceSpeedKn: 14,
    fuelTonnesPerDay: 32,
    charterUsdPerDay: 16000,
    canalNetTons: 28000,
    hullValueUsd: 32_000_000,
    loaM: 229,
    beamM: 32.3,
    draftM: 14.4,
  },
  {
    id: 'bulker-handysize',
    category: 'bulker',
    capacity: 35000,
    capacityUnit: 'DWT',
    cargoTonnes: 33000,
    serviceSpeedKn: 13.5,
    fuelTonnesPerDay: 20,
    charterUsdPerDay: 12000,
    canalNetTons: 12000,
    hullValueUsd: 25_000_000,
    loaM: 180,
    beamM: 28,
    draftM: 10.5,
  },
  {
    id: 'gas-lng',
    category: 'gas',
    capacity: 174000,
    capacityUnit: 'm3',
    cargoTonnes: 78000,
    serviceSpeedKn: 17,
    fuelTonnesPerDay: 110,
    charterUsdPerDay: 95000,
    canalNetTons: 80000,
    hullValueUsd: 230_000_000,
    loaM: 295,
    beamM: 46.4,
    draftM: 12.5,
  },
  {
    id: 'gas-vlgc',
    category: 'gas',
    capacity: 84000,
    capacityUnit: 'm3',
    cargoTonnes: 45000,
    serviceSpeedKn: 16,
    fuelTonnesPerDay: 55,
    charterUsdPerDay: 55000,
    canalNetTons: 40000,
    hullValueUsd: 110_000_000,
    loaM: 230,
    beamM: 36.6,
    draftM: 12.0,
  },
  {
    id: 'roro-pctc',
    category: 'roro',
    capacity: 7000,
    capacityUnit: 'CEU',
    cargoTonnes: 25000,
    serviceSpeedKn: 18,
    fuelTonnesPerDay: 62,
    charterUsdPerDay: 70000,
    canalNetTons: 45000,
    hullValueUsd: 90_000_000,
    loaM: 200,
    beamM: 38,
    draftM: 10.0,
  },
]

export const VESSEL_BY_ID = new Map(VESSEL_CLASSES.map((v) => [v.id, v]))

export const DEFAULT_VESSEL_ID = 'container-neopanamax'
