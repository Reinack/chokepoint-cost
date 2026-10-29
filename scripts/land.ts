/**
 * Point-in-land test over Natural Earth 50m coastlines.
 *
 * Shared by the network validator and the corner-radius generator so both judge
 * "is this at sea?" by exactly the same rule.
 */
import { feature } from 'topojson-client'
import land50m from 'world-atlas/land-50m.json' with { type: 'json' }
import type { LatLon } from '../src/engine/geo.ts'

type Ring = [number, number][]

const collection = feature(
  land50m as never,
  (land50m as never as { objects: { land: unknown } }).objects.land,
) as { features: { geometry: { type: string; coordinates: unknown } }[] }

const rawPolygons: Ring[][] = []
for (const f of collection.features) {
  const { type, coordinates } = f.geometry
  if (type === 'Polygon') rawPolygons.push(coordinates as Ring[])
  else if (type === 'MultiPolygon') for (const poly of coordinates as Ring[][]) rawPolygons.push(poly)
}

/**
 * Rings that cross the antimeridian arrive with longitudes that jump from +180
 * to -180, which breaks ray casting for every point whose ray crosses the seam.
 * Unwrapping makes each ring continuous, at the price of longitudes outside
 * [-180, 180] — which the point test compensates for by trying the sample at x,
 * x-360 and x+360.
 */
function unwrapRing(ring: Ring): Ring {
  const out: Ring = [ring[0]]
  let offset = 0
  for (let i = 1; i < ring.length; i++) {
    const delta = ring[i][0] - ring[i - 1][0]
    if (delta > 180) offset -= 360
    else if (delta < -180) offset += 360
    out.push([ring[i][0] + offset, ring[i][1]])
  }
  return out
}

const bboxOf = (ring: Ring) => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of ring) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY }
}

/**
 * Antarctica encircles the pole, so no planar ring can describe it, and the
 * quantised topology also carries a couple of degenerate slivers spanning the
 * whole globe. Both are dropped; Antarctica is covered by a latitude rule
 * instead, well south of any commercial routeing.
 */
const ANTARCTIC_LIMIT = -62

const polygons = rawPolygons
  .map((poly) => poly.map(unwrapRing))
  .filter((poly) => {
    const b = bboxOf(poly[0])
    return b.maxX - b.minX < 350
  })

const boxes = polygons.map((poly) => bboxOf(poly[0]))

function inRing(ring: Ring, x: number, y: number): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/**
 * Whether a point lies within `marginCells` of any coastline.
 *
 * Point-in-polygon is the wrong instrument for judging a decorative arc: an
 * island a mile or two across is smaller than the gap between samples, so
 * whether the test notices it is luck — Bermuda was caught at 18 samples and
 * missed at 48. Rasterising the coastline into a grid and asking "is there
 * shore nearby?" answers the question that actually matters, and gives the same
 * answer no matter how the arc is sampled.
 */
export function createCoastProximity(cellDeg = 0.2, marginCells = 1) {
  const nx = Math.round(360 / cellDeg)
  const ny = Math.round(180 / cellDeg)
  const grid = new Uint8Array(nx * ny)

  const cellOf = (lon: number, lat: number) => {
    const wrapped = ((((lon + 180) % 360) + 360) % 360) - 180
    const ix = Math.min(nx - 1, Math.max(0, Math.floor((wrapped + 180) / cellDeg)))
    const iy = Math.min(ny - 1, Math.max(0, Math.floor((lat + 90) / cellDeg)))
    return { ix, iy }
  }

  const mark = (lon: number, lat: number) => {
    const { ix, iy } = cellOf(lon, lat)
    for (let dy = -marginCells; dy <= marginCells; dy++) {
      const y = iy + dy
      if (y < 0 || y >= ny) continue
      for (let dx = -marginCells; dx <= marginCells; dx++) {
        const x = (((ix + dx) % nx) + nx) % nx
        grid[y * nx + x] = 1
      }
    }
  }

  // Walk each coastline segment at half-cell steps so nothing slips between marks.
  const step = cellDeg / 2
  for (const poly of polygons) {
    for (const ring of poly) {
      for (let i = 1; i < ring.length; i++) {
        const [x0, y0] = ring[i - 1]
        const [x1, y1] = ring[i]
        const span = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
        const steps = Math.max(1, Math.ceil(span / step))
        for (let s = 0; s <= steps; s++) {
          const t = s / steps
          mark(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)
        }
      }
    }
  }

  return (p: LatLon) => {
    const { ix, iy } = cellOf(p.lon, p.lat)
    return grid[iy * nx + ix] === 1
  }
}

export function isLand(p: LatLon): boolean {
  const y = p.lat
  if (y < ANTARCTIC_LIMIT) return true
  const base = ((((p.lon + 180) % 360) + 360) % 360) - 180
  for (let i = 0; i < polygons.length; i++) {
    const b = boxes[i]
    if (y < b.minY || y > b.maxY) continue
    for (const x of [base, base - 360, base + 360]) {
      if (x < b.minX || x > b.maxX) continue
      const poly = polygons[i]
      if (!inRing(poly[0], x, y)) continue
      let inHole = false
      for (let h = 1; h < poly.length; h++) {
        if (inRing(poly[h], x, y)) {
          inHole = true
          break
        }
      }
      if (!inHole) return true
    }
  }
  return false
}
