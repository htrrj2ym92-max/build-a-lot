# Lot by Lot

A browser neighbourhood-building game in the style of the classic *Build-a-lot* time-management games. Buy lots, build houses, earn rent, and turn eight streets into the best addresses in the county.

All art is drawn procedurally as SVG. There are no image assets, no dependencies and no build step.

## Play

Open `index.html` in a browser, or serve the folder:

```sh
npm start   # python3 -m http.server 8000, then visit http://localhost:8000
```

## How it plays

- **Money, materials, crew.** Empty lots cost $25,000. Order one of six fixed material bundles; delivery takes 15 seconds. A Sawmill halves bundle prices and delivery time. Hiring costs $50,000, $90,000 and $120,000, and a Workshop halves those costs.
- **Rent and upkeep.** Houses pay rent once a day. They stop earning when damaged; inspect them with a Workshop to prevent damage, or repair them using fewer materials than construction.
- **Houses.** Build Rambler, Colonial, Tudor, Estate, Mansion and Castle homes. Their material and crew requirements, rents and values increase by size.
- **Upgrades.** Add up to three stars to increase value and rent, or paint and landscape independently to add value. Efficiency Training at a Workshop costs $75,000 and doubles work speed.
- **Selling and demolition.** Sell houses on every street. Damaged houses are offered at half price, and demolishing a house returns three-fifths of its construction materials.
- **Neighbourhood buildings.** A Pocket Park adds +20% rent to neighbouring houses. A Sawmill discounts and speeds material deliveries; a Workshop supports inspections, cheaper hiring and training.
- **Eight streets.** Each street has its own goals. Finish them and the next street unlocks. Finish by the street's Expert day to earn a gold key. Your progress is saved in the browser.

Sound effects are synthesized in the browser with the Web Audio API, so there are no audio files. Toggle them with the Sound button or `M`; the choice is remembered.

Keys: `Space` pause, `1`–`3` game speed, `Esc` deselect, `M` mute sound.

## Code

| File | Role |
| --- | --- |
| `js/data.js` | Buildings, upgrades, material orders, balance constants and level definitions |
| `js/engine.js` | Game rules as pure state transitions (no DOM), so they run in Node |
| `js/art.js` | Procedural SVG for lots, houses and neighbourhood buildings |
| `js/sound.js` | Synthesized sound effects (Web Audio API) and the mute setting |
| `js/ui.js` | Menus, HUD, board rendering and input |
| `tests/` | Engine tests, plus a greedy bot that must win every street |

```sh
npm test
```

The bot tests guard the level balance: every street must be winnable within 1.5× the Expert day target.

## Deploy

`.github/workflows/pages.yml` runs the tests on every pull request and push. On `main` it also publishes the game to GitHub Pages. For this, set **Settings → Pages → Source** to **GitHub Actions**.

Each deploy replaces the `__BUILD__` placeholder in `index.html`, its asset URLs and `js/ui.js` with the commit ID. A new page therefore asks for matching files instead of reusing cached old ones. If a cached page from an earlier deploy still meets newer scripts, `ui.js` notices the different build ID and reloads once to fetch a matching set. When you add a stylesheet or script, give its URL `?v=__BUILD__`; a test checks for this.
