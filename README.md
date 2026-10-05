# Hearthmere — a god game of ages

You are the spirit of the valley. Your people think and build for themselves; you shape the land, answer their
prayers and keep their faith. Watch a civilisation grow from a stone-age camp to a futuristic city — and, when it
strays into atrocity and false gods, destroy it and begin again.

Open `Eden.html` in a browser (no build step; scripts are plain files loaded in order).

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
| `transport.js` | paved streets, railways, highways, trains and cars |
| `god_ui.js`, `saves.js`, `menu.js` | powers and UI, main loop, saves, quality presets, menus |

## The loop

1. **Shape the valley**, then call the settlers. They plan streets and build for themselves.
2. **Ages**: Stone → Bronze → Iron → Medieval → High Medieval → Industrial → Modern → Futuristic. Each age is gated by
   population, key buildings and crafts, and changes what the folk can build and how it looks.
3. **Faith & doubt**: faith pays for miracles. Hunger, fear, sickness, unanswered prayers, and pride/greed breed doubt.
   Doubt raises a **false prophet** whose cult commits worsening atrocities (see `DOCTRINES` in `devotion.js`).
4. **You may answer** with a sign, a seer or by silencing the prophet — or by easing the real cause.
5. **Petitions**: the folk ask leave for big works. You decide.
6. **Judgment**: cleanse a civilisation that is beyond saving. The ledger remembers; the next age begins.

## Testing

Headless checks use Playwright (Chromium); the software renderer is slow, so the tools drive the simulation directly
with `gameStep()` instead of waiting on frames:

```
node tools/smoke.js            # loads the game, reports console/page errors
node tools/devtest.js          # famine -> prophet -> intervention -> judgment -> reckoning
node tools/devtest2.js         # atrocities, save/load, judgment, next-age flow
node tools/tftest.js           # terraforming and petitions
node tools/eratest.js          # fast-forward through the ages
node tools/nettest.js out.png  # lay a railway and highway, screenshot
node tools/showcase.js out.png "house:4,house:5,factory" 0.5 70 0.4 7   # stage buildings and screenshot
```
