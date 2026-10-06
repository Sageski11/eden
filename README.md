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
| `transport.js` | paved streets, highways and cars (railways are drawn and run by `rail.js`) |
| `rail.js` | the railway network: stations at the edge of the towns, freight depots at the far works, routed and graded track with bridges, tunnels and crossings, trains that keep a timetable |
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

## Railways

The folk ask for a railway only when there is a real need (Industrial age and later): stone from hills far beyond the town, timber from a far forest, a far harbour or farm belt, or another people across the valley. The petition says why ("the stone must come from the hills 130 paces north..."); Allow raises a **station at the edge of the town** (outside the houses, on gentle ground, joined to the street plan by a short lane) and lays the line from it: a heading-aware route search that treats the town, plots, streets and farmland as dear, skirts the built-up area, climbs gently, cuts and fills the land (with side slopes), bridges narrow water, tunnels through spurs, crosses streets on level crossings and keeps passing loops on long lines. Nothing is demolished for it. Freight trains haul the depot's stone, timber or grain to the town store (the far depot fills hour by hour; a real quarry beside a depot hands its stone over for the train); passenger trains run between the stations of joined towns, trade caravans ride them, and stations raise the happiness "Travel" factor and bring newcomers. Steam in the Industrial age, diesel and electric (with overhead wires) in the Modern, maglev on a guideway in the Futuristic; the track is restyled when the age turns. All the data lives in `G.net.lines` (kind `rail`: polyline, heights, bridges, tunnels, facility ends); the graph and the trains are derived from it, so saves, sandbox undo and old saves (a bare line becomes track between two halts) all keep working. `node tools/railtest.js` checks the whole story (petition, station at the edge, routing, trains, freight, a second people, caravan by train, save/load).

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
node tools/railtest.js out/   # the railway story: petition, station at the edge, routing, trains, freight, two peoples, save/load, screenshots
node tools/nbtest.js 60        # two peoples (JUDGE=1, SAVELOAD=1, TRADE=1 add checks)
node tools/overlaytest.js make|shots|why|eco|perf   # overlays, Why? diagnostics, stalls and carts, frame cost (see the file header)
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

### Polish: sound, onboarding, settings, saves, performance (js/audio.js, js/polish.js, js/saves.js, js/menu.js)
- **Sound** is entirely procedural (WebAudio, no files). Beds (water, wind, rain, forest, crowd/market babble, mill, factory and turbine hum, traffic, crickets) follow what is under the camera and are sampled twice a second in `audSample()` (nearby buildings, trees, water, folk; never per-villager per-frame). One-shots are drawn at random with rates from the same sample: songbirds at dawn, owls and frogs at night, gulls at docks, hammering at building sites, saws, forge clangs, chopping, quarry picks, train whistles near stations, Sunday bells, wedding peals and funeral tolls (through `STORY.on`). `sfx(name, volume)` takes an optional volume; extra names: toll peal prayer petition tick click era cheer saw clang pick train horn steam owl gull frog dog rooster moo splash.
- **The score** is generative per age (`MP` in audio.js): pentatonic flute and frame drum in the Stone Age, plucked lute with a hurdy-gurdy drone in the Middle Ages, a machine pulse in the Industrial age, electric piano pads in the Modern age, delayed synth arpeggios in the Futuristic age. It turns tense (flat second or minor, slower, heartbeat) under raids, plague, a strong cult, misery or storm, quickens for a nearby festival, and plays a stinger when an age begins. `node tools/audiotest.js` renders each age offline and checks level, peak and NaNs.
- **Tutorial and tips**: a skippable step-by-step first game (`STEPS` in polish.js; progress in localStorage `hearthmere_tut`; replay from the pause menu, Help or Settings) with highlighted UI, followed by one-time contextual tips (petition, doubt, raid, sickness, hunger, new age, festival, second people, sandbox). Help (H) is a tabbed rewrite for the god game and the sandbox.
- **Settings** (pause menu) add graphics detail (shadows, trees, particles, image sharpness, folk detail range, applied on top of the three presets), camera sensitivity and inversion, autosave interval, key hints, sound captions, reduce motion, colour-blind cues, a frame-rate meter. All are in `SETS` (localStorage `hearthmere_settings`).
- **Saves**: three rolling autosaves per realm (`auto:<realm>:0..2`), named slots with thumbnails and settlement names, export/import, and a quota guard that drops the oldest autosaves and says so when the browser is full.
- **Performance guard**: frame time is averaged over 60 frames while playing; three bad windows in a row ease detail by one step (fewer particles and trees, then softer shadows and image, then no shadows) and say so in a toast. Choosing a preset hands control back. `?forceguard` enables it under WebDriver.
- Also: tooltips for every tool and top-bar button, notification cards with a sound for prayers and petitions, pause badge, `Shift+1/2/3` speeds, a minimap (M) that shows water, roads, rails and settlements and flies the camera on click, smoothed WASD panning, two-finger touch camera and trackpad pinch.
- Checks: `node tools/polishtest.js [outdir]` (settings, tutorial, saves, audio, screenshots), `node tools/audiotest.js`, `SEED=1 node tools/balance.js 200` (a no-cheat balance probe: pacing, faith income, prayer answers, starvation, raids, plagues).

### Daily life, clothes and animation (js/routines.js)
- **The shape of the day** (`routineThink` hook in `think()`): dawn chores (water at the well, a stretch, breakfast), a short meal break in the shade for outdoor workers, evenings spent at the tavern/inn/pub/cafe, the market stalls, strolling the street, on the doorstep, tending a garden, praying, at the shore, at the show (playhouse, cinema, stadium, library...), round the bonfire in winter and in the early ages; Sunday has the church bell (the folk gather on the church square before service) and family picnics; autumn evenings glean the fields. Productive jobs are left alone in working hours (the hook returns `false`), so the economy is unchanged. Children go to school on weekdays when a school stands, then play (chase, ball, hoops, skipping stones, snowballs, hide and seek); toddlers are carried by a parent; elders sit on benches, nap, tell stories. Era and traits (`v.traits`) change the weights.
- **Meeting and talking**: folk who share a gathering place stop, face each other and talk (gestures, a hug for family and friends, now and then an argument) with short era- and relationship-aware exchanges shown as speech bubbles over the folk nearest the camera. Chats feed `lifeRel` in lives.js (a little friendship for a friendly word, a little rivalry for a quarrel). Only near (LOD 0) folk talk; partners come from a small hash rebuilt at most five times a second.
- **The world answers**: rain sends the idle under the eaves or indoors (hoods before the Industrial age, umbrellas after), cold folk fold their arms and wear cloaks, scarves and coats, heat sends the old and the young into the shade, a rainbow draws a crowd to the shore, a fire brings a bucket chain, a miracle (`storyEvent('miracle')`) makes everyone look up, trains draw waving onlookers, mourners (`v.mourning`, or grieving) wear dark clothes.
- **Look**: `rtDrawPeople` replaces the body of `drawPeople` with the same instanced rig plus clothing by era and job (hides, linen, wool, doublets, industrial coats and top hats, modern jeans and hi-vis, futuristic suits with glowing belts and visors), tools by job and season (hoe, sickle, rifle, baton...), things carried (jugs, buckets, baskets, bags, briefcases, books, tablets, lanterns and torches at night), benches and bonfires around the gathering places, a distance level of detail, and many poses (sit, eat, drink, talk, hug, wave, pray, throw, tend, stretch, bucket chain, shiver, shelter, gaze).
- Check: `node tools/routinetest.js` (screenshots of dawn, noon, evening, night, rain, snow, a festival, a funeral, a rainbow and a miracle under `/tmp/routines`, and a tally of how the folk spend their free time; `STATE=file.json` reuses a grown town).

### Culture, stories and cameras (js/culture.js)
- **Tales** (top bar button, **N**): the story feed of the viewed people, grouped by day, with icons per kind and filters (births, deaths, weddings, heroes, miracles, customs, life). Click an entry to follow the person. A badge counts unseen events; big ones (heroes, great miracles, a founder's wedding, an elder's death) raise a quiet note.
- **Person page**: following a villager opens a card (left of the map) with age, job, mood, traits, family tree (click a name to jump), friends and rivals, memories and their own story timeline. It reads `lifeSummary(v)` from lives.js when present and falls back to the basic fields (spouse, parents, children, siblings found from `parents`/`spouse`).
- **Legends**: miracles seen in the Chronicle (rain in drought, healing, a quenched fire, sunshine, meteor, blessed fields, rainbow, storm, a raised hill, a new spring, a lightning strike) are first a `miracle` story, then a `legend` a few days later that is retold every ~2 years with drift (stages 0..3, era-flavoured endings); settlements where piety is low or doubt high tell them with a shrug. Elders quote them and festivals recall them. Stored in `G.cu.legends`. Each era ends with a written age summary (`G.cu.ages`). The Chronicle (C) has four tabs: Days (in the folk's voice), Legends, The Ages, Names and customs.
- **Place names** (`G.cu.places`): the hearth, quarry hill, wood, fields, mill race, landing, chapel green, market cross, the well, plus (from a coarse land scan) a river or lake, a hill and a ford; heroes and the Spirit's own works add memorials and stands. Names follow each people's name style. They show as floating labels in photo mode (K), on a hover tooltip and as "lives near ..." on the person page. `cuPlaceNear(x,z)` is exported for other systems.
- **Customs** (`G.cu.customs`): Blessing of the Boats (fishers), First-Hunt Rite (hunters), Planting Day (farmers), Guild Day (quarrymen and masons), Market Fair (traders), Midwinter Lights, Founders' Day, Remembrance, a Topping-Out when a new church is roofed, and Harvest-Home. Each is born the first time its conditions hold (a `custom`/`tradition` story), recurs yearly through `startFestival()`, has an era-aware name, banner colours and flavour, and adds a little joy and piety. Each people also has an identity (banner colours, a standard pole by the hearth, bunting in their colours).
- **Heroes and villains** (`G.cu.heroes`): raid defenders (guards are tallied by hits), the fallen, whoever led the bucket line at a fire, and the founders are honoured with a procedural monument by the plaza (cairn, standing stone, stele, cross, obelisk, statue, sculpture, light-pillar by age); false prophets get an even-handed `villain` story.
- **Cameras**: the follow camera is a smoothed chase; **V** toggles a street-level "walk with them" camera (it lifts above the roof while they are indoors); in photo mode **O** slowly orbits and place labels appear.
- Hooks it wraps or adds: `cultureDaily`, `cultureHourly`, `cuCamFollow` (called from the main loop), `cuBuntingCols` (read by `buildBunting`), `cuChronRender` (called by `toggleChron`); it wraps `chron`, `startFestival`, `festive`, `godInspector` and `togglePhoto`. Check: `node tools/culturetest.js [days] [outdir]` (`NOSHOTS=1` to only simulate and save `state.json`, `LOAD=state.json` to take screenshots from a saved game).

### Reading the city: overlays, diagnostics, the visible economy, edicts (js/overlays.js)
- **Sight** is a toolbox group (and a hotkey set): `O` cycles the overlays (`Shift+O` goes back), `Z` opens **Why?**, `L` the edicts, `U` shows or hides the district names. Overlays are a translucent tint laid on the terrain by a shader on a copy of the terrain mesh (a 160x160 data texture, one texel per path-grid cell): **Services** (water, food, safety, worship, learning, health, leisure: pick one or see all; red marks homes with nothing in reach), **Mood** by quarter (each home rated from its folk, the services near it, smoke and crowding), **Smog** (drifts downwind of chimneys, forests thin it), **Footfall** (a counter fed from the villagers' walking steps, decayed daily), **Land value** (district, services, waterfront, neighbours, smoke), **Districts** and **Plan** (streets, plots and plaza of the town plan drawn in the world). A legend and a hover readout say what covers the spot and what is missing; with Services on, a building shows its reach as a ring. Each overlay is recomputed as a sliced generator at most every ~3 s while it is visible (about 2 ms a frame at most) and the old picture stays until the new one is ready.
- **Why?** (`ovWhy()`, panel on `Z`) ranks what holds the town back in plain words with something to try and a Show-me button: famine and the food trend, no free homes (and why), the population cap of the age, no quarry / far quarry / no quarrymen, no timber, stalled sites (materials, builders, distance, unreachable), folk who cannot find a way, unfilled jobs, unanswered prayers, the biggest happiness costs, fires, floods, raiders, smog and planners that could not find room. The inspector gets per-building lines (builders and materials of a site, who lives or works here and what is missing, the reach of a service). The button carries a badge with the number of serious blockers.
- **District names** float over each district at medium zoom ("Old Town", "Market Quarter", "Hearthside", "Mill Row"/"The Works", "Dockside", "The Fields"; the wording follows the age). Names given by the folk (`G.cu.places`: market, landing, fields, mill, hearth) take priority, and a `cuDistrictName(kind,{x,z,era,name,town})` function, if defined, can override any.
- **Visible economy** (cosmetic, only near the camera, `ovEco.on=false` turns it off): builders walk their real fetch-and-haul trips behind a travois / hand-cart / trolley / hover sled; wagons (ox-cart, horse wagon, steam lorry, truck, hover pod) shuttle between lumber camps, quarries, farms, docks, workshops and the store or market along real paths while the source has workers; caravans of carts trail the merchants of trade missions; markets (or stalls on the town square before there is one) get era-styled stalls with merchants and goods that follow `G.goods`, piles of crates grow and shrink with the stores, drones hover in the Futuristic age, and porters carry the catch ashore when a boat comes in. Other systems can put a wagon on the road with `ovHaul(from, to, kind)` (building or `{x,z}`; kinds wood, stone, food, fish, goods).
- **Edicts** (`L`): five counsels that cost Faith and last a few days, using levers the game already has: ration the stores, call for volunteers, set a night watch, open the granaries, favour farmers and fishers (state in `G.edicts`, saved per settlement).
- It wraps rather than edits: `goTo`, `wear`, `godToolDefs`, `buildToolbox`, `setTool`, `godInspector`, `hourTick`, `flam`, `eraHapF`. Check: `node tools/overlaytest.js make|shots|why|eco|perf` (see the header of the file; run under the shared lock), `EVAL="ovSetOverlay('svc')" node tools/profile.js big.json frame` to profile with an overlay on.
