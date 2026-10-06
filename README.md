# Hearthmere — a god game of ages

You are the spirit of the valley. Your people think and build for themselves; you shape the land, answer their
prayers and keep their faith. Watch a civilisation grow from a stone-age camp to a futuristic city — and, when it
strays into atrocity and false gods, destroy it and begin again.

Open `Eden.html` in a browser (no build step; scripts are plain files loaded in order), or open the single self-contained `dist/Hearthmere.html` (minified build of the same code; rebuild with `npm i && npm run build`).

## Layout

`Eden.html` is the shell (markup + CSS). The game is a set of classic scripts in `js/`, loaded in this order and
sharing one global scope (so order matters):

| file | what it holds |
| --- | --- |
| `lib/three.min.js` | Three.js |
| `core.js` … `water.js` | utilities, world grid, renderer, terrain generation and mesh, water simulation |
| `trees.js`, `fauna_flora.js`, `people.js` | trees, wildlife, grass, instanced villagers |
| `buildkit.js`, `buildings.js` | the procedural geometry builder and the medieval building generators |
| `world_tools.js` | camera, undo, input and sculpting tools, world init |
| `sim_agents.js`, `sim_economy.js`, `town_plan.js` | game state, pathfinding, villager AI, construction, planner, happiness, raids, street planning |
| `audio.js`, `world_features.js` | procedural sound; crafts, environment, weather, banners, shaping phase |
| `devotion.js` | piety, doubt, false prophets, atrocities, judgment, the reckoning screen and Ledger of Ages |
| `terraform.js` | folk terraforming (levelling, quarry pits) and petitions to the player |
| `eras.js`, `era_buildings.js`, `era_civic.js` | the eight ages: requirements, crafts, factories/stations/power, tall houses, civic styles per age |
| `settlements.js`, `neighbours.js`, `trade.js` | the settlement layer (several peoples sharing one world), the second people who arrive in the Bronze Age and the tabs to switch between them, and caravans between them |
| `opening.js` | the opening: arrival in rain, the free first Sunshine, folk fetching their own water |
| `era_tiers.js`, `city_layout.js`, `replan.js` | tiered working buildings (camps, farms, docks... per age), the planned town (layout templates: ring-and-spoke, grid, riverside ribbon, hillside terraces, bay crescent; district zones; plots; folk levelling and terracing for the streets; the plan re-plots when the land changes) and era renewal (obsolete table; houses climb, buildings are rebuilt in the style of the age or pulled down and the land re-planned) |
| `transport.js` | paved streets, railways, highways, trains and cars |
| `god_ui.js`, `saves.js`, `menu.js` | powers and UI, main loop, saves, quality presets, menus |

## The loop

1. **Shape the valley**, then call the settlers. They plan streets and build for themselves.
2. **Ages**: Stone → Bronze → Iron → Medieval → High Medieval → Industrial → Modern → Futuristic. Each age is gated by
   population, key buildings and crafts, and changes what the folk can build and how it looks.
3. **Faith & doubt**: faith pays for miracles. Hunger, fear, sickness, unanswered prayers, and pride/greed breed doubt.
   Doubt raises a **false prophet** whose cult commits worsening atrocities (see `DOCTRINES` in `devotion.js`).
4. **You may answer** with a sign, a seer or by silencing the prophet — or by easing the real cause.
5. **Other peoples**: a second people arrive in the Bronze Age and live differently; merchants trade between them.
6. **Petitions**: the folk ask leave for big works. You decide.
7. **Judgment**: cleanse a civilisation that is beyond saving. The ledger remembers; the next age begins.

## Performance

Profiled on a saved big game (two peoples, about 770 folk): `node tools/mkstate.js big.json` builds one, `node tools/profile.js big.json sim` gives a CPU profile of the simulation and `frame` the per-frame costs. Compare screenshots of a frozen scene with `tools/shot.js` and `tools/imgdiff.js`. Hot paths use indexes (buildings by id/type, trees and people in spatial cells), a typed-array heap for pathfinding, hourly caches, and spread-out neighbour rebuilds.

## Testing

Headless checks use Playwright (Chromium); the software renderer is slow, so the tools drive the simulation directly
with `gameStep()` instead of waiting on frames:

```
node tools/smoke.js            # loads the game, reports console/page errors
node tools/devtest.js          # famine -> prophet -> intervention -> judgment -> reckoning
node tools/devtest2.js         # atrocities, save/load, judgment, next-age flow
node tools/tftest.js           # terraforming and petitions
node tools/layouttest.js       # grows a town through the ages (SEED, WORLD, STAGES, SHOT=dir): checks no obsolete building stands, draws a plan map and a top-down screenshot
node tools/plantest.js dir     # draws the street plans of fresh settlements (WORLDS, SEEDS, TPL to force a template)
node tools/eratest.js          # fast-forward through the ages
node tools/nettest.js out.png  # lay a railway and highway, screenshot
node tools/nbtest.js 60        # two peoples (JUDGE=1, SAVELOAD=1, TRADE=1 add checks)
node tools/opentest.js         # rain opening and the free first Sunshine
node tools/showcase.js out.png "house:4,house:5,factory" 0.5 70 0.4 7   # stage buildings and screenshot
```

## Sandbox

Choose **Sandbox** on the title screen to build a whole city with no rules. Press **TAB** to open the Buildings page: every building of every age, with a small picture of each, grouped by age (Stone Age holds only Stone Age buildings, and so on). Click a plate to choose it, then click the land (R rotates, V varies). Dirt roads, paved streets, railways and highways are on the plates too, and in the Roads group of the toolbox. When the city is ready, press **Populate city** (you need a Town Hall of any age): the folk move in, the age of the city is taken from its newest building, and the god game carries on from there. `node tools/sbtest.js` exercises all of this headlessly.

### More buildings, each with variants
Every age now has at least ten buildings (forty-three new ones were added, e.g. Totem Pole, Granary, Monastery, Cathedral, Bank, Office Tower, Vertical Farm). Each new building has three named variants: pick one on its plate in the Buildings page, or press **C** while placing (or with a building selected) to step through them. They are described once with `defBuilding()` in `js/bdefs.js`; `node tools/bshot.js <ages>` draws a contact sheet of every variant.

### How the simulation stays light
- Villagers are simulated by distance from where you look: up to 30 units every frame, 30–100 once in four frames, beyond 100 once in sixteen, in longer steps (no hours of work are lost, so the economy does not depend on the camera). Hover the Folk count to see what everyone is doing.
- Routes are remembered until the land or buildings change; chimneys out of sight spend no smoke particles.
- Workshops are rows of data (`CHAINS` in `js/chains.js`: inputs, outputs, workers); the town as a whole is run once a day against household demand, not per person. Fires, harvests, fairs and fevers are rows of `EVENTS`, looked at once a day.

### Prayers, blessings and wildlife (play-test fixes)
- Prayers have an age window and change their wording with the age (no more harvest or herds in the Modern age; smog, parks, housing and power instead). They arrive one at a time with pauses, from a pool of ~25, instead of a standing full list. Bless a building they ask for with the Bless tool.
- Blessings now wear off (fields: three days, other buildings: two days) and can be given again; blessing a farm answers the harvest prayer.
- Herds are capped by how much forest there is and thin out when over it; the Herd prayer only comes when the hunters truly have no game within reach, and you cannot release more animals into a full land.
- Builders: small crews per site, materials set aside for a site are given back when a builder is reassigned, sites that cannot be worked are left for another, long routes are always found, and newcomers appear on ground that actually connects to the town.
