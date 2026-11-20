// Browser tests for the built pages. Needs Playwright with Chromium:
//   NODE_PATH=$(npm root -g) node test/e2e.mjs
// Claude features (account storage, label reading, downloads) are replaced with in-page fakes.
import { createRequire } from 'node:module';
import { readdirSync, existsSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright'); // honours NODE_PATH for a global install

const ROOT = new URL('..', import.meta.url).pathname;
const exe = existsSync('/opt/pw-browsers') ? readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium'))
  .map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`).find(p => existsSync(p)) : undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const PERSONAL_SEEDED = process.env.PERSONAL_SEEDED; // optional: a personal page built with a real log baked in
let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log('ok -', name); }

// Fake Claude runtime: a db kept in localStorage (so it survives reloads), user, sample and downloads.
const fakeClaude = ({ failWrites = false } = {}) => `
  window.__writes = []; window.__failWrites = ${failWrites};
  const load = () => JSON.parse(localStorage.getItem('fakedb') || '{}');
  const save = db => localStorage.setItem('fakedb', JSON.stringify(db));
  const doc = path => ({
    get: () => Promise.resolve({ data: () => load()[path] }),
    set: v => { if (window.__failWrites) return Promise.reject(new Error('offline')); window.__writes.push(path); const db = load(); db[path] = v; save(db); return Promise.resolve(); }
  });
  const sample = (input) => Promise.resolve({ text: '' });
  sample.json = (prompt, opts) => { window.__sampleImages = (opts && opts.images || []).length; return Promise.resolve({ readable: true, name: 'Test Bar', serving_g: 60, calories: 210, protein: 20, carbs: 22, fiber: 9, fat: 8 }); };
  sample.limits = () => Promise.resolve({ images: true });
  window.claude = { use: name => Promise.resolve(
    name === 'db' ? { collection: c => ({ doc: k => doc(c + '/' + k) }) } :
    name === 'user' ? { id: () => Promise.resolve('u1') } :
    name === 'sample' ? sample :
    name === 'downloads' ? { save: o => { window.__download = o; return Promise.resolve(); } } : null) };`;

async function open(file, { init = '', viewport = { width: 1280, height: 1100 }, storage } = {}) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true });
  if (storage) await ctx.addInitScript(s => { if (!sessionStorage.getItem('__seeded')) { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); sessionStorage.setItem('__seeded', '1'); } }, storage);
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + (file.startsWith('/') ? file : join(ROOT, file)));
  await page.waitForTimeout(250);
  return { page, ctx, errors };
}
const tabTo = (page, t) => page.click(`[data-tab="${t}"]`);
const text = (page, sel) => page.$eval(sel, el => el.textContent);
const entries = page => page.$$eval('.entry .name', els => els.map(e => e.textContent));
const day = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''; };
const entry = (i, cals = 2000) => ({ id: 'seed' + i, name: 'Chicken breast, cooked', portion: '200g', cals, protein: 62, carbs: 0, fiber: 0, fat: 7.2 });
function stateWith({ loggedDays = 0, weights = {}, flags = {} } = {}) {
  const days = {};
  for (let i = 1; i <= loggedDays; i++) days[day(-i)] = [entry(i, 2300)];
  return JSON.stringify({ profile: { sex: 'male', age: 28, heightIn: 72, weightLb: 198, goalWeightLb: 190, activity: 1.725, dietMode: 'keto', proteinFloorEnabled: true, proteinFloorG: 200, goalWeeks: 8, goalStart: day(0) }, customFoods: [], days, weights, flags });
}

// ---------- Web version (GitHub Pages): saves in the browser ----------
await test('web: logs food, keeps it after reload, says where it saved', async () => {
  const { page, errors } = await open('index.html');
  await page.fill('#f-food', 'chicken breast'); await page.fill('#f-amt', '179'); await page.press('#f-amt', 'Enter');
  await page.waitForTimeout(100);
  assert.match(await text(page, '#save-state'), /Saved on this device/);
  await page.reload(); await page.waitForTimeout(200);
  await tabTo(page, 'food');
  assert.deepEqual(await entries(page), ['Chicken breast, cooked']);
  assert.deepEqual(errors, []);
});

await test('web: edit an entry by amount, and edit a legacy entry by its numbers', async () => {
  const st = JSON.parse(stateWith()); st.days[day(0)] = [entry('a'), { id: 'legacy', name: 'Eggs', portion: '4 large', cals: 288, protein: 25.2, carbs: 1.6, fiber: 0, fat: 19.2 }];
  const { page, errors } = await open('index.html', { storage: { cutline_v2: JSON.stringify(st) } });
  await tabTo(page, 'food');
  await page.click('[data-action="edit-entry"][data-id="seeda"]');
  await page.fill('#ed-amt', '300'); await page.dispatchEvent('#ed-amt', 'input');
  assert.equal(await page.inputValue('#ed-cal'), '495');
  await page.click('.edit-form button[type="submit"]'); await page.waitForTimeout(100);
  assert.match(await page.$eval('.entry .portion', e => e.textContent), /300g/);
  await page.click('[data-action="edit-entry"][data-id="legacy"]');
  assert.equal(await page.$('#ed-amt'), null);
  await page.fill('#ed-cal', '300'); await page.click('.edit-form button[type="submit"]'); await page.waitForTimeout(100);
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('cutline_v2')));
  assert.equal(saved.days[day(0)].find(e => e.id === 'legacy').cals, 300);
  assert.equal(saved.days[day(0)].find(e => e.id === 'seeda').cals, 495);
  assert.deepEqual(errors, []);
});

await test('web: daily weigh-in updates the profile and draws the trend chart', async () => {
  const { page, errors } = await open('index.html', { storage: { cutline_v2: stateWith({ weights: { [day(-10)]: 200.6 } }) } });
  await page.fill('#w-today', '197.4'); await page.click('.weigh-form button[type="submit"]'); await page.waitForTimeout(100);
  assert.match(await text(page, '#weigh-note'), /197\.4 lb/);
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('cutline_v2')));
  assert.equal(saved.weights[day(0)], 197.4); assert.equal(saved.profile.weightLb, 197.4);
  await page.fill('#w-today', '20'); await page.click('.weigh-form button[type="submit"]');
  assert.match(await text(page, '#weigh-note'), /between 50 and 1,000/);
  await tabTo(page, 'history');
  assert.equal(await page.$$eval('svg.chart circle', c => c.length), 2);
  assert.match(await text(page, '.chart-note'), /-3\.2 lb/);
  assert.deepEqual(errors, []);
});

await test('web: suggestions follow the clock: 3 breakfast foods in the morning, 3 dinner foods at night', async () => {
  // Ids carry the logging time: 'e' + ms in base 36 + 4 characters. Two weeks of meals at fixed times.
  const at = (offset, h, m) => { const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(h, m, 0, 0); return 'e' + d.getTime().toString(36) + 'abcd'; };
  const e = (id, name, portion) => ({ id, name, portion, cals: 100, protein: 10, carbs: 1, fiber: 0, fat: 1 });
  const st = JSON.parse(stateWith()); st.days = {};
  for (let i = 1; i <= 14; i++) st.days[day(-i)] = [
    e(at(-i, 7, 30), 'Egg, whole', '4 × egg (200g)'), e(at(-i, 7, 32), 'Banana', '1 × banana (118g)'), e(at(-i, 7, 35), 'Greek yogurt, nonfat', '170g'),
    e(at(-i, 12, 15), 'Pork tenderloin, cooked', '300g'),
    e(at(-i, 19, 0), 'Chicken breast, cooked', '400g'), e(at(-i, 19, 2), 'White rice, cooked', '150g'), e(at(-i, 19, 5), 'Italian sausage, pork, cooked', '135g'),
  ];
  const clock = h => `(() => { const R = Date; const t = new R(); t.setHours(${h}, 0, 0, 0); const shift = t.getTime() - R.now();
    class D extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + shift); } static now() { return R.now() + shift; } } window.Date = D; })();`;
  const chips = page => page.$$eval('.usual .chip', els => els.map(x => x.dataset.name));
  const morning = await open('index.html', { storage: { cutline_v2: JSON.stringify(st) }, init: clock(8) });
  assert.deepEqual((await chips(morning.page)).sort(), ['Banana', 'Egg, whole', 'Greek yogurt, nonfat']);
  assert.equal(await morning.page.$eval('.usual .chip[data-name="Egg, whole"]', x => x.dataset.amt), '4x');
  assert.equal(await text(morning.page, '#pv'), '', 'no instructions under an empty preview');
  const night = await open('index.html', { storage: { cutline_v2: JSON.stringify(st) }, init: clock(19) });
  assert.deepEqual((await chips(night.page)).sort(), ['Chicken breast, cooked', 'Italian sausage, pork, cooked', 'White rice, cooked']);
  assert.equal((await chips(night.page)).length, 3);
  // The fine print is a small closed Legal tab.
  assert.equal(await night.page.$eval('details.legal', d => d.open), false);
  assert.equal(await text(night.page, 'details.legal summary'), 'Legal');
  assert.deepEqual([...morning.errors, ...night.errors], []);
});

await test('web: the day rolls over at midnight while the page stays open', async () => {
  const init = `(() => { const RealDate = Date; let shift = 0; window.__shift = ms => { shift += ms; };
    class FakeDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + shift); } static now() { return RealDate.now() + shift; } }
    window.Date = FakeDate; })();`;
  const { page, errors } = await open('index.html', { init });
  const before = await page.evaluate(() => { const d = new Date(); return d.getDate(); });
  await page.evaluate(() => window.__shift(24 * 3600 * 1000));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.fill('#f-food', 'eggs'); await page.fill('#f-amt', '2'); await page.press('#f-amt', 'Enter'); await page.waitForTimeout(100);
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('cutline_v2')));
  const d = new Date(); d.setDate(d.getDate() + 1);
  const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  assert.equal(saved.days[tomorrow].length, 1, 'entry should land on the new day');
  assert.notEqual(before, d.getDate());
  assert.deepEqual(errors, []);
});

await test('web: 14 logged days show the milestone once; target check offers an adjustment', async () => {
  const weights = { [day(-21)]: 200, [day(-14)]: 199, [day(-7)]: 198, [day(-1)]: 197.2 };
  const { page, errors } = await open('index.html', { storage: { cutline_v2: stateWith({ loggedDays: 21, weights }) } });
  assert.match(await text(page, '.milestone'), /14 days logged/);
  await page.click('[data-action="ms-review"]'); await page.waitForTimeout(100);
  assert.equal(await page.$eval('.tab.on', e => e.dataset.tab), 'history');
  assert.match(await text(page, '#adapt'), /real maintenance near/);
  await page.click('[data-action="adapt-apply"]'); await page.waitForTimeout(100);
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('cutline_v2')));
  assert.ok(saved.profile.tdeeAdjust !== undefined && saved.flags.milestone14);
  assert.match(await text(page, '#adapt'), /adjusted by/);
  await page.click('[data-action="adapt-undo"]'); await page.waitForTimeout(100);
  assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('cutline_v2'))).profile.tdeeAdjust, undefined);
  await tabTo(page, 'log');
  assert.equal(await page.$('.milestone'), null);
  assert.deepEqual(errors, []);
});

await test('web: under 14 days shows progress; missing weigh-ins are spelled out', async () => {
  const { page } = await open('index.html', { storage: { cutline_v2: stateWith({ loggedDays: 5 }) } });
  await tabTo(page, 'history');
  assert.match(await text(page, '#adapt'), /5 of 14/);
  const p2 = (await open('index.html', { storage: { cutline_v2: stateWith({ loggedDays: 15 }) } })).page;
  await tabTo(p2, 'history');
  assert.match(await text(p2, '#adapt'), /3 weigh-ins/);
});

await test('web: tabs follow the ARIA pattern with arrow keys', async () => {
  const { page } = await open('index.html');
  await page.focus('#tab-log'); await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-totals');
  assert.equal(await page.$eval('#panel', e => e.getAttribute('aria-labelledby')), 'tab-totals');
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-profile');
  assert.equal(await page.$eval('#tab-log', e => e.tabIndex), -1);
});

await test('web: barcode lookup fills the custom food form from Open Food Facts', async () => {
  const init = `window.fetch = (url) => { window.__url = url; return Promise.resolve({ json: () => Promise.resolve({ status: 1, product: { product_name: 'Protein Bar', brands: 'Acme, Acme Foods', serving_quantity: '60', nutriments: { 'energy-kcal_100g': 350, proteins_100g: 33.3, carbohydrates_100g: 36.7, fiber_100g: 15, fat_100g: 13.3 } } }) }); };`;
  const { page, errors } = await open('index.html', { init });
  await page.click('#cf-wrap summary');
  await page.click('[data-action="scan-manual"]');
  await page.fill('#scan-num', '0894700010045'); await page.click('[data-action="scan-lookup"]'); await page.waitForTimeout(100);
  assert.equal(await page.inputValue('#cf-name'), 'Acme Protein Bar');
  assert.equal(await page.inputValue('#cf-serv'), '60');
  assert.equal(await page.inputValue('#cf-cal'), '210');
  assert.equal(await page.inputValue('#cf-protein'), '20');
  assert.match(await page.evaluate(() => window.__url), /world\.openfoodfacts\.org\/api\/v2\/product\/0894700010045\.json/);
  await page.fill('#scan-num', '123'); await page.click('[data-action="scan-lookup"]');
  assert.match(await text(page, '#scan-msg'), /8 to 14 digits/);
  assert.deepEqual(errors, []);
});

await test('web: export downloads a backup and import restores it after confirming', async () => {
  const { page, errors } = await open('index.html', { storage: { cutline_v2: stateWith({ loggedDays: 3 }) } });
  await tabTo(page, 'profile');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-action="export"]')]);
  assert.match(dl.suggestedFilename(), /^cutline-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const dir = mkdtempSync(join(tmpdir(), 'cutline-')), file = join(dir, 'b.json');
  const backup = JSON.parse(stateWith({ loggedDays: 7 }));
  writeFileSync(file, JSON.stringify({ app: 'cutline', version: 2, exported: new Date().toISOString(), state: backup }));
  await page.setInputFiles('#import-file', file); await page.waitForTimeout(150);
  assert.match(await text(page, '.import-confirm'), /3 days.*7 days/s);
  await page.click('[data-action="import-confirm"]'); await page.waitForTimeout(100);
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('cutline_v2')));
  assert.equal(Object.keys(saved.days).filter(d => saved.days[d].length).length, 7);
  writeFileSync(file, '{"nope":1}'); await page.setInputFiles('#import-file', file); await page.waitForTimeout(150);
  assert.match(await text(page, '#backup-msg'), /isn't a Cutline backup/);
  assert.deepEqual(errors, []);
});

await test('web: a booby-trapped backup imports as plain text and runs nothing; the security policy only allows the app script', async () => {
  const { page, errors } = await open('index.html');
  const csp = [];
  page.on('console', m => { if (/Content Security Policy/i.test(m.text())) csp.push(m.text()); });
  const bad = '<img src=x onerror="window.__pwned=1">';
  const backup = JSON.parse(stateWith({ loggedDays: 2 }));
  backup.profile.heightIn = '"><img src=x onerror="window.__pwned=1">';
  backup.customFoods = [{ n: 'Trap ' + bad, a: [], cal: 100, p: 10, c: 0, fi: 0, f: 1, pc: { name: bad, g: 50 } }];
  backup.days[day(-1)][0].name = bad; backup.days[day(-1)][0].portion = bad;
  const dir = mkdtempSync(join(tmpdir(), 'cutline-')), file = join(dir, 'b.json');
  writeFileSync(file, JSON.stringify({ app: 'cutline', version: 2, exported: bad, state: backup }));
  await tabTo(page, 'profile');
  await page.setInputFiles('#import-file', file); await page.waitForTimeout(150);
  assert.match(await text(page, '.import-confirm'), /an unknown date/);
  await page.click('[data-action="import-confirm"]'); await page.waitForTimeout(100);
  await tabTo(page, 'log'); await page.fill('#f-food', 'trap'); await page.dispatchEvent('#f-food', 'input'); await page.waitForTimeout(50);
  assert.match(await text(page, '#pv'), /Trap <img/);
  await tabTo(page, 'food'); await page.click('[data-action="prev-day"]'); await page.waitForTimeout(50);
  assert.ok((await entries(page)).some(n => n.includes('<img')), 'shown as text');
  await tabTo(page, 'profile');
  assert.equal(await page.$('img[src="x"]'), null);
  assert.equal(await page.evaluate(() => window.__pwned), undefined);
  // A script injected after load is refused by the policy.
  await page.evaluate(() => { const s = document.createElement('script'); s.textContent = 'window.__pwned=2'; document.body.appendChild(s); });
  await page.waitForTimeout(50);
  assert.equal(await page.evaluate(() => window.__pwned), undefined);
  assert.ok(csp.length >= 1, 'the policy reported the injected script');
  assert.deepEqual(errors, []);
});

await test('web: profile save restarts the countdown; phone layout has no sideways scroll', async () => {
  const { page } = await open('index.html');
  await tabTo(page, 'profile');
  await page.fill('#f-weeks', '16'); await page.dispatchEvent('#f-weeks', 'input');
  await page.click('#prof-save'); await page.waitForTimeout(100);
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('cutline_v2')));
  assert.equal(saved.profile.goalWeeks, 16); assert.equal(saved.profile.goalStart, day(0));
  for (const f of ['index.html', 'dist/personal.html']) {
    const m = await open(f, { viewport: { width: 390, height: 844 } });
    for (const t of ['log', 'totals', 'food', 'history', 'profile']) {
      await m.page.click(`[data-tab="${t}"]`);
      assert.equal(await m.page.evaluate(() => document.documentElement.scrollWidth), 390, `${f} ${t}`);
    }
  }
});

// ---------- Claude versions: account storage, label reading, downloads ----------
await test('claude: saves to the account as main + month documents, and reloads from it', async () => {
  const { page, errors } = await open('dist/claude-site.html', { init: fakeClaude() });
  await page.waitForTimeout(150);
  await page.fill('#f-food', 'eggs'); await page.fill('#f-amt', '3'); await page.press('#f-amt', 'Enter'); await page.waitForTimeout(150);
  assert.match(await text(page, '#save-state'), /Saved to your Claude account/);
  const writes = await page.evaluate(() => window.__writes);
  assert.ok(writes.includes('data/users/u1/main') && writes.includes('data/users/u1/m-' + day(0).slice(0, 7)));
  await page.evaluate(() => { window.__writes = []; localStorage.removeItem('cutline_v2'); });
  await page.reload(); await page.waitForTimeout(300);
  await tabTo(page, 'food');
  assert.deepEqual(await entries(page), ['Egg, whole']);
  assert.deepEqual(errors, []);
});

await test('claude: an entry change writes only the main document and that month', async () => {
  const st = JSON.parse(stateWith({ loggedDays: 40 }));
  const { page } = await open('dist/claude-site.html', { init: fakeClaude(), storage: { cutline_v2: JSON.stringify(st) } });
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.__writes = []; });
  await page.fill('#f-food', 'eggs'); await page.fill('#f-amt', '1'); await page.press('#f-amt', 'Enter'); await page.waitForTimeout(150);
  assert.deepEqual((await page.evaluate(() => window.__writes)).sort(), ['data/users/u1/m-' + day(0).slice(0, 7), 'data/users/u1/main'].sort());
});

await test('claude: a failed save shows a visible message and retries', async () => {
  const { page } = await open('dist/claude-site.html', { init: fakeClaude({ failWrites: true }) });
  await page.waitForTimeout(200);
  await page.fill('#f-food', 'eggs'); await page.fill('#f-amt', '1'); await page.press('#f-amt', 'Enter'); await page.waitForTimeout(150);
  assert.match(await text(page, '#save-state'), /Couldn't save to your Claude account/);
  await page.evaluate(() => { window.__failWrites = false; });
  await page.waitForTimeout(4500);
  assert.match(await text(page, '#save-state'), /Saved to your Claude account/);
});

await test('claude: the first shared version\'s single document is moved to the new layout', async () => {
  const legacy = JSON.parse(stateWith({ loggedDays: 2 }));
  const init = `localStorage.setItem('fakedb', JSON.stringify({ 'data/users/u1/cutline': { json: ${JSON.stringify(JSON.stringify(legacy))} } }));` + fakeClaude();
  const { page } = await open('dist/claude-site.html', { init });
  await page.waitForTimeout(300);
  const db = JSON.parse(await page.evaluate(() => localStorage.getItem('fakedb')));
  assert.ok(db['data/users/u1/main']);
  assert.equal(Object.keys(JSON.parse(db['data/users/u1/main'].json).weights).length, 0);
  const months = JSON.parse(db['data/users/u1/main'].json).months;
  const n = months.reduce((a, m) => a + Object.keys(JSON.parse(db['data/users/u1/m-' + m].json)).length, 0);
  assert.equal(n, 2);
});

await test('claude: label photo is read into the custom food form, and export uses downloads', async () => {
  const { page, errors } = await open('dist/personal.html', { init: fakeClaude() });
  await page.waitForTimeout(250);
  await page.click('#cf-wrap summary');
  assert.equal(await text(page, '#scan-btn'), 'Scan a nutrition label');
  assert.equal(await page.$('[data-action="scan-manual"]'), null);
  const dir = mkdtempSync(join(tmpdir(), 'cutline-')), img = join(dir, 'label.png');
  writeFileSync(img, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
  await page.setInputFiles('#scan-file', img); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => window.__sampleImages), 1);
  assert.equal(await page.inputValue('#cf-name'), 'Test Bar');
  assert.equal(await page.inputValue('#cf-fiber'), '9');
  await tabTo(page, 'profile'); await page.click('[data-action="export"]'); await page.waitForTimeout(100);
  assert.match(await page.evaluate(() => window.__download.filename), /^cutline-backup-/);
  assert.equal(await page.$('header .s-date') !== null, true);
  assert.deepEqual(errors, []);
});

if (PERSONAL_SEEDED) {
  await test('migration: a page with a real log baked in copies all of it to the account', async () => {
    const { page, errors } = await open(PERSONAL_SEEDED, { init: fakeClaude() });
    await page.waitForTimeout(400);
    const db = JSON.parse(await page.evaluate(() => localStorage.getItem('fakedb')));
    const main = JSON.parse(db['data/users/u1/main'].json);
    const seed = JSON.parse(await page.evaluate(() => document.getElementById('state-data').textContent));
    const want = Object.values(seed.days).reduce((a, l) => a + l.length, 0);
    const got = main.months.reduce((a, m) => a + Object.values(JSON.parse(db['data/users/u1/m-' + m].json)).reduce((x, l) => x + l.length, 0), 0);
    assert.equal(got, want, 'every entry copied');
    assert.deepEqual(main.weights, seed.weights);
    assert.equal(main.customFoods.length, seed.customFoods.length);
    assert.equal(main.profile.netCarbLimit, seed.profile.netCarbLimit);
    await page.evaluate(() => localStorage.removeItem('cutline_v2'));
    await page.reload(); await page.waitForTimeout(400);
    const after = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('cutline_v2')).days).reduce((a, l) => a + l.length, 0));
    assert.equal(after, want);
    console.log(`   (${want} entries, ${main.months.length} months, ${Object.keys(main.weights).length} weigh-ins)`);
    assert.deepEqual(errors, []);
  });
}

await browser.close();
console.log(`\n${passed} browser tests passed`);
