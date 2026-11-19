# Cutline

A food diary and diet tracker in a single HTML page: a landing page with the tracker built in. Type a food and an amount, check the calories and macros, then press Enter to log it.

**Live:** https://skull-bones.github.io/Cutline/ (once GitHub Pages is on)

## Features

- **Fast logging:** type `chicken breast` and `179`, `6oz`, `1lb`, or a count like `4x`, see the macros, and press Enter. Any entry can be edited later.
- **434 built-in foods:** chicken, beef cuts and ground-beef grades, pork, lamb, bison, venison, fish, eggs, dairy, vegetables, grains, fruit; brand items like Fage, Chobani, Oikos, Quest, Premier Protein and Fairlife; and about 290 items from 16 restaurant chains, logged by count.
- **Custom foods:** add anything from its label. On the web, scan or type a barcode to look it up in Open Food Facts. Inside Claude, photograph the nutrition label and Claude reads it.
- **Goal timeline:** set current weight, goal weight and a 6 to 26 week timeline. Cutline works out the daily deficit, then recalculates it as you go.
- **Daily weigh-in and trend chart.**
- **Target check:** after 14 logged days, Cutline compares your logged intake with your weight trend and offers a corrected maintenance estimate.
- **Backup:** export and import your whole log as a file.

## Where your data is saved

- **Web version (GitHub Pages):** in your browser, on that device. Clearing site data deletes it, so export a backup now and then.
- **Inside Claude:** in your own Claude account (a private per-person store), with the browser as a backup. A save writes only a small summary and the month that changed.

No data is sent anywhere else. Barcode lookups send only the barcode number to Open Food Facts. Fonts load from Google Fonts.

## Nutrition data

Generic foods use USDA values per 100g, weighed cooked unless the name says raw. Brand items use the label for one serving. Restaurant items use each chain's published numbers for one item; where a chain doesn't publish fiber, it counts as 0, so net carbs can read slightly high, never low. Barcode results come from Open Food Facts, which is crowd-sourced. Recipes change, so check your package.

Cutline is not affiliated with any restaurant or brand listed. It is not medical advice.

## Project layout

```
src/
  foods.js       food catalog
  core.js        pure logic: search, amounts, targets, trend, target check (no DOM)
  app.js         interface, events and storage
  app.css        tracker styles
  site.html      landing page shell (GitHub Pages and the shareable Claude copy)
  personal.html  tracker-only shell (a personal Claude copy)
tools/build.mjs  builds the pages from src/
test/            unit tests (core) and browser tests (built pages)
index.html       built site for GitHub Pages; do not edit by hand
dist/            built pages for Claude; do not edit by hand
```

Edit files in `src/`, then:

```
node tools/build.mjs          # writes index.html, dist/claude-site.html, dist/personal.html
node test/core.test.mjs       # unit tests, no dependencies
node test/e2e.mjs             # browser tests, needs Playwright with Chromium
```

## License

MIT. See [LICENSE](LICENSE).
