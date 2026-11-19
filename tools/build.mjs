// Builds the three Cutline pages from src/. No dependencies: run `node tools/build.mjs`.
//   index.html            GitHub Pages site (landing page + tracker)
//   dist/claude-site.html  the same site, published as the shareable Claude artifact
//   dist/personal.html     the tracker alone, for a personal Claude artifact
// Optional: `node tools/build.mjs --seed path/to/state.json --out file.html` builds the personal page
// with a starting log baked in (used once to move an existing log into account storage).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => readFileSync(join(root, 'src', f), 'utf8');

export const BLANK_STATE = {
  profile: { sex: '', age: 30, heightIn: 68, weightLb: 180, goalWeightLb: 170, activity: 1.55, dietMode: 'lowcarb',
             proteinFloorEnabled: false, proteinFloorG: 150, goalWeeks: 12 },
  customFoods: [], days: {}, weights: {}, flags: {}
};

const SITE_URL = 'https://skull-bones.github.io/Cutline/';
const DESCRIPTION = 'A food diary for cutting weight and building muscle. Type a food and an amount, see calories and macros, then log it. 434 foods, keto and low-carb targets, weight tracking.';
const FAVICON = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#000"/><circle cx="12" cy="12" r="8" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M6.5 16.5L17.5 7.5" stroke="#E5383B" stroke-width="2.2" stroke-linecap="round"/></svg>');

const META = {
  pages: [
    `<meta name="description" content="${DESCRIPTION}">`,
    `<meta name="theme-color" content="#000000">`,
    `<link rel="canonical" href="${SITE_URL}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="Cutline Food Tracker">`,
    `<meta property="og:description" content="${DESCRIPTION}">`,
    `<meta property="og:url" content="${SITE_URL}">`,
    `<meta property="og:image" content="${SITE_URL}icons/icon-512.png">`,
    `<meta name="twitter:card" content="summary">`,
    `<link rel="icon" href="${FAVICON}">`,
    `<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">`,
    `<link rel="manifest" href="manifest.webmanifest">`
  ].join('\n'),
  claude: [
    `<meta name="description" content="${DESCRIPTION}">`,
    `<meta name="theme-color" content="#000000">`,
    `<link rel="icon" href="${FAVICON}">`
  ].join('\n')
};

export function appScript(seed) {
  const js = [src('foods.js'), src('core.js'), src('app.js')].join('\n');
  if (/<\/script/i.test(js)) throw new Error('A literal closing script tag in the app code would end the inline script early.');
  const seedJSON = JSON.stringify(seed).replace(/</g, '\\u003c');
  return `<script id="state-data" type="application/json">${seedJSON}</script>\n<script>\n(function(){\n  var state = JSON.parse(document.getElementById('state-data').textContent);\n${js}\n})();\n</script>`;
}

export function page(shell, meta, seed) {
  let html = src(shell);
  for (const key of ['{{HEAD_META}}', '{{APP_CSS}}', '{{APP_SCRIPT}}']) {
    if (html.split(key).length !== 2) throw new Error(`${shell} must contain ${key} exactly once`);
  }
  return html.replace('{{HEAD_META}}', () => META[meta]).replace('{{APP_CSS}}', () => src('app.css')).replace('{{APP_SCRIPT}}', () => appScript(seed));
}

const args = process.argv.slice(2);
const seedIdx = args.indexOf('--seed');
if (seedIdx > -1) {
  const seed = JSON.parse(readFileSync(args[seedIdx + 1], 'utf8'));
  const out = args[args.indexOf('--out') + 1];
  if (!out || args.indexOf('--out') < 0) throw new Error('--seed needs --out <file>');
  writeFileSync(out, page('personal.html', 'claude', seed));
  console.log('built', out);
} else {
  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(join(root, 'index.html'), page('site.html', 'pages', BLANK_STATE));
  writeFileSync(join(root, 'dist', 'claude-site.html'), page('site.html', 'claude', BLANK_STATE));
  writeFileSync(join(root, 'dist', 'personal.html'), page('personal.html', 'claude', BLANK_STATE));
  console.log('built index.html, dist/claude-site.html, dist/personal.html');
}
