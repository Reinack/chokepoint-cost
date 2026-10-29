/**
 * Checks every link in the maritime network against Natural Earth coastlines.
 *
 * Run with `npm run validate:network`. Any link whose great circle passes over
 * land is reported with the offending sample points, so the waypoint can be
 * nudged back into the water.
 */
import { WAYPOINTS, LINKS, EXEMPT_LINKS, linkKey } from '../src/data/network.ts'
import { PORTS, portNodeId } from '../src/data/ports.ts'
import { isRoundableCorner } from '../src/engine/graph.ts'
import { DEFAULT_CORNER, cornerArc, greatCirclePoints, haversineNm, type LatLon } from '../src/engine/geo.ts'
import { CORNER_RADII } from '../src/data/corner-radii.ts'
import { createCoastProximity, isLand } from './land.ts'

// Distance from a port at which we stop checking: berths and their immediate
// approaches sit inside the coastline as far as a 50m land layer is concerned.
const PORT_TOLERANCE_NM = 12
const SAMPLE_SPACING_NM = 10

// ── Assemble the full node set, waypoints plus ports ─────────────────────
const nodes = new Map<string, LatLon>()
for (const w of WAYPOINTS) nodes.set(w.id, { lat: w.lat, lon: w.lon })

const allLinks: { a: string; b: string; skipEnds: boolean }[] = LINKS.map(([a, b]) => ({
  a,
  b,
  skipEnds: false,
}))

const riverPorts = new Set<string>()
for (const port of PORTS) {
  const id = portNodeId(port.id)
  nodes.set(id, { lat: port.lat, lon: port.lon })
  if (port.river) riverPorts.add(id)
  for (const anchor of port.anchors) allLinks.push({ a: id, b: anchor, skipEnds: true })
}

// ── Walk every link ──────────────────────────────────────────────────────
let problems = 0
let checked = 0

for (const { a, b, skipEnds } of allLinks) {
  if (EXEMPT_LINKS.has(linkKey(a, b))) continue
  if (riverPorts.has(a) || riverPorts.has(b)) continue

  const pa = nodes.get(a)
  const pb = nodes.get(b)
  if (!pa) {
    console.error(`✗ link ${a} -> ${b}: unknown node "${a}"`)
    problems++
    continue
  }
  if (!pb) {
    console.error(`✗ link ${a} -> ${b}: unknown node "${b}"`)
    problems++
    continue
  }

  checked++
  const samples = greatCirclePoints(pa, pb, SAMPLE_SPACING_NM)
  const hits: LatLon[] = []
  for (const s of samples) {
    if (skipEnds) {
      if (haversineNm(s, pa) < PORT_TOLERANCE_NM || haversineNm(s, pb) < PORT_TOLERANCE_NM) continue
    }
    if (isLand(s)) hits.push(s)
  }

  if (hits.length > 0) {
    problems++
    const worst = hits[Math.floor(hits.length / 2)]
    const nm = Math.round(haversineNm(pa, pb))
    console.error(
      `✗ ${a} -> ${b} (${nm} nm): ${hits.length}/${samples.length} samples on land, ` +
        `e.g. ${worst.lat.toFixed(2)}, ${worst.lon.toFixed(2)}`,
    )
  }
}

// ── Rounded corners must stay at sea too ─────────────────────────────────
//
// Rounding bends the drawn line into the inside of a turn, which the link check
// above never looked at. Rather than sample a few routes, every corner the
// graph can physically produce is enumerated, so no future routeing can find an
// arc that was not tested here.

const adjacency = new Map<string, string[]>()
for (const { a, b } of allLinks) {
  if (!adjacency.has(a)) adjacency.set(a, [])
  if (!adjacency.has(b)) adjacency.set(b, [])
  adjacency.get(a)!.push(b)
  adjacency.get(b)!.push(a)
}

const nearCoast = createCoastProximity(0.2, 1)

let cornersChecked = 0
let cornersRounded = 0

for (const [vertex, neighbourList] of adjacency) {
  const neighbours = [...new Set(neighbourList)]
  for (let i = 0; i < neighbours.length; i++) {
    for (let j = i + 1; j < neighbours.length; j++) {
      const previous = neighbours[i]
      const next = neighbours[j]
      if (!isRoundableCorner(previous, vertex, next)) continue

      cornersChecked++
      const cap = CORNER_RADII[vertex] ?? 0
      const arc =
        cap > 0
          ? cornerArc(nodes.get(previous)!, nodes.get(vertex)!, nodes.get(next)!, {
              ...DEFAULT_CORNER,
              maxRadiusNm: Math.min(DEFAULT_CORNER.maxRadiusNm, cap),
            })
          : null
      if (!arc) continue
      cornersRounded++

      const hits = arc.filter((p) => isLand(p) || nearCoast(p))
      if (hits.length > 0) {
        problems++
        const worst = hits[Math.floor(hits.length / 2)]
        console.error(
          `✗ corner ${previous} -> ${vertex} -> ${next}: rounded arc crosses land, ` +
            `e.g. ${worst.lat.toFixed(2)}, ${worst.lon.toFixed(2)}`,
        )
      }
    }
  }
}

// ── Connectivity: every node must be reachable ───────────────────────────
const seen = new Set<string>(['rotterdam'].map(portNodeId))
const queue = [...seen]
while (queue.length) {
  const current = queue.pop()!
  for (const next of adjacency.get(current) ?? []) {
    if (!seen.has(next)) {
      seen.add(next)
      queue.push(next)
    }
  }
}
for (const id of nodes.keys()) {
  if (!seen.has(id)) {
    console.error(`✗ node "${id}" is unreachable from Rotterdam`)
    problems++
  }
}

console.log(
  `\n${checked} links and ${cornersRounded} rounded corners (of ${cornersChecked} roundable) checked against Natural Earth 50m, ${nodes.size} nodes total.`,
)
if (problems === 0) {
  console.log('✓ network clean: no link or rounded corner crosses land, no node stranded.')
} else {
  console.error(`\n${problems} problem(s) found.`)
  process.exit(1)
}
