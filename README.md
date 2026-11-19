# Cutline

A food diary and diet tracker in a single HTML page: a landing page with the tracker built in. Type a food and an amount, check the calories and macros, then press Enter to log it.

**Live:** https://skull-bones.github.io/Cutline/

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

## Security

- **No server, no accounts, no secrets.** Cutline is static files. There is no backend to break into and nothing secret in the repo.
- **Everything loaded is checked.** Data from the browser, the Claude account or an imported backup is rebuilt field by field into plain text and numbers before use. Anything else is dropped, and every name is escaped before display.
- **Locked-down web page.** The GitHub Pages site carries a Content-Security-Policy. Only the app's own script can run (matched by its hash). The page can contact only Open Food Facts, and loads styles and fonts only from itself and Google Fonts. It sends no referrer.
- **Claude copies:** each person's log lives under their own user ID in the artifact's database, which other viewers can't read. Whoever can edit the artifact could publish different code, so open a shared copy only from someone you trust, or use the GitHub version.
- Found a problem? Open an issue.

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
