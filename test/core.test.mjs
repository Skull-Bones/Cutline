// Unit tests for the pure parts of Cutline (catalog, search, amounts, targets, trend, target check).
// Run with `node test/core.test.mjs`. No dependencies.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const code = ['foods.js', 'core.js'].map(f => readFileSync(new URL('../src/' + f, import.meta.url), 'utf8')).join('\n');
function load(state) {
  const ctx = { state, console, Math, Date, JSON, Object, Array, String, Number, parseFloat, parseInt, isFinite };
  vm.createContext(ctx);
  vm.runInContext(code + '\n;this.api={FOODS,findFoods,parseAmount,foodMacros,calcTargets,dayNum,slopePerDay,adaptiveEstimate,clampedAdjust,shiftDate,goalWeeksOf,todayStr};', ctx);
  return ctx.api;
}
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('ok -', name); }
const near = (a, b, tol = 0.6, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} expected ${b}, got ${a}`);

const eric = { sex: 'male', age: 28, heightIn: 72, weightLb: 198, goalWeightLb: 190, activity: 1.725, dietMode: 'keto',
               proteinFloorEnabled: true, proteinFloorG: 200, goalWeeks: 8, goalStart: '2026-11-19' };
const api = load({ profile: eric, customFoods: [], days: {}, weights: {} });

test('catalog has 434 foods with unique names and sane energy', () => {
  assert.equal(api.FOODS.length, 434);
  assert.equal(new Set(api.FOODS.map(f => f.n)).size, 434);
  for (const f of api.FOODS) {
    for (const k of ['cal', 'p', 'c', 'fi', 'f']) assert.ok(isFinite(f[k]) && f[k] >= 0, `${f.n} ${k}`);
    assert.ok(f.fi <= f.c + 1e-9 || f.fi === 0 || f.n.includes('Carb Balance') || f.n.includes('Quest'), `${f.n} fiber above carbs`);
  }
});

test('search ranks the obvious food first', () => {
  const first = q => api.findFoods(q)[0].n;
  assert.equal(first('chicken breast'), 'Chicken breast, cooked');
  assert.equal(first('big mac'), "McDonald's Big Mac");
  assert.equal(first('chickfila 12'), 'Chick-fil-A Nuggets, 12 count');
  assert.equal(first('jalapeno whataburger'), 'Jalapeño & Cheese Whataburger');
  assert.equal(first('caffe latte'), 'Starbucks Caffè Latte, grande');
  assert.equal(api.findFoods('zzzz').length, 0);
});

test('amounts: grams, ounces, pieces and restaurant counts', () => {
  const chicken = api.findFoods('chicken breast')[0], egg = api.findFoods('eggs')[0], mac = api.findFoods('big mac')[0];
  near(api.parseAmount('179', chicken).g, 179, 0.01);
  near(api.parseAmount('6oz', chicken).g, 170.1, 0.1);
  near(api.parseAmount('4x', egg).g, 200, 0.01);
  near(api.parseAmount('4', egg).g, 200, 0.01);
  assert.equal(api.parseAmount('200g', mac), null);
  near(api.foodMacros(mac, api.parseAmount('2', mac).g).cals, 1160, 0.01);
  near(api.foodMacros(chicken, 179).protein, 55.49, 0.01);
});

test('8-week plan from 198 to 190 lb is a 500 kcal deficit', () => {
  const t = api.calcTargets(eric, '2026-11-19');
  near(t.needed, 500, 0.01);
  near(t.tdee - t.calorieTarget, 500, 0.01);
  assert.equal(t.elapsed, 0);
});

test('countdown: 2 weeks in, the deficit is recalculated from what is left', () => {
  const p = { ...eric, weightLb: 196 };
  const t = api.calcTargets(p, '2026-12-03');
  assert.equal(t.elapsed, 14);
  assert.equal(t.daysLeft, 42);
  near(t.needed, 6 * 3500 / 42, 0.01);
});

test('timeline that has ended is flagged and never divides by less than a week', () => {
  const t = api.calcTargets(eric, '2027-03-01');
  assert.equal(t.ended, true);
  assert.equal(t.daysLeft, 7);
});

test('calorie floor holds for aggressive plans', () => {
  const t = api.calcTargets({ ...eric, goalWeightLb: 160, goalWeeks: 6 }, '2026-11-19');
  assert.equal(t.limited, 'floor');
  near(t.calorieTarget, 1500, 0.01);
});

test('tdeeAdjust shifts maintenance and the target together', () => {
  const a = api.calcTargets(eric, '2026-11-19'), b = api.calcTargets({ ...eric, tdeeAdjust: -200 }, '2026-11-19');
  near(b.tdee, a.tdee - 200, 0.01);
  near(b.calorieTarget, a.calorieTarget - 200, 0.01);
  near(b.formulaTdee, a.formulaTdee, 0.01);
});

test('dayNum ignores daylight saving changes', () => {
  assert.equal(api.dayNum('2026-03-09') - api.dayNum('2026-03-07'), 2);
  assert.equal(api.dayNum('2026-11-02') - api.dayNum('2026-10-31'), 2);
});

test('slope of a steady 1 lb per week loss', () => {
  near(api.slopePerDay([[0, 200], [7, 199], [14, 198], [21, 197]]) * 7, -1, 1e-9);
});

test('target check: estimate = intake + 3500 x weekly loss / 7, and needs enough data', () => {
  const days = {}, weights = {};
  for (let i = 1; i <= 21; i++) {
    const d = api.shiftDate('2026-11-30', -i);
    days[d] = [{ id: 'x' + i, name: 'x', cals: 2300, protein: 0, carbs: 0, fiber: 0, fat: 0 }];
  }
  [0, 7, 14, 21].forEach((k, i) => { weights[api.shiftDate('2026-11-30', -k)] = 197 + i; });   // 1 lb a week down
  const st = { profile: eric, days, weights };
  const a = api.adaptiveEstimate(st, '2026-11-30');
  assert.equal(a.ready, true);
  near(a.estimate, 2300 + 500, 0.5);
  const few = api.adaptiveEstimate({ profile: eric, days, weights: { '2026-11-29': 197, '2026-11-28': 197.2 } }, '2026-11-30');
  assert.equal(few.ready, false);
  const c = api.clampedAdjust(5000, 3000);
  assert.equal(c.clamped, true);
  near(c.value, 3750, 0.01);
});

console.log(`\n${passed} tests passed`);
