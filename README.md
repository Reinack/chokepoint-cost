# Chokepoint

Estimates how much seaborne transport costs rise when a strait or canal closes,
and draws the usual route alongside the detour the closure forces on an
interactive map.

Available in **English, Spanish, Brazilian Portuguese, French, German, Italian,
Russian, Chinese and Arabic**.

## What it answers

Pick an origin, a destination and a vessel class, close one or more maritime
passages, and the app works out:

- extra miles and extra days;
- total extra cost broken down by component, and its share as US$/TEU and US$/tonne;
- canal dues saved or newly paid;
- war-risk premium avoided by no longer transiting a region;
- additional CO₂ and EU ETS allowances;
- extra ships needed to hold a weekly sailing on the lengthened round trip.

Five one-click scenarios load a lane, a vessel and the passage that closes:
Suez (Shanghai–Rotterdam), Bab el-Mandeb (Shanghai–Piraeus, the
Mediterranean round the Cape and back in through Gibraltar), Hormuz and Malacca
(a VLCC from Ras Tanura to Ningbo) and Panama (Shanghai–New York). Ports can be
searched by name, country code, country name in the interface language or region,
ignoring accents.

Passages modelled: Suez, Panama, Bab el-Mandeb, Hormuz, Gibraltar, Malacca, the
Turkish Straits (Bosphorus and Dardanelles), the Danish Straits, the Kiel Canal,
Dover, Sunda, Lombok, Makassar, Luzon, Taiwan, Korea, Torres, the Mozambique
Channel, the Straits of Florida, the Yucatán Channel, the Cape of Good Hope,
Cape Horn, the Bering Strait and the Northern Sea Route.

## How it works

**Routing.** Dijkstra over a network of ~390 maritime waypoints and ~360 links.
Closing a strait removes its node from the graph: the alternative is found by
the network, not written in advance. That is why closing Bab el-Mandeb empties
Suez on its own, and why closing Hormuz leaves the Persian Gulf with no way out.

**The router minimises cost, not distance.** This is the difference between
being right and being plausible. With Suez shut, Panama is about 200 nm shorter
than the Cape for a 14,000 TEU container ship from Shanghai to Rotterdam, so a
distance-based router picks it — and quietly bills the user a ~US$600k toll.
Weighted by cost, the answer is the Cape of Good Hope, which is what carriers
actually did in 2024.

**Physical limits.** A vessel is barred from a passage when it exceeds the
maximum draft, beam or length. Hence a ULCV never uses Panama, a laden VLCC does
not transit Suez, and a capesize cannot use the Danish Straits.

**Seasonality.** The Northern Sea Route is offered only from July to November
and requires an ice-classed hull; it carries an icebreaker escort surcharge.

## Verification

```bash
npm run verify
```

Three checks in sequence:

1. **Types** (`tsc -b`).
2. **Network geometry** — every link is sampled every 10 nm and tested against
   Natural Earth 50m coastlines. No route may cross land. Artificial canals and
   straits narrower than the dataset can resolve are declared as explicit
   exceptions in `EXEMPT_LINKS`.
3. **Realism** — 31 assertions: routed distances against published sea distances
   (10% tolerance), vessel/passage compatibility, qualitative scenarios
   (closing Hormuz strands the Gulf; the NSR is chosen in August but not in
   January), and that each one-click scenario's lane goes through its passage
   while it is open.

Step 2 also checks **every** corner the graph can produce (about 520), not a
sample of routes, so no future routeing can generate an arc over land.

```bash
npm run validate:network   # geometry only
npm run validate:routes    # distances, limits and scenarios only
```

### Corner smoothing

A route is a chain of waypoints, so it kinks at every one of them. When drawn,
each corner is replaced by an arc — but the arc bends towards the *inside* of
the turn, which off a headland or between islands is exactly where the land is.

How far each vertex may bend is not a constant: mid-ocean there are hundreds of
spare miles, off a coast there are none. So each vertex's radius is
**precomputed** against the coastline:

```bash
npm run generate:radii   # rewrites src/data/corner-radii.ts
```

Re-run it after moving any waypoint. A vertex missing from that file is simply
never rounded, so forgetting costs smoothness but never puts a route ashore.

The corner test measures *proximity to shore*, not *point-in-land*: an island a
couple of miles across is smaller than the gap between samples, so catching it
would be luck — Bermuda tested positive at 18 samples and negative at 48.
Rasterising the coastline into a grid and asking "is there shore nearby?" gives
the same answer regardless of sampling.

## Languages

English is the default. A visitor's choice is remembered in `localStorage`;
the browser's own locale is deliberately not sniffed, because a browser locale
is a poor proxy for which language someone wants to read shipping economics in,
and the trade's vocabulary — Neopanamax, TCE, VLSFO — is English anyway.

`src/i18n/en.ts` is the source of truth for the dictionary shape: every other
locale is typed as `Dictionary`, so a missing or misspelt key fails the build
rather than falling back silently at runtime.

**Dictionaries load on demand.** English is bundled statically — it is the
default and the type source, so it has to be present on the first paint anyway
— while the other eight are dynamic imports that Vite emits as separate chunks
of 2.6–3.4 kB gzipped. An English reader downloads none of them.

Two things deliberately do *not* wait for a dictionary, because they are
metadata rather than prose and live in `src/i18n/languages.ts`: the list of
languages, which the switcher must render before anything is fetched, and the
text direction, which has to be right on the first paint. Otherwise Arabic would
render left-to-right and mirror a moment later.

Language and dictionary are committed together, never separately, so there is no
frame showing one language's strings under another's direction. While a chunk is
in flight the previous language stays on screen and the switcher reports
`aria-busy`; if several languages are picked in quick succession, only the last
one commits.

Arabic sets `dir="rtl"` and the shell mirrors. Two subtrees stay left-to-right
on purpose: the **map**, whose axes are geographic rather than textual, and the
**signed bar chart**, whose "saving on the left, cost on the right" reading is
fixed by the legend beside it. Arabic also uses Latin digits, since the figures
sit next to USD amounts and an LTR map, and mixing numeral systems in a costing
tool reads worse than it localises.

## Screen sizes

| Width | Layout |
|---|---|
| < 640 px | One column. Compact header, stat tiles in 2 columns. |
| 640–900 px | One column, normal typography. |
| 900–1600 px | Sidebar + map, results full width under the map. |
| ≥ 1600 px | Results in two columns: breakdown beside the table. |
| ≥ 2100 px | Larger type and figures; columns stop growing and centre. |

On small screens the **Vessel**, **Maritime chokepoints** and **Economic
assumptions** sections fold away: together they are taller than a phone screen
and pushed the map — the thing the user came for — below a long scroll. Each
folded summary shows its current value (vessel capacity, how many passages are
closed), so nothing is hidden by folding. At every other width those sections
render open, with no fold control.

Folding is the only thing JavaScript decides; the whole layout comes from CSS,
so a stale media query in JS would cost a fold but never the page structure.

## Development

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

Static output in `dist/`, no backend.

## Deploying to Render

The repo includes [`render.yaml`](render.yaml), a Blueprint declaring the
service as a **static site**: build `npm ci && npm run build`, publish `./dist`,
SPA fallback to `index.html` and immutable caching for `/assets/*`.

In Render: **New → Blueprint**, pick this repository, apply. No commands or
variables to type; the Blueprint already sets `NODE_VERSION` and
`NPM_CONFIG_PRODUCTION=false` (Render exports `NODE_ENV=production`, without
which npm would skip Vite and TypeScript, both `devDependencies`).

## Structure

```
src/
├── data/          Maritime network, ports, chokepoints and vessel classes
├── engine/        Geodesy, graph and routing, cost model
├── i18n/          Dictionaries for nine languages and the language context
├── hooks/         Media query hook
└── components/    Map, control panel and results
scripts/           Network validator, radius generator and realism checks
```

Data is kept apart from the engine on purpose: adjusting a toll, a risk premium
or a vessel dimension is a one-line edit in `src/data/`, and `npm run verify`
will say whether the change broke anything.

## About the figures

The defaults (VLSFO price, daily hire, tolls, risk premiums, CO₂ price) are
**typical industry orders of magnitude, not quotations**, and all are editable
from the interface. The model earns its keep on the comparison between two
routes, not on the absolute level of either.

The waypoint network is schematic: it reproduces published distances with an
error of +2% to +6%, systematically over rather than under, because a chain of
segments approximates a curve from the outside. The bias is not the same on both
compared routes, so it does not vanish in the difference: closing Suez on
Shanghai–Rotterdam adds 3,648 nm here, against 3,318 nm between the published
distances (10,525 nm via Suez and 13,843 nm via the Cape, SEA-DISTANCES.ORG) —
about 10% more. Read the extra distance, and the cost that follows from it, as
an estimate on the high side.

Draft limits apply to passages, not to ports: any vessel class can be sent to
any port. Some could not get there fully laden — Buenos Aires is reached through
channels about 10 m deep, against 15 m for the default Neopanamax and 22.5 m for
a laden VLCC. In practice such ships call part-loaded, or not at all.

## Credits

Base map © [OpenStreetMap](https://www.openstreetmap.org/copyright)
contributors. Coastlines from
[Natural Earth](https://www.naturalearthdata.com/) via `world-atlas`.

## License

[MIT](LICENSE) for the code.
