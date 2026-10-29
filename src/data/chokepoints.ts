/**
 * Maritime chokepoints that the user can close.
 *
 * Closing one removes its `nodes` from the routing graph, so any alternative
 * has to be found by the network itself rather than being hard-coded.
 * Physical limits (`max*`) instead make a chokepoint unusable for a given
 * vessel without any user action — a 61 m beam ULCV was never getting through
 * Panama in the first place.
 */

export type ChokepointId =
  | 'suez-canal'
  | 'panama-canal'
  | 'bab-el-mandeb'
  | 'hormuz'
  | 'gibraltar'
  | 'malacca'
  | 'turkish-straits'
  | 'danish-straits'
  | 'kiel-canal'
  | 'dover-strait'
  | 'sunda'
  | 'lombok'
  | 'makassar'
  | 'luzon-strait'
  | 'taiwan-strait'
  | 'korea-strait'
  | 'torres'
  | 'mozambique-channel'
  | 'florida-strait'
  | 'yucatan'
  | 'cape-of-good-hope'
  | 'cape-horn'
  | 'bering-strait'
  | 'northern-sea-route'

export interface Chokepoint {
  id: ChokepointId
  /** Waypoints removed from the graph when this chokepoint is closed. */
  nodes: string[]
  /** Marker position on the map. */
  lat: number
  lon: number
  /** Transit dues, USD per canal net ton. Absent for natural straits. */
  tollUsdPerNetTon?: number
  maxDraftM?: number
  maxBeamM?: number
  maxLoaM?: number
  /** Default war-risk premium charged on transit, % of hull value. */
  warRiskPct?: number
  /** Months (1-12) in which the passage is navigable. Absent = all year. */
  navigableMonths?: number[]
  requiresIceClass?: boolean
  /** Icebreaker escort and passage administration, USD per transit. */
  escortUsd?: number
  /** Rough share of seaborne trade transiting, for context in the UI. */
  tradeSharePct?: number
}

export const CHOKEPOINTS: Chokepoint[] = [
  {
    id: 'suez-canal',
    nodes: ['suez-canal'],
    lat: 30.3,
    lon: 32.4,
    tollUsdPerNetTon: 5.5,
    maxDraftM: 20.1,
    maxBeamM: 77.5,
    maxLoaM: 400,
    tradeSharePct: 12,
  },
  {
    id: 'panama-canal',
    nodes: ['panama-canal'],
    lat: 9.1,
    lon: -79.7,
    tollUsdPerNetTon: 7.0,
    maxDraftM: 15.2,
    maxBeamM: 51.25,
    maxLoaM: 366,
    tradeSharePct: 5,
  },
  {
    id: 'bab-el-mandeb',
    nodes: ['bab-el-mandeb'],
    lat: 12.6,
    lon: 43.4,
    warRiskPct: 0.35,
    tradeSharePct: 12,
  },
  {
    id: 'hormuz',
    nodes: ['hormuz'],
    lat: 26.5,
    lon: 56.3,
    warRiskPct: 0.3,
    tradeSharePct: 20,
  },
  { id: 'gibraltar', nodes: ['gibraltar'], lat: 35.95, lon: -5.6, tradeSharePct: 10 },
  {
    id: 'malacca',
    nodes: ['malacca'],
    lat: 2.9,
    lon: 100.9,
    maxDraftM: 25,
    tradeSharePct: 25,
  },
  {
    id: 'turkish-straits',
    nodes: ['bosphorus', 'dardanelles'],
    lat: 41.15,
    lon: 29.1,
    tollUsdPerNetTon: 0.9,
    maxDraftM: 17,
    maxLoaM: 300,
    tradeSharePct: 3,
  },
  {
    id: 'danish-straits',
    nodes: ['danish-straits'],
    lat: 55.4,
    lon: 11.0,
    maxDraftM: 15,
    tradeSharePct: 3,
  },
  {
    id: 'kiel-canal',
    nodes: ['kiel-canal'],
    lat: 54.2,
    lon: 9.5,
    tollUsdPerNetTon: 0.6,
    maxDraftM: 9.5,
    maxBeamM: 32.5,
    maxLoaM: 235,
  },
  { id: 'dover-strait', nodes: ['dover-strait'], lat: 50.95, lon: 1.5, tradeSharePct: 8 },
  { id: 'sunda', nodes: ['sunda'], lat: -6.0, lon: 105.6, maxDraftM: 20 },
  { id: 'lombok', nodes: ['lombok'], lat: -8.7, lon: 115.8 },
  { id: 'makassar', nodes: ['makassar'], lat: -2.0, lon: 118.5 },
  { id: 'luzon-strait', nodes: ['luzon-strait'], lat: 20.8, lon: 121.0 },
  { id: 'taiwan-strait', nodes: ['taiwan-strait'], lat: 24.8, lon: 119.3, tradeSharePct: 20 },
  { id: 'korea-strait', nodes: ['korea-strait'], lat: 34.5, lon: 129.0 },
  { id: 'torres', nodes: ['torres'], lat: -9.7, lon: 142.6, maxDraftM: 12.2 },
  { id: 'mozambique-channel', nodes: ['mozambique-ch'], lat: -16.0, lon: 41.0 },
  { id: 'florida-strait', nodes: ['florida-strait'], lat: 23.8, lon: -81.5 },
  { id: 'yucatan', nodes: ['yucatan'], lat: 21.6, lon: -86.0 },
  { id: 'cape-of-good-hope', nodes: ['cape-agulhas'], lat: -35.5, lon: 20.0, tradeSharePct: 9 },
  { id: 'cape-horn', nodes: ['cape-horn'], lat: -57.5, lon: -67.0 },
  // The strait itself carries about 50 m; what limits Arctic drafts is the
  // shallow Siberian coastal passages, which the NSR entry accounts for.
  { id: 'bering-strait', nodes: ['bering-strait'], lat: 65.8, lon: -168.9 },
  {
    id: 'northern-sea-route',
    nodes: [
      'kara-gate',
      'kara-sea',
      'vilkitsky',
      'laptev',
      'ns-islands-n',
      'east-siberian',
      'chukchi',
    ],
    lat: 77.9,
    lon: 103.5,
    navigableMonths: [7, 8, 9, 10, 11],
    requiresIceClass: true,
    escortUsd: 300_000,
    maxDraftM: 15,
  },
]

export const CHOKEPOINT_BY_ID = new Map(CHOKEPOINTS.map((c) => [c.id, c]))

/** Waypoint id -> chokepoint that owns it. */
export const NODE_TO_CHOKEPOINT = new Map<string, Chokepoint>(
  CHOKEPOINTS.flatMap((c) => c.nodes.map((n) => [n, c] as [string, Chokepoint])),
)

/**
 * The Northern Sea Route is opt-in: it is never part of a baseline routeing
 * unless the user explicitly enables it, because commercial liner services do
 * not treat it as a default option.
 */
export const OPT_IN_CHOKEPOINTS: ChokepointId[] = ['northern-sea-route']
