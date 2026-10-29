export interface LatLon {
  lat: number
  lon: number
}

/** Earth mean radius in nautical miles. */
export const EARTH_RADIUS_NM = 3440.065

export const toRad = (deg: number) => (deg * Math.PI) / 180
export const toDeg = (rad: number) => (rad * 180) / Math.PI

/** Great-circle distance in nautical miles. */
export function haversineNm(a: LatLon, b: LatLon): number {
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const dLat = lat2 - lat1
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Points along the great circle between a and b, spaced at most
 * `maxSegmentNm` apart. Endpoints are always included.
 */
export function greatCirclePoints(
  a: LatLon,
  b: LatLon,
  maxSegmentNm = 150,
): LatLon[] {
  const distance = haversineNm(a, b)
  const steps = Math.max(1, Math.ceil(distance / maxSegmentNm))
  if (steps === 1) return [a, b]

  const lat1 = toRad(a.lat)
  const lon1 = toRad(a.lon)
  const lat2 = toRad(b.lat)
  const lon2 = toRad(b.lon)
  const angular = distance / EARTH_RADIUS_NM
  const sinAngular = Math.sin(angular)

  // Degenerate (antipodal or coincident) — nothing to interpolate.
  if (sinAngular === 0) return [a, b]

  const out: LatLon[] = []
  for (let i = 0; i <= steps; i++) {
    const f = i / steps
    const A = Math.sin((1 - f) * angular) / sinAngular
    const B = Math.sin(f * angular) / sinAngular
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2)
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    out.push({
      lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
      lon: toDeg(Math.atan2(y, x)),
    })
  }
  return out
}

// ── Corner rounding ───────────────────────────────────────────────────────
//
// A route is a chain of waypoints, so it meets itself at an angle at every one
// of them. Drawing that raw reads as a graph rather than as a course. Rounding
// replaces each corner with a short arc — but only ever *inside* the turn,
// which near a cape or a strait is where the land is, so the radius is kept
// small and some corners are left sharp. See `roundableVertices` in graph.ts.

type Vec3 = [number, number, number]

const toVec = (p: LatLon): Vec3 => {
  const lat = toRad(p.lat)
  const lon = toRad(p.lon)
  return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)]
}

const toLatLon = ([x, y, z]: Vec3): LatLon => ({
  lat: toDeg(Math.atan2(z, Math.hypot(x, y))),
  lon: toDeg(Math.atan2(y, x)),
})

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

const normalise = (v: Vec3): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2])
  return length === 0 ? v : [v[0] / length, v[1] / length, v[2] / length]
}

/** Interpolate along the great circle from a to b. */
function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const omega = Math.acos(Math.min(1, Math.max(-1, dot(a, b))))
  if (omega < 1e-9) return a
  const sin = Math.sin(omega)
  const wa = Math.sin((1 - t) * omega) / sin
  const wb = Math.sin(t * omega) / sin
  return normalise([a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb])
}

export interface CornerOptions {
  /** Radius as a share of the shorter adjacent leg, which self-limits in tight water. */
  fraction: number
  maxRadiusNm: number
  /** Below this the arc is invisible and not worth the deviation. */
  minRadiusNm: number
  /** Corners straighter than this are left alone. */
  minTurnDeg: number
  samples: number
}

export const DEFAULT_CORNER: CornerOptions = {
  fraction: 0.2,
  maxRadiusNm: 600,
  minRadiusNm: 4,
  minTurnDeg: 6,
  samples: 18,
}

/**
 * The arc that replaces the corner at `v`, or null when the corner should stay
 * sharp. A quadratic Bézier evaluated with slerp, so it starts and ends on the
 * original legs and never leaves the sphere.
 */
export function cornerArc(
  a: LatLon,
  v: LatLon,
  c: LatLon,
  options: CornerOptions = DEFAULT_CORNER,
): LatLon[] | null {
  const legIn = haversineNm(a, v)
  const legOut = haversineNm(v, c)
  const radius = Math.min(options.maxRadiusNm, options.fraction * Math.min(legIn, legOut))
  if (radius < options.minRadiusNm) return null

  const va = toVec(a)
  const vv = toVec(v)
  const vc = toVec(c)

  // Tangents at v pointing back along each leg; the angle between them is the
  // interior angle, so a straight-through vertex measures 180 degrees.
  const towards = (target: Vec3) => {
    const projected: Vec3 = [
      target[0] - vv[0] * dot(target, vv),
      target[1] - vv[1] * dot(target, vv),
      target[2] - vv[2] * dot(target, vv),
    ]
    return normalise(projected)
  }
  const interior = Math.acos(Math.min(1, Math.max(-1, dot(towards(va), towards(vc)))))
  if (Math.PI - interior < toRad(options.minTurnDeg)) return null

  const p0 = slerp(vv, va, radius / legIn)
  const p1 = slerp(vv, vc, radius / legOut)

  const arc: LatLon[] = []
  for (let i = 0; i <= options.samples; i++) {
    const t = i / options.samples
    arc.push(toLatLon(slerp(slerp(p0, vv, t), slerp(vv, p1, t), t)))
  }
  return arc
}

/**
 * Replaces roundable interior vertices with arcs. Everything between two arcs
 * still lies exactly on the original legs, so only the corners deviate from the
 * geometry the network validator checked.
 */
export function roundPath(
  vertices: LatLon[],
  /** Largest radius allowed at each vertex; zero leaves that corner sharp. */
  maxRadiusForVertex: (index: number) => number,
  options: CornerOptions = DEFAULT_CORNER,
): LatLon[] {
  if (vertices.length < 3) return vertices

  const out: LatLon[] = [vertices[0]]
  for (let i = 1; i < vertices.length - 1; i++) {
    const cap = maxRadiusForVertex(i)
    const arc =
      cap > 0
        ? cornerArc(vertices[i - 1], vertices[i], vertices[i + 1], {
            ...options,
            maxRadiusNm: Math.min(options.maxRadiusNm, cap),
          })
        : null
    if (arc) out.push(...arc)
    else out.push(vertices[i])
  }
  out.push(vertices[vertices.length - 1])
  return out
}

/**
 * Makes longitudes continuous so a polyline that crosses the antimeridian is
 * drawn as one unbroken line instead of wrapping the whole way round the map.
 * Longitudes may end up outside [-180, 180]; Leaflet handles that fine.
 */
export function unwrapLongitudes(path: LatLon[]): LatLon[] {
  if (path.length === 0) return []
  const out: LatLon[] = [path[0]]
  let offset = 0
  for (let i = 1; i < path.length; i++) {
    const prevRaw = path[i - 1].lon
    const delta = path[i].lon - prevRaw
    if (delta > 180) offset -= 360
    else if (delta < -180) offset += 360
    out.push({ lat: path[i].lat, lon: path[i].lon + offset })
  }
  return out
}

/** Recentres an unwrapped path so its midpoint sits closest to the map origin. */
export function normaliseAroundPrimeMeridian(path: LatLon[]): LatLon[] {
  if (path.length === 0) return []
  const mid = path[Math.floor(path.length / 2)].lon
  const shift = -Math.round(mid / 360) * 360
  return shift === 0 ? path : path.map((p) => ({ lat: p.lat, lon: p.lon + shift }))
}

export const toLeaflet = (p: LatLon): [number, number] => [p.lat, p.lon]
