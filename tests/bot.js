/* A simple greedy player used by the tests to prove every level can be won. */
const E = require('../js/engine.js');
const D = require('../js/data.js');

function botStep(s) {
  const L = D.LEVELS[s.level];
  const A = E.actions;
  const pending = (kind) => L.goals.find((g, i) => g.kind === kind && !s.goalsMet[i]);
  const houses = L.houses.map((t) => [t, D.HOUSES[t]]);
  const cheapest = houses[0][1];
  const typeGoal = pending('houseType');
  const inWork = (type) => s.lots.filter((l) => (l.task && l.task.type === type) || (l.house && l.house.type === type && !l.task)).length;
  const typeShort = typeGoal ? typeGoal.target - inWork(typeGoal.type) : 0;
  const empties = () => s.lots.filter((l) => l.owned && l.kind === 'empty' && !l.task);
  const canPay = (cost, mats) => {
    const short = mats - s.materials;
    const order = short > 0 && !s.delivery ? D.MATERIAL_ORDERS.find((item) => item.amount >= short) : null;
    return s.cash >= cost + (order ? E.orderPrice(s, order) : 0);
  };

  for (const lot of s.lots) if (lot.kind === 'rundown' && lot.owned) A.demolish(s, lot.id);

  if (E.hasWorkshop(s)) {
    for (const lot of s.lots.filter((item) => item.kind === 'house' && item.house.damaged && !item.task)) {
      topUp(s, D.REPAIR_MATERIALS[lot.house.type]);
      A.inspect(s, lot.id);
    }
  }

  const specialGoal = pending('special');
  for (const type of [specialGoal && specialGoal.type, 'workshop', 'mill'].filter(Boolean)) {
    if (!L.specials.includes(type) || s.lots.some((l) => l.special === type || (l.task && l.task.type === type))) continue;
    const sp = D.SPECIALS[type];
    const lot = empties()[0];
    const rich = type === (specialGoal && specialGoal.type) || (type === 'workshop' ? s.cash > 75000 : s.cash > worth(sp.materials) * 3);
    if (lot && rich && canPay(0, sp.materials)) { topUp(s, sp.materials); A.buildSpecial(s, lot.id, type); }
  }

  let saving = 0;
  const earners = s.lots.filter((l) => l.kind === 'house' || (l.task && l.task.kind === 'build')).length;
  for (const lot of empties()) {
    if (typeShort - saving > 0 && earners >= 2) {
      const h = D.HOUSES[typeGoal.type];
      if (canPay(0, h.materials) && E.freeWorkers(s) >= h.workers) { topUp(s, h.materials); A.build(s, lot.id, typeGoal.type); }
      saving++;
      continue;
    }
    for (const [t, h] of houses.slice().reverse()) {
      if (typeGoal && t === typeGoal.type && typeShort <= 0) continue;
      if (canPay(0, h.materials) && E.freeWorkers(s) >= h.workers) {
        topUp(s, h.materials);
        if (A.build(s, lot.id, t).ok) break;
      }
    }
  }

  if (typeShort > 0 && s.workers < L.maxWorkers && E.freeWorkers(s) < D.HOUSES[typeGoal.type].workers && s.cash >= E.hireCost(s)) A.hire(s);

  // Make room for the goal type when the street is full.
  if (typeShort > 0 && !empties().length && s.lots.every((l) => l.owned || l.kind !== 'empty')) {
    const victim = s.lots.filter((l) => l.kind === 'house' && !l.task && l.house.type !== typeGoal.type)
      .sort((a, b) => D.HOUSES[a.house.type].materials - D.HOUSES[b.house.type].materials)[0];
    if (victim) (L.canSell ? A.sell : A.demolish)(s, victim.id);
  }

  if (pending('sold')) {
    const lot = s.lots.find((l) => l.kind === 'house' && !l.task);
    if (lot) A.sell(s, lot.id);
  }

  const cashGoal = pending('cash');
  const houseGoal = pending('houses');
  if (L.canSell && cashGoal && !empties().length && s.cash < cashGoal.target &&
      s.lots.filter((l) => l.kind === 'house').length > (houseGoal ? houseGoal.target : 0)) {
    const victim = s.lots.filter((l) => l.kind === 'house' && !l.task)
      .sort((a, b) => Number(b.house.damaged) - Number(a.house.damaged))[0];
    if (victim) A.sell(s, victim.id);
  }

  if (L.canSell && s.cash < 50000 && s.lots.some((l) => !l.owned && l.kind === 'empty')) {
    const damaged = s.lots.find((l) => l.kind === 'house' && l.house.damaged && !l.task);
    if (damaged) A.sell(s, damaged.id);
  }

  for (const lot of s.lots.filter((l) => l.kind === 'house' && !l.task))
    for (const key of L.upgrades) {
      const mats = E.upgradeMaterials(lot.house.type, key);
      if (s.cash > worth(mats) * 3 + 1000) { topUp(s, mats); A.upgrade(s, lot.id, key); }
    }

  const forSale = s.lots.filter((l) => !l.owned).sort((a, b) => a.price - b.price)[0];
  const saveUp = typeShort > 0 ? worth(D.HOUSES[typeGoal.type].materials) * 0.5 : worth(cheapest.materials);
  if (forSale && (typeShort <= 0 || !empties().length) && s.cash > forSale.price + saveUp) A.buyLot(s, forSale.id);

  if (E.freeWorkers(s) === 0 && s.cash > E.hireCost(s) * 2) A.hire(s);
}

const worth = (m) => {
  const order = D.MATERIAL_ORDERS.find((item) => item.amount >= m);
  return order ? order.price : D.MATERIAL_ORDERS.at(-1).price;
};

function topUp(s, need) {
  const short = need - s.materials;
  if (short > 0 && !s.delivery) {
    const order = D.MATERIAL_ORDERS.find((item) => item.amount >= short);
    if (order && s.cash >= E.orderPrice(s, order)) E.actions.buyMaterials(s, order.amount);
  }
}

function playLevel(index, maxDays = 200) {
  const s = E.createGame(index);
  while (s.status === 'playing' && s.day < maxDays) {
    botStep(s);
    E.tick(s, 0.5);
  }
  return s;
}

module.exports = { playLevel };
if (require.main === module) {
  D.LEVELS.forEach((L, i) => {
    const s = playLevel(i);
    console.log(`${i + 1}. ${L.name.padEnd(18)} ${s.status.padEnd(8)} day ${s.day} (expert ${L.expertDays}) cash ${s.cash}`);
  });
}
