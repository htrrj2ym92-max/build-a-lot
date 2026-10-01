const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../js/engine.js');
const D = require('../js/data.js');
const { playLevel } = require('./bot.js');

const day = (s, n = 1) => { for (let i = 0; i < n * 10; i++) E.tick(s, D.DAY_SECONDS / 10); };

test('buying a lot spends its price and marks it owned', () => {
  const s = E.createGame(0, 1);
  const lot = s.lots.find((l) => !l.owned);
  const before = s.cash;
  assert.equal(E.actions.buyLot(s, lot.id).ok, true);
  assert.equal(lot.owned, true);
  assert.equal(s.cash, before - lot.price);
  assert.equal(E.actions.buyLot(s, lot.id).ok, false);
});

test('building uses materials and crew but no cash, then produces a rented house', () => {
  const s = E.createGame(0, 1);
  const h = D.HOUSES.rambler;
  const { cash, materials } = s;
  assert.equal(E.actions.build(s, 0, 'rambler').ok, true);
  assert.equal(s.cash, cash);
  assert.equal(s.materials, materials - h.materials);
  assert.equal(E.freeWorkers(s), s.workers - h.workers);
  day(s, h.days);
  assert.equal(s.lots[0].kind, 'house');
  assert.equal(E.freeWorkers(s), s.workers);
});

test('rent is paid into the bank automatically once a day', () => {
  const s = E.createGame(0, 1);
  E.actions.build(s, 0, 'rambler');
  day(s, 1); // construction
  const cash = s.cash;
  day(s, 1);
  assert.equal(s.cash, cash + D.HOUSES.rambler.rents[0]);
  day(s, 4);
  assert.equal(s.cash, cash + D.HOUSES.rambler.rents[0] * 5, 'rent keeps arriving with no cap');
  assert.equal(s.stats.rentCollected, D.HOUSES.rambler.rents[0] * 5);
});

test('material orders charge fixed prices and deliver after 15 seconds', () => {
  const s = E.createGame(0, 1);
  const { cash, materials } = s;
  assert.equal(E.actions.buyMaterials(s, 100).ok, true);
  assert.equal(s.materials, materials);
  assert.equal(s.cash, cash - 10000);
  assert.ok(s.delivery);
  assert.equal(E.actions.buyMaterials(s, 250).ok, false, 'only one delivery at a time');
  E.tick(s, D.DELIVERY_SECONDS - 0.1);
  assert.equal(s.materials, materials);
  E.tick(s, 0.1);
  assert.equal(s.materials, materials + 100);
  s.cash = 9999;
  assert.match(E.actions.buyMaterials(s, 100).reason, /Needs \$/);
});

test('upgrades need a share of the house materials and no cash', () => {
  const s = E.createGame(1, 1); // Birch Lane has paint
  E.actions.build(s, 0, 'rambler');
  day(s, 1);
  const cash = s.cash, mats = s.materials;
  const need = E.upgradeMaterials('rambler', 'paint');
  assert.ok(need >= 1);
  assert.equal(E.actions.upgrade(s, 0, 'paint').ok, true);
  assert.equal(s.cash, cash);
  assert.equal(s.materials, mats - need);
});

test('actions are refused with a reason when resources are short', () => {
  const s = E.createGame(0, 1);
  s.materials = 10;
  const res = E.actions.build(s, 0, 'rambler');
  assert.equal(res.ok, false);
  assert.equal(res.reason, `Needs ${D.HOUSES.rambler.materials - 10} more materials`);
  assert.equal(E.actions.build(s, 0, 'mansion').ok, false, 'types outside the level are unavailable');
});

test('paint raises resale value while stars raise value and rent', () => {
  const s = E.createGame(3, 1); // Dogwood Heights: paint + yard, selling allowed
  const lot = s.lots[0];
  const rent = E.rentFor(s, lot);
  const value = E.saleValue(s, lot);
  assert.equal(E.actions.upgrade(s, lot.id, 'paint').ok, true);
  day(s, 1);
  assert.deepEqual(lot.house.upgrades, ['paint']);
  assert.equal(E.rentFor(s, lot), rent);
  assert.ok(E.saleValue(s, lot) > value);
  assert.equal(E.actions.upgrade(s, lot.id, 'paint').ok, false);
  assert.equal(E.actions.upgrade(s, lot.id, 'star').ok, true);
  day(s, 1);
  assert.equal(lot.house.stars, 1);
  assert.ok(E.rentFor(s, lot) > rent);
});

test('selling returns the lot to the market', () => {
  const s = E.createGame(3, 1);
  const lot = s.lots[0];
  const value = E.saleValue(s, lot);
  const cash = s.cash;
  assert.equal(E.actions.sell(s, lot.id).ok, true);
  assert.equal(s.cash, cash + value);
  assert.equal(lot.owned, false);
  assert.equal(lot.kind, 'empty');
  assert.equal(s.stats.sold, 1);
});

test('run-down houses must be bought and torn down before building', () => {
  const s = E.createGame(2, 1);
  const lot = s.lots.find((l) => l.kind === 'rundown');
  assert.equal(E.actions.demolish(s, lot.id).ok, false);
  E.actions.buyLot(s, lot.id);
  assert.equal(E.actions.build(s, lot.id, 'rambler').ok, false);
  assert.equal(E.actions.demolish(s, lot.id).ok, true);
  day(s, 1);
  assert.equal(lot.kind, 'empty');
  assert.equal(s.stats.demolished, 1);
  assert.equal(E.actions.build(s, lot.id, 'rambler').ok, true);
});

test('parks boost neighbouring rent and sawmills discount and speed delivery', () => {
  const s = E.createGame(4, 1); // Elm Park
  s.cash = 1e6;
  s.materials = 1e4;
  s.workers = 6;
  // Lot 0 (owned) becomes a park; lot 1 next to it gets a house.
  E.actions.buyLot(s, 1);
  E.actions.buildSpecial(s, 0, 'park');
  E.actions.build(s, 1, 'rambler');
  day(s, 2);
  assert.equal(E.parkBonus(s, s.lots[1]), D.PARK_BONUS);
  assert.equal(E.rentFor(s, s.lots[1]), Math.round(D.HOUSES.rambler.rents[0] * (1 + D.PARK_BONUS)));
  E.actions.buildSpecial(s, 5, 'mill');
  day(s, 2);
  const cash = s.cash, mats = s.materials;
  assert.equal(E.actions.buyMaterials(s, 100).ok, true);
  assert.equal(s.cash, cash - 5000);
  E.tick(s, D.SAWMILL_DELIVERY_SECONDS);
  assert.equal(s.materials, mats + 100);
});

test('the six material bundle prices match the order list', () => {
  assert.deepEqual(D.MATERIAL_ORDERS, [
    { amount: 100, price: 10000 }, { amount: 250, price: 22500 }, { amount: 500, price: 40000 },
    { amount: 1000, price: 75000 }, { amount: 2500, price: 150000 }, { amount: 5000, price: 250000 },
  ]);
});

test('house tiers match their construction, worker, value and rent tables', () => {
  const expected = [
    ['rambler', 75, 1, 50000, [1000, 1200, 1600, 2000]],
    ['cottage', 150, 2, 75000, [1500, 1800, 2400, 3000]],
    ['colonial', 300, 3, 150000, [3000, 3600, 4800, 6000]],
    ['victorian', 600, 5, 300000, [6000, 7200, 9600, 12000]],
    ['craftsman', 1200, 7, 600000, [15000, 18000, 24000, 30000]],
    ['mansion', 2500, 9, 1200000, [25000, 30000, 40000, 50000]],
  ];
  for (const [type, materials, workers, value, rents] of expected) {
    assert.deepEqual(
      [D.HOUSES[type].materials, D.HOUSES[type].workers, D.HOUSES[type].value, D.HOUSES[type].rents],
      [materials, workers, value, rents],
    );
  }
  assert.ok(D.LEVELS.every((L) => L.canSell));
  assert.equal(E.createGame(0).lots[2].price, 25000);
});

test('workshops halve hiring costs, enable inspections, repairs and paid training', () => {
  const s = E.createGame(5, 1);
  s.cash = 1000000;
  s.materials = 10000;
  s.workers = 7;
  const existingHouse = s.lots.find((lot) => lot.kind === 'house');
  assert.match(E.actions.inspect(s, existingHouse.id).reason, /workshop/i);
  assert.equal(E.actions.buildSpecial(s, 0, 'workshop').ok, true);
  assert.equal(E.actions.buildSpecial(s, 10, 'workshop').ok, false);
  day(s, 2);
  s.workers = 4;
  assert.equal(E.hireCost(s), 25000);
  const house = s.lots.find((lot) => lot.kind === 'house');
  house.house.decay = D.HOUSE_DECAY_DAYS - 0.01;
  assert.equal(E.actions.inspect(s, house.id).ok, true);
  assert.equal(house.house.decay, 0);
  house.house.damaged = true;
  house.house.decay = D.HOUSE_DECAY_DAYS;
  const repair = D.REPAIR_MATERIALS[house.house.type];
  s.materials = repair;
  assert.equal(E.actions.inspect(s, house.id).ok, true);
  assert.equal(s.materials, 0);
  assert.equal(house.house.damaged, false);
  const beforeTraining = s.cash;
  assert.equal(E.actions.train(s).ok, true);
  assert.equal(s.cash, beforeTraining - D.TRAINING_COST);
  assert.equal(s.workshopTraining, true);
});

test('hiring follows the specified first-three-worker prices', () => {
  const s = E.createGame(5, 1);
  s.cash = 1000000;
  assert.deepEqual([E.hireCost(s), ...[1, 2].map(() => {
    E.actions.hire(s);
    return E.hireCost(s);
  })], [50000, 90000, 120000]);
});

test('damaged homes cost half their listed value and demolition returns three-fifths materials', () => {
  const s = E.createGame(6, 1);
  const damaged = s.lots.find((lot) => lot.kind === 'damaged-sale');
  assert.equal(damaged.price, D.HOUSES.rambler.value / 2);
  assert.equal(E.actions.buyLot(s, damaged.id).ok, true);
  assert.equal(damaged.kind, 'house');
  assert.equal(damaged.house.damaged, true);
  assert.equal(E.rentFor(s, damaged), 0);

  const built = s.lots.find((lot) => lot.owned && lot.kind === 'empty');
  s.materials = D.HOUSES.cottage.materials;
  assert.equal(E.actions.build(s, built.id, 'cottage').ok, true);
  day(s, 1.5);
  assert.equal(E.actions.demolish(s, built.id).ok, true);
  day(s, 1);
  assert.equal(s.materials, Math.floor(D.HOUSES.cottage.materials * 3 / 5));
});

test('a street never starts with a goal already met', () => {
  for (const [i] of D.LEVELS.entries()) {
    const s = E.createGame(i, 1);
    E.checkGoals(s);
    assert.deepEqual(s.goalsMet, s.goalsMet.map(() => false), `street ${i + 1}`);
  }
});

test('cash goals track the balance while other goals stay met', () => {
  const s = E.createGame(1, 1); // Birch Lane: 5 houses, 2 upgrades, $12,000
  s.stats.upgrades = 2;
  s.cash = 1e6;
  E.checkGoals(s);
  assert.deepEqual(s.goalsMet, [false, true, true]);
  s.stats.upgrades = 0;
  s.cash = 0;
  E.checkGoals(s);
  assert.deepEqual(s.goalsMet, [false, true, false]);
  assert.equal(s.status, 'playing');
});

for (const [i, L] of D.LEVELS.entries()) {
  test(`street ${i + 1} (${L.name}) can be won by a simple bot`, () => {
    const s = playLevel(i);
    assert.equal(s.status, 'won', `stalled on day ${s.day}`);
    assert.ok(s.wonDay <= L.expertDays * 1.5, `took ${s.wonDay} days`);
  });
}

test('every asset in index.html carries the build stamp the deploy replaces', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /<html[^>]* data-build="__BUILD__"/);
  const local = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(local.length >= 6, 'found the stylesheet and scripts');
  for (const ref of local) {
    assert.match(ref, /\?v=__BUILD__$/, `${ref} needs ?v=__BUILD__`);
    assert.ok(fs.existsSync(path.join(root, ref.split('?')[0])), `${ref} exists`);
  }
  assert.match(fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8'), /const BUILD = '__BUILD__';/);
});
