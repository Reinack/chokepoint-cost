import { EXEMPT_LINKS, LINKS, WAYPOINTS, linkKey } from '../data/network'
import { CORNER_RADII } from '../data/corner-radii'
import { PORTS, isPortNode, portNodeId } from '../data/ports'
import {
  CHOKEPOINTS,
  NODE_TO_CHOKEPOINT,
  OPT_IN_CHOKEPOINTS,
  type Chokepoint,
  type ChokepointId,
} from '../data/chokepoints'
import type { VesselClass } from '../data/vessels'
import {
  greatCirclePoints,
  haversineNm,
  normaliseAroundPrimeMeridian,
  roundPath,
  unwrapLongitudes,
  type LatLon,
} from './geo'

export interface GraphNode extends LatLon {
  id: string
}

const nodes = new Map<string, GraphNode>()
for (const w of WAYPOINTS) nodes.set(w.id, { id: w.id, lat: w.lat, lon: w.lon })
for (const p of PORTS) {
  const id = portNodeId(p.id)
  nodes.set(id, { id, lat: p.lat, lon: p.lon })
}

const adjacency = new Map<string, { to: string; nm: number }[]>()
const connect = (a: string, b: string) => {
  const pa = nodes.get(a)
  const pb = nodes.get(b)
  if (!pa || !pb) throw new Error(`network link references unknown node: ${a} -> ${b}`)
  const nm = haversineNm(pa, pb)
  if (!adjacency.has(a)) adjacency.set(a, [])
  if (!adjacency.has(b)) adjacency.set(b, [])
  adjacency.get(a)!.push({ to: b, nm })
  adjacency.get(b)!.push({ to: a, nm })
}
for (const [a, b] of LINKS) connect(a, b)
for (const p of PORTS) for (const anchor of p.anchors) connect(portNodeId(p.id), anchor)

export const NODES = nodes
export const ADJACENCY = adjacency

// ── Which chokepoints a given vessel and calendar can actually use ────────

export type UnavailableReason = 'closed' | 'draft' | 'beam' | 'loa' | 'season' | 'ice-class' | 'opt-out'

export interface Availability {
  usable: boolean
  reason?: UnavailableReason
}

export interface TransitContext {
  vessel: VesselClass
  /** 1-12, the month the voyage departs. */
  month: number
  iceClass: boolean
  /** Chokepoints the user has closed. */
  closed: Set<ChokepointId>
  /** Opt-in chokepoints the user has enabled (currently the NSR). */
  enabled: Set<ChokepointId>
}

export function availability(chokepoint: Chokepoint, ctx: TransitContext): Availability {
  if (ctx.closed.has(chokepoint.id)) return { usable: false, reason: 'closed' }
  if (OPT_IN_CHOKEPOINTS.includes(chokepoint.id) && !ctx.enabled.has(chokepoint.id)) {
    return { usable: false, reason: 'opt-out' }
  }
  const { vessel } = ctx
  if (chokepoint.maxDraftM !== undefined && vessel.draftM > chokepoint.maxDraftM) {
    return { usable: false, reason: 'draft' }
  }
  if (chokepoint.maxBeamM !== undefined && vessel.beamM > chokepoint.maxBeamM) {
    return { usable: false, reason: 'beam' }
  }
  if (chokepoint.maxLoaM !== undefined && vessel.loaM > chokepoint.maxLoaM) {
    return { usable: false, reason: 'loa' }
  }
  if (chokepoint.navigableMonths && !chokepoint.navigableMonths.includes(ctx.month)) {
    return { usable: false, reason: 'season' }
  }
  if (chokepoint.requiresIceClass && !ctx.iceClass) return { usable: false, reason: 'ice-class' }
  return { usable: true }
}

export function blockedNodes(ctx: TransitContext): Set<string> {
  const blocked = new Set<string>()
  for (const c of CHOKEPOINTS) {
    if (!availability(c, ctx).usable) for (const n of c.nodes) blocked.add(n)
  }
  return blocked
}

// ── Routing ───────────────────────────────────────────────────────────────

export interface Route {
  /** Graph nodes in order, origin port first. */
  nodes: string[]
  distanceNm: number
  /** Chokepoints transited, in the order they are met. */
  chokepoints: ChokepointId[]
  /** Densified great-circle points, ready to draw. */
  path: LatLon[]
}

/**
 * How the router trades distance against the fixed charges of a passage.
 *
 * Shortest-distance routeing is the wrong objective for this app: it would send
 * an Asia–Europe box ship through Panama the moment Suez closes, because Panama
 * happens to be a hair shorter than the Cape — and then silently bill the user
 * a $600k toll for the privilege. Weighting by cost reproduces what carriers
 * actually did in 2024 and keeps the chosen route consistent with the figure
 * the app reports.
 */
export interface RouteWeights {
  /** Running cost of a mile at sea: fuel plus, optionally, the ship's time. */
  usdPerNm: number
  /** One-off charges for entering a chokepoint node: dues, war risk, escort. */
  nodePenaltyUsd: Map<string, number>
}

export function routeWeights(
  vessel: VesselClass,
  options: {
    speedKn: number
    fuelUsdPerTonne: number
    charterUsdPerDay: number
    includeCharter: boolean
    includeWarRisk: boolean
  },
): RouteWeights {
  const speed = Math.max(1, options.speedKn)
  const burnPerDay = vessel.fuelTonnesPerDay * (speed / vessel.serviceSpeedKn) ** 3
  const perDay =
    burnPerDay * options.fuelUsdPerTonne + (options.includeCharter ? options.charterUsdPerDay : 0)

  const nodePenaltyUsd = new Map<string, number>()
  for (const c of CHOKEPOINTS) {
    let usd = 0
    if (c.tollUsdPerNetTon !== undefined) usd += c.tollUsdPerNetTon * vessel.canalNetTons
    if (options.includeWarRisk && c.warRiskPct !== undefined) {
      usd += (c.warRiskPct / 100) * vessel.hullValueUsd
    }
    if (c.escortUsd !== undefined) usd += c.escortUsd
    // A chokepoint made of several waypoints is charged once across them, so a
    // route through the Turkish Straits is not billed twice for one passage.
    if (usd > 0) for (const node of c.nodes) nodePenaltyUsd.set(node, usd / c.nodes.length)
  }

  return { usdPerNm: perDay / (speed * 24), nodePenaltyUsd }
}

/** Dijkstra over the sea network, skipping any blocked waypoint. */
export function findRoute(
  originPortId: string,
  destinationPortId: string,
  blocked: Set<string>,
  weights?: RouteWeights,
): Route | null {
  const start = portNodeId(originPortId)
  const goal = portNodeId(destinationPortId)
  if (!nodes.has(start) || !nodes.has(goal) || start === goal) return null

  // Cost of a leg in whatever unit the caller is optimising: nautical miles
  // when no weights are given, US dollars when they are.
  const legCost = (nm: number, to: string) =>
    weights ? nm * weights.usdPerNm + (weights.nodePenaltyUsd.get(to) ?? 0) : nm

  const score = new Map<string, number>([[start, 0]])
  const previous = new Map<string, string>()
  const settled = new Set<string>()
  const frontier = new Set<string>([start])

  while (frontier.size > 0) {
    let current: string | null = null
    let best = Infinity
    for (const id of frontier) {
      const d = score.get(id) ?? Infinity
      if (d < best) {
        best = d
        current = id
      }
    }
    if (current === null) break
    if (current === goal) break

    frontier.delete(current)
    settled.add(current)

    for (const edge of adjacency.get(current) ?? []) {
      if (settled.has(edge.to) || blocked.has(edge.to)) continue
      const candidate = best + legCost(edge.nm, edge.to)
      if (candidate < (score.get(edge.to) ?? Infinity)) {
        score.set(edge.to, candidate)
        previous.set(edge.to, current)
        frontier.add(edge.to)
      }
    }
  }

  if (!score.has(goal)) return null

  const chain: string[] = []
  for (let at: string | undefined = goal; at !== undefined; at = previous.get(at)) chain.push(at)
  chain.reverse()

  const chokepoints: ChokepointId[] = []
  for (const id of chain) {
    const c = NODE_TO_CHOKEPOINT.get(id)
    if (c && !chokepoints.includes(c.id)) chokepoints.push(c.id)
  }

  let distanceNm = 0
  for (let i = 0; i < chain.length - 1; i++) {
    distanceNm += haversineNm(nodes.get(chain[i])!, nodes.get(chain[i + 1])!)
  }

  // Rounding is cosmetic, so the reported distance stays the sum of the real
  // great-circle legs rather than the slightly shorter drawn line.
  const corners = chain.map((id) => nodes.get(id)!)
  const roundable = roundableVertices(chain)
  const smoothed = roundPath(corners, (i) =>
    roundable[i] ? (CORNER_RADII[chain[i]] ?? 0) : 0,
  )

  const path: LatLon[] = []
  for (let i = 0; i < smoothed.length - 1; i++) {
    const segment = greatCirclePoints(smoothed[i], smoothed[i + 1], 120)
    path.push(...(i === 0 ? segment : segment.slice(1)))
  }

  return {
    nodes: chain,
    distanceNm,
    chokepoints,
    path: normaliseAroundPrimeMeridian(unwrapLongitudes(path)),
  }
}

/**
 * Which corners of a routed chain may be rounded for display.
 *
 * Rounding pulls the line into the inside of the turn, so it is refused
 * wherever that inside is likely to be land or the geometry was never checked:
 * at chokepoints, at either end of a passage too narrow for the coastline data,
 * and on the port approach legs, which may run up a river.
 */
export function isRoundableCorner(previous: string, vertex: string, next: string): boolean {
  // A port approach may run up a river, which was never checked for clearance.
  if (isPortNode(previous) || isPortNode(vertex) || isPortNode(next)) return false
  if (NODE_TO_CHOKEPOINT.has(vertex)) return false
  if (EXEMPT_LINKS.has(linkKey(previous, vertex))) return false
  if (EXEMPT_LINKS.has(linkKey(vertex, next))) return false
  return true
}

export function roundableVertices(chain: string[]): boolean[] {
  return chain.map((id, i) =>
    i === 0 || i === chain.length - 1
      ? false
      : isRoundableCorner(chain[i - 1], id, chain[i + 1]),
  )
}
