import { Fragment, useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Pane, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type {
  Bounds,
  LatLng,
  LatLngBoundsExpression,
  LatLngExpression,
  Map as LeafletMap,
  Point,
  Polyline as LeafletPolyline,
} from 'leaflet'
import { CHOKEPOINTS, type ChokepointId } from '../data/chokepoints'
import type { Port } from '../data/ports'
import { availability, type Route, type TransitContext } from '../engine/graph'
import { useI18n } from '../i18n'

interface Props {
  baseline: Route | null
  alternative: Route | null
  origin: Port
  destination: Port
  closed: Set<ChokepointId>
  context: TransitContext
  onToggleChokepoint: (id: ChokepointId) => void
}

/**
 * CARTO's basemaps now answer every tile with an "API key required" watermark,
 * so the tiles come from OpenStreetMap. It has no dark style: in dark mode the
 * same tiles are inverted in CSS (`.map__tiles--dark`).
 */
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/** Copies of the world drawn either side of the primary one. */
const WORLD_OFFSETS = [-360, 0, 360]

/**
 * Leaflet rounds every projected point to a whole pixel. At world zoom the
 * corner arcs are sampled more densely than that, so the rounding turned them
 * into a staircase. This swaps in the same projection without the rounding.
 * Used as a ref: it runs before react-leaflet adds the layer to the map.
 */
function projectWithoutRounding(line: LeafletPolyline | null) {
  if (!line) return
  const target = line as unknown as {
    _map: LeafletMap
    _projectLatlngs: (latlngs: LatLng[], rings: Point[][], bounds: Bounds) => void
  }
  target._projectLatlngs = (latlngs, rings, bounds) => {
    const origin = target._map.getPixelOrigin()
    const ring = latlngs.map((latlng) => target._map.project(latlng).subtract(origin))
    for (const point of ring) bounds.extend(point)
    rings.push(ring)
  }
}

/**
 * Leaflet paints SVG through inline attributes, so it cannot use the CSS
 * custom properties the rest of the app is themed with. Rather than keep a
 * second copy of the palette here — which would drift, and did — the values are
 * read back out of the stylesheet on each render. The media listener covers the
 * case where nothing else re-renders the map when the OS theme flips.
 */
function useThemePalette() {
  const [, bumpTheme] = useState(0)

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => bumpTheme((n) => n + 1)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  const css = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback

  return {
    baseline: read('--route-baseline', '#2a78d6'),
    alternative: read('--route-alternative', '#eb6834'),
    open: read('--status-good', '#0ca30c'),
    closed: read('--status-critical', '#d03b3b'),
    unavailable: read('--ink-muted', '#898781'),
    destination: read('--port-destination', '#4a3aa7'),
    surface: read('--surface', '#fcfcfb'),
    dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  }
}

function FitRoutes({ routes }: { routes: Route[] }) {
  const map = useMap()
  const signature = routes.map((r) => r.nodes.join('>')).join('||')

  useEffect(() => {
    const points = routes.flatMap((r) => r.path)
    if (points.length === 0) return
    const bounds: LatLngBoundsExpression = [
      [Math.min(...points.map((p) => p.lat)), Math.min(...points.map((p) => p.lon))],
      [Math.max(...points.map((p) => p.lat)), Math.max(...points.map((p) => p.lon))],
    ]
    map.fitBounds(bounds, { padding: [48, 48], animate: true })
    // `signature` captures every change that should refit the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature])

  return null
}

export function MapView(props: Props) {
  const { t, formatNumber } = useI18n()
  const palette = useThemePalette()

  const routes = [props.baseline, props.alternative].filter((r): r is Route => r !== null)
  const identical =
    props.baseline && props.alternative
      ? props.baseline.nodes.join('>') === props.alternative.nodes.join('>')
      : false

  const toPositions = (route: Route, offset: number): LatLngExpression[] =>
    route.path.map((p) => [p.lat, p.lon + offset])

  return (
    // Geographic axes, not textual ones: the map never mirrors.
    <div className="map" dir="ltr">
      <MapContainer
        center={[25, 30]}
        zoom={2}
        minZoom={2}
        worldCopyJump={false}
        scrollWheelZoom
        className="map__canvas"
      >
        {/* react-leaflet does not update className after mount, so the theme remounts the layer. */}
        <TileLayer
          key={palette.dark ? 'dark' : 'light'}
          url={TILES}
          className={palette.dark ? 'map__tiles--dark' : 'map__tiles--light'}
          attribution={ATTRIBUTION}
        />
        <FitRoutes routes={routes} />

        {/*
          Leaflet stacks layers in the order they are added, so a layer that mounts
          later (after a passage is toggled) would cover the ones already there.
          Panes fix the stacking instead: casings, lines, running dots, markers.
        */}
        <Pane name="route-casings" style={{ zIndex: 390 }}>
          {WORLD_OFFSETS.map((offset) => {
            const cased = identical ? props.baseline : props.alternative
            return (
              cased && (
                // A casing in the surface colour keeps the line legible over busy tiles.
                <Polyline
                  key={offset}
                  ref={projectWithoutRounding}
                  positions={toPositions(cased, offset)}
                  smoothFactor={0}
                  interactive={false}
                  pathOptions={{ color: palette.surface, weight: 8, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
                />
              )
            )
          })}
        </Pane>

        {WORLD_OFFSETS.map((offset) => (
          <Fragment key={offset}>
            {props.baseline && (
              <Polyline
                ref={projectWithoutRounding}
                positions={toPositions(props.baseline, offset)}
                // smoothFactor 0: Leaflet's render-time simplification would
                // otherwise throw away the rounded corners at world zoom.
                smoothFactor={0}
                pathOptions={{
                  color: palette.baseline,
                  weight: identical ? 4 : 3,
                  opacity: 0.9,
                  dashArray: identical ? undefined : '1 7',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}
            {props.alternative && !identical && (
              <Polyline
                ref={projectWithoutRounding}
                positions={toPositions(props.alternative, offset)}
                smoothFactor={0}
                pathOptions={{
                  color: palette.alternative,
                  weight: 4,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                  className: 'route route--alternative',
                }}
              />
            )}
          </Fragment>
        ))}

        <Pane name="route-flow" style={{ zIndex: 410 }}>
          {WORLD_OFFSETS.map(
            (offset) =>
              props.alternative &&
              !identical && (
                // Dots that run along the detour, origin to destination (`.route-flow`).
                <Polyline
                  key={offset}
                  ref={projectWithoutRounding}
                  positions={toPositions(props.alternative, offset)}
                  smoothFactor={0}
                  interactive={false}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 2,
                    opacity: 0.8,
                    dashArray: '1 14',
                    lineCap: 'round',
                    className: 'route-flow',
                  }}
                />
              ),
          )}
        </Pane>

        <Pane name="markers" style={{ zIndex: 450 }}>
          {WORLD_OFFSETS.map((offset) =>
            CHOKEPOINTS.map((chokepoint) => {
              const isClosed = props.closed.has(chokepoint.id)
              const physical = availability(chokepoint, {
                ...props.context,
                closed: new Set(),
                enabled: new Set([chokepoint.id]),
              })
              const onAlternative = props.alternative?.chokepoints.includes(chokepoint.id) ?? false
              // When nothing is closed the two routes coincide, so a transited
              // passage should read as baseline rather than as a diversion.
              const onRouteColor = identical ? palette.baseline : palette.alternative
              const color = isClosed
                ? palette.closed
                : !physical.usable
                  ? palette.unavailable
                  : onAlternative
                    ? onRouteColor
                    : palette.open

              return (
                <CircleMarker
                  key={`${chokepoint.id}-${offset}`}
                  center={[chokepoint.lat, chokepoint.lon + offset]}
                  radius={isClosed ? 8 : onAlternative ? 5.5 : 5}
                  pathOptions={{
                    color,
                    // A passage on the route reads as a station on the line: a ring
                    // in the route colour, hollow so the line stays continuous.
                    fillColor: onAlternative && !isClosed ? palette.surface : color,
                    fillOpacity: isClosed ? 0.85 : onAlternative ? 1 : 0.35,
                    weight: onAlternative && !isClosed ? 2.5 : 2,
                  }}
                  eventHandlers={{ click: () => props.onToggleChokepoint(chokepoint.id) }}
                >
                  <Tooltip direction="top" offset={[0, -6]}>
                    <strong>{t.chokepoint[chokepoint.id]}</strong>
                    <br />
                    {isClosed
                      ? t.map.closed
                      : physical.usable
                        ? t.map.open
                        : `${t.map.unavailable} — ${physical.reason ? t.reason[physical.reason] : ''}`}
                    {chokepoint.tradeSharePct !== undefined && (
                      <>
                        <br />
                        {chokepoint.tradeSharePct}% {t.map.tradeShare}
                      </>
                    )}
                    {chokepoint.maxDraftM !== undefined && (
                      <>
                        <br />
                        {t.map.maxDraft}: {formatNumber(chokepoint.maxDraftM, 1)} m
                      </>
                    )}
                  </Tooltip>
                </CircleMarker>
              )
            }),
          )}

          {WORLD_OFFSETS.map((offset) =>
            [props.origin, props.destination].map((port, index) => (
              <CircleMarker
                key={`${port.id}-${index}-${offset}`}
                center={[port.lat, port.lon + offset]}
                radius={7}
                pathOptions={{
                  color: palette.surface,
                  fillColor: index === 0 ? palette.baseline : palette.destination,
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -6]} permanent>
                  {port.name}
                </Tooltip>
              </CircleMarker>
            )),
          )}
        </Pane>
      </MapContainer>

      <div className="map__legend">
        <span className="legend__item">
          <i className="legend__swatch legend__swatch--baseline" />
          {t.map.baselineRoute}
        </span>
        <span className="legend__item">
          <i className="legend__swatch legend__swatch--alternative" />
          {t.map.alternativeRoute}
        </span>
        <span className="legend__item">
          <i className="legend__dot legend__dot--open" />
          {t.map.open}
        </span>
        <span className="legend__item">
          <i className="legend__dot legend__dot--closed" />
          {t.map.closed}
        </span>
      </div>
    </div>
  )
}
