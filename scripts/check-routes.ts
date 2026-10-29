/**
 * Sanity-checks routed distances against published sea distances.
 *
 * These are the trades whose real-world figures are well documented, so a
 * regression in the waypoint network shows up here as a percentage error
 * rather than as a plausible-looking map.
 */
import { availability, blockedNodes, findRoute, routeWeights } from '../src/engine/graph.ts'
import { VESSEL_BY_ID } from '../src/data/vessels.ts'
import { DEFAULT_COST_PARAMS } from '../src/engine/cost.ts'
import { CHOKEPOINT_BY_ID, type ChokepointId } from '../src/data/chokepoints.ts'
import { SCENARIOS } from '../src/data/scenarios.ts'

interface Case {
  from: string
  to: string
  vessel: string
  close: ChokepointId[]
  /** Published distance in nautical miles, and the tolerance we allow. */
  expectedNm: number
  tolerance: number
  note: string
}

const CASES: Case[] = [
  {
    from: 'shanghai',
    to: 'rotterdam',
    vessel: 'container-neopanamax',
    close: [],
    // SEA-DISTANCES.ORG, as quoted by Ostrum AM (MyStratWeekly, 16 Jan 2024).
    expectedNm: 10525,
    tolerance: 0.1,
    note: 'Asia–Europe via Suez',
  },
  {
    from: 'shanghai',
    to: 'rotterdam',
    vessel: 'container-neopanamax',
    close: ['suez-canal'],
    // Same source as the Suez case, so the two give the published detour.
    expectedNm: 13843,
    tolerance: 0.1,
    note: 'Asia–Europe via Cape of Good Hope',
  },
  {
    from: 'singapore',
    to: 'rotterdam',
    vessel: 'container-neopanamax',
    close: [],
    expectedNm: 8300,
    tolerance: 0.1,
    note: 'Singapore–Rotterdam via Suez',
  },
  {
    from: 'shanghai',
    to: 'los-angeles',
    vessel: 'container-neopanamax',
    close: [],
    expectedNm: 5700,
    tolerance: 0.1,
    note: 'Transpacific great circle',
  },
  {
    from: 'new-york',
    to: 'rotterdam',
    vessel: 'container-panamax',
    close: [],
    expectedNm: 3300,
    tolerance: 0.1,
    note: 'North Atlantic',
  },
  {
    from: 'ras-tanura',
    to: 'rotterdam',
    vessel: 'tanker-vlcc',
    close: [],
    expectedNm: 11600,
    tolerance: 0.1,
    note: 'Gulf–Europe VLCC, too deep for Suez so already via the Cape',
  },
  {
    from: 'new-york',
    to: 'los-angeles',
    vessel: 'container-panamax',
    close: [],
    expectedNm: 5300,
    tolerance: 0.1,
    note: 'US east–west via Panama',
  },
  {
    from: 'santos',
    to: 'shanghai',
    vessel: 'bulker-capesize',
    close: [],
    expectedNm: 11000,
    tolerance: 0.1,
    note: 'Brazil–China ore, via the Cape',
  },
]

/**
 * Facts about who may use which passage. These encode the physical limits that
 * make the model behave like the real fleet, so a careless edit to a vessel or
 * chokepoint dimension is caught rather than quietly changing every answer.
 */
const RULES: { vessel: string; chokepoint: ChokepointId; usable: boolean; why: string }[] = [
  { vessel: 'container-ulcv', chokepoint: 'panama-canal', usable: false, why: '16 m draft and 61.5 m beam vs the 15.2 m / 51.25 m locks' },
  { vessel: 'container-ulcv', chokepoint: 'suez-canal', usable: true, why: 'Suez has no locks' },
  { vessel: 'container-neopanamax', chokepoint: 'panama-canal', usable: true, why: 'built to the new locks' },
  { vessel: 'tanker-vlcc', chokepoint: 'suez-canal', usable: false, why: '22.5 m laden draft vs 20.1 m' },
  { vessel: 'tanker-vlcc', chokepoint: 'panama-canal', usable: false, why: 'too wide and too deep' },
  { vessel: 'tanker-suezmax', chokepoint: 'suez-canal', usable: true, why: 'that is the point of the class' },
  { vessel: 'bulker-capesize', chokepoint: 'danish-straits', usable: false, why: '18.2 m draft vs 15 m Great Belt' },
  { vessel: 'bulker-capesize', chokepoint: 'cape-of-good-hope', usable: true, why: 'open water' },
  { vessel: 'container-feeder', chokepoint: 'kiel-canal', usable: true, why: 'within every Kiel limit' },
  { vessel: 'bulker-panamax', chokepoint: 'kiel-canal', usable: false, why: '14.4 m draft vs 9.5 m' },
  { vessel: 'tanker-vlcc', chokepoint: 'turkish-straits', usable: false, why: '22.5 m draft and 333 m LOA vs the 17 m / 300 m limits' },
]

let failures = 0

console.log('Vessel and passage compatibility\n')
for (const rule of RULES) {
  const vessel = VESSEL_BY_ID.get(rule.vessel)!
  const chokepoint = CHOKEPOINT_BY_ID.get(rule.chokepoint)!
  const result = availability(chokepoint, {
    vessel,
    month: 6,
    iceClass: false,
    closed: new Set(),
    enabled: new Set([rule.chokepoint]),
  })
  const ok = result.usable === rule.usable
  if (!ok) failures++
  console.log(
    `${ok ? '✓' : '✗'} ${rule.vessel} ${rule.usable ? 'may' : 'may not'} use ${rule.chokepoint}` +
      ` — ${rule.why}${result.reason ? ` [${result.reason}]` : ''}`,
  )
}

// The Northern Sea Route is seasonal and needs an ice-classed hull.
const nsr = CHOKEPOINT_BY_ID.get('northern-sea-route')!
const nsrContext = { vessel: VESSEL_BY_ID.get('container-panamax')!, closed: new Set<ChokepointId>() }
const nsrChecks = [
  { month: 8, iceClass: true, expect: true, label: 'August with ice class' },
  { month: 2, iceClass: true, expect: false, label: 'February with ice class' },
  { month: 8, iceClass: false, expect: false, label: 'August without ice class' },
]
for (const check of nsrChecks) {
  const result = availability(nsr, {
    ...nsrContext,
    month: check.month,
    iceClass: check.iceClass,
    enabled: new Set<ChokepointId>(['northern-sea-route']),
  })
  const ok = result.usable === check.expect
  if (!ok) failures++
  console.log(`${ok ? '✓' : '✗'} NSR ${check.expect ? 'open' : 'closed'} — ${check.label}`)
}

console.log('\nRouted distance versus published sea distances\n')

for (const testCase of CASES) {
  const vessel = VESSEL_BY_ID.get(testCase.vessel)!
  const blocked = blockedNodes({
    vessel,
    month: 6,
    iceClass: false,
    closed: new Set(testCase.close),
    enabled: new Set(),
  })
  const weights = routeWeights(vessel, {
    ...DEFAULT_COST_PARAMS,
    speedKn: vessel.serviceSpeedKn,
    charterUsdPerDay: vessel.charterUsdPerDay,
  })
  const route = findRoute(testCase.from, testCase.to, blocked, weights)

  if (!route) {
    console.error(`✗ ${testCase.from} -> ${testCase.to} (${testCase.note}): no route found`)
    failures++
    continue
  }

  const error = (route.distanceNm - testCase.expectedNm) / testCase.expectedNm
  const ok = Math.abs(error) <= testCase.tolerance
  if (!ok) failures++

  const pct = `${error >= 0 ? '+' : ''}${(error * 100).toFixed(1)}%`
  console.log(
    `${ok ? '✓' : '✗'} ${testCase.from} -> ${testCase.to}  ` +
      `${Math.round(route.distanceNm)} nm vs ${testCase.expectedNm} expected (${pct})\n` +
      `    ${testCase.note}\n` +
      `    via ${route.chokepoints.join(', ') || '—'}`,
  )
}

// ── Scenarios where the answer is qualitative, not a distance ────────────

console.log('\nScenarios\n')
let scenarios = 0

const scenario = (label: string, pass: boolean, detail: string) => {
  scenarios++
  if (!pass) failures++
  console.log(`${pass ? '✓' : '✗'} ${label} — ${detail}`)
}

const route = (from: string, to: string, vesselId: string, ctx: Partial<{ close: ChokepointId[]; enable: ChokepointId[]; month: number; iceClass: boolean }>) => {
  const vessel = VESSEL_BY_ID.get(vesselId)!
  const context = {
    vessel,
    month: ctx.month ?? 6,
    iceClass: ctx.iceClass ?? false,
    closed: new Set(ctx.close ?? []),
    enabled: new Set(ctx.enable ?? []),
  }
  const weights = routeWeights(vessel, {
    ...DEFAULT_COST_PARAMS,
    speedKn: vessel.serviceSpeedKn,
    charterUsdPerDay: vessel.charterUsdPerDay,
  })
  return findRoute(from, to, blockedNodes(context), weights)
}

// Closing Hormuz strands the Persian Gulf: there is no second way out.
const stranded = route('ras-tanura', 'rotterdam', 'tanker-vlcc', { close: ['hormuz'] })
scenario('Hormuz closed strands Gulf loadings', stranded === null, 'no alternative route exists')

// Closing Bab el-Mandeb makes Suez a dead end for Asia–Europe on its own.
const viaCape = route('shanghai', 'rotterdam', 'container-neopanamax', { close: ['bab-el-mandeb'] })
scenario(
  'Bab el-Mandeb closure also empties Suez',
  viaCape !== null && !viaCape.chokepoints.includes('suez-canal'),
  `routes via ${viaCape?.chokepoints.join(', ')}`,
)

// The NSR only competes when it is both open and permitted.
const arcticSummer = route('shanghai', 'rotterdam', 'container-panamax', {
  close: ['suez-canal'],
  enable: ['northern-sea-route'],
  month: 8,
  iceClass: true,
})
const arcticWinter = route('shanghai', 'rotterdam', 'container-panamax', {
  close: ['suez-canal'],
  enable: ['northern-sea-route'],
  month: 1,
  iceClass: true,
})
scenario(
  'NSR is chosen in August with an ice-classed hull',
  arcticSummer?.chokepoints.includes('northern-sea-route') === true,
  `${Math.round(arcticSummer?.distanceNm ?? 0)} nm via ${arcticSummer?.chokepoints.join(', ')}`,
)
scenario(
  'NSR is unavailable in January',
  arcticWinter?.chokepoints.includes('northern-sea-route') === false,
  `${Math.round(arcticWinter?.distanceNm ?? 0)} nm via ${arcticWinter?.chokepoints.join(', ')}`,
)

// Each one-click scenario must go through its passage while that passage is
// open; otherwise its button would close something the lane never uses.
for (const preset of SCENARIOS) {
  const open = route(preset.origin, preset.destination, preset.vessel, {})
  scenario(
    `Scenario "${preset.close}" uses that passage when it is open`,
    open?.chokepoints.includes(preset.close) === true,
    `${preset.origin} -> ${preset.destination} via ${open?.chokepoints.join(', ') ?? 'no route'}`,
  )
}

const total = CASES.length + RULES.length + nsrChecks.length + scenarios
console.log(`\n${total - failures}/${total} checks passed.`)
if (failures > 0) process.exit(1)
