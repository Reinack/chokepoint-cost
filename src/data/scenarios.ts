import type { ChokepointId } from './chokepoints'

/**
 * One-click scenarios: a trade lane, a vessel that sails it, and the passage
 * whose closure matters to that lane. `npm run validate:routes` checks that each
 * lane goes through its passage while it is open, so a network edit cannot turn
 * a scenario into a button that changes nothing.
 */
export interface Scenario {
  close: ChokepointId
  origin: string
  destination: string
  vessel: string
}

export const SCENARIOS: Scenario[] = [
  { close: 'suez-canal', origin: 'shanghai', destination: 'rotterdam', vessel: 'container-neopanamax' },
  // Asia to the Mediterranean loses the most: round the Cape, then back in through Gibraltar.
  { close: 'bab-el-mandeb', origin: 'shanghai', destination: 'piraeus', vessel: 'container-neopanamax' },
  // There is no second way out of the Gulf, so the answer is that no alternative exists.
  { close: 'hormuz', origin: 'ras-tanura', destination: 'ningbo', vessel: 'tanker-vlcc' },
  { close: 'malacca', origin: 'ras-tanura', destination: 'ningbo', vessel: 'tanker-vlcc' },
  { close: 'panama-canal', origin: 'shanghai', destination: 'new-york', vessel: 'container-neopanamax' },
]
