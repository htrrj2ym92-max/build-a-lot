/* Static game content: buildings, upgrades and level definitions. */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.BAL = Object.assign(root.BAL || {}, { data: mod });
})(typeof self !== 'undefined' ? self : this, function () {
  // Real seconds in one in-game day at 1x speed.
  const DAY_SECONDS = 12;

  // Construction is paid for in materials only; materials are bought with cash.
  // Keys preserve the existing artwork and level progression; display names follow the property tiers.
  const HOUSES = {
    rambler:   { name: 'Rambler',  materials: 75,   workers: 1, days: 1,   rents: [1000, 1200, 1600, 2000], value: 50000 },
    cottage:   { name: 'Colonial', materials: 150,  workers: 2, days: 1.5, rents: [1500, 1800, 2400, 3000], value: 75000 },
    colonial:  { name: 'Tudor',    materials: 300,  workers: 3, days: 2,   rents: [3000, 3600, 4800, 6000], value: 150000 },
    victorian: { name: 'Estate',   materials: 600,  workers: 5, days: 2.5, rents: [6000, 7200, 9600, 12000], value: 300000 },
    craftsman: { name: 'Mansion',  materials: 1200, workers: 7, days: 3,   rents: [15000, 18000, 24000, 30000], value: 600000 },
    mansion:   { name: 'Castle',   materials: 2500, workers: 9, days: 4,   rents: [25000, 30000, 40000, 50000], value: 1200000 },
  };

  const UPGRADES = {
    star:  { name: 'Star upgrade', matPct: 0.10, workers: 1, days: 1,   rentBonus: 0, valueBonus: 0.10 },
    paint: { name: 'Paint', matPct: 0.08, workers: 1, days: 0.5, rentBonus: 0, valueBonus: 0.05 },
    yard:  { name: 'Landscaping', matPct: 0.15, workers: 1, days: 1,   rentBonus: 0, valueBonus: 0.05 },
  };

  const SPECIALS = {
    park:     { name: 'Pocket Park', materials: 36, workers: 1, days: 1, blurb: '+20% rent for neighbouring houses' },
    mill:     { name: 'Sawmill', materials: 50, workers: 2, days: 2, blurb: 'Half-price materials and faster deliveries' },
    workshop: { name: 'Workshop', materials: 900, workers: 3, days: 2, blurb: 'Half-price hiring, house inspections and Efficiency Training' },
  };

  const DEMOLISH = { cost: 300, workers: 1, days: 0.75 };
  const HIRE_COSTS = [50000, 90000, 120000];
  const PARK_BONUS = 0.2;
  const MATERIAL_ORDERS = [
    { amount: 100, price: 10000 },
    { amount: 250, price: 22500 },
    { amount: 500, price: 40000 },
    { amount: 1000, price: 75000 },
    { amount: 2500, price: 150000 },
    { amount: 5000, price: 250000 },
  ];
  const DELIVERY_SECONDS = 15;
  const SAWMILL_DELIVERY_SECONDS = 7.5;
  const WORKSHOP_SPEED = 2;
  const HOUSE_DECAY_DAYS = 8;
  const TRAINING_COST = 75000;
  const REPAIR_MATERIALS = { rambler: 7, cottage: 15, colonial: 30, victorian: 60, craftsman: 120, mansion: 250 };

  // Lot codes: 'o' owned empty lot, 's' empty lot for sale at $25,000,
  // 'rN' run-down house for sale at $N (buy, then demolish),
  // 'h:type' owned, rented house of that type.
  const LEVELS = [
    {
      name: 'Maple Court', perRow: 3,
      intro: 'A quiet cul-de-sac to learn the trade. Build houses, and tenants move in on their own.',
      lots: ['o', 'o', 's', 's', 's', 's'],
      cash: 30000, materials: 75, workers: 2, maxWorkers: 3,
      houses: ['rambler', 'cottage'], upgrades: [], specials: [], canSell: true,
      goals: [{ kind: 'houses', target: 4 }, { kind: 'cash', target: 40000 }],
      expertDays: 16,
    },
    {
      name: 'Birch Lane', perRow: 4,
      intro: 'Tenants love a fresh coat of paint. Upgraded houses earn more rent.',
      lots: ['o', 's', 's', 's', 's', 'o', 's', 's'],
      cash: 50000, materials: 150, workers: 2, maxWorkers: 4,
      houses: ['rambler', 'cottage'], upgrades: ['star', 'paint'], specials: [], canSell: true,
      goals: [{ kind: 'houses', target: 5 }, { kind: 'upgrades', target: 2 }, { kind: 'cash', target: 120000 }],
      expertDays: 23,
    },
    {
      name: 'Cedar Hollow', perRow: 4,
      intro: 'Old shacks line the street. Buy them cheap, tear them down, and build fresh.',
      lots: ['r500', 'o', 'r500', 's', 's', 'r600', 'o', 'r700'],
      cash: 60000, materials: 300, workers: 3, maxWorkers: 5,
      houses: ['rambler', 'cottage', 'colonial'], upgrades: ['star', 'paint'], specials: [], canSell: true,
      goals: [{ kind: 'demolish', target: 3 }, { kind: 'houseType', type: 'colonial', target: 2 }, { kind: 'cash', target: 100000 }],
      expertDays: 24,
    },
    {
      name: 'Dogwood Heights', perRow: 5,
      intro: 'Buyers are looking. Improve a house, then sell it for a profit.',
      lots: ['h:rambler', 'o', 's', 's', 'r800', 'h:cottage', 's', 'r800', 's', 'o'],
      cash: 50000, materials: 300, workers: 3, maxWorkers: 5,
      houses: ['rambler', 'cottage', 'colonial'], upgrades: ['star', 'paint', 'yard'], specials: [], canSell: true,
      goals: [{ kind: 'sold', target: 3 }, { kind: 'cash', target: 100000 }],
      expertDays: 21,
    },
    {
      name: 'Elm Park', perRow: 5,
      intro: 'Parks lift rents next door, and a Sawmill halves material prices and delivery times.',
      lots: ['o', 's', 'r900', 's', 's', 'o', 's', 's', 'r1000', 's'],
      cash: 90000, materials: 600, workers: 3, maxWorkers: 6,
      houses: ['rambler', 'cottage', 'colonial', 'victorian'], upgrades: ['star', 'paint', 'yard'], specials: ['park', 'mill'], canSell: true,
      goals: [{ kind: 'special', type: 'park', target: 1 }, { kind: 'houseType', type: 'victorian', target: 2 }, { kind: 'cash', target: 150000 }],
      expertDays: 36,
    },
    {
      name: 'Foxglove Ridge', perRow: 6,
      intro: 'Build a Workshop to inspect houses, hire cheaper workers and train your crew to work faster.',
      lots: ['o', 's', 's', 'r1000', 's', 's', 'h:cottage', 's', 'r1100', 's', 'o', 's'],
      cash: 100000, materials: 600, workers: 4, maxWorkers: 7,
      houses: ['rambler', 'cottage', 'colonial', 'victorian'], upgrades: ['star', 'paint', 'yard'], specials: ['park', 'mill', 'workshop'], canSell: true,
      goals: [{ kind: 'houses', target: 8 }, { kind: 'upgrades', target: 8 }, { kind: 'cash', target: 200000 }],
      expertDays: 28,
    },
    {
      name: 'Garnet Bay', perRow: 6,
      intro: 'Waterfront lots draw a better class of tenant. Mansions are in demand.',
      lots: ['o', 's', 's', 'd:rambler', 'r1500', 's', 'h:colonial', 's', 'r1500', 's', 's', 'o'],
      cash: 140000, materials: 1200, workers: 4, maxWorkers: 8,
      houses: ['cottage', 'colonial', 'victorian', 'craftsman'], upgrades: ['star', 'paint', 'yard'], specials: ['park', 'mill', 'workshop'], canSell: true,
      goals: [{ kind: 'houseType', type: 'craftsman', target: 3 }, { kind: 'rent', target: 40000 }, { kind: 'cash', target: 250000 }],
      expertDays: 33,
    },
    {
      name: 'Hillcrest Estates', perRow: 7,
      intro: 'The finest address in the county. Build Castles and fill every lot.',
      lots: ['o', 's', 's', 'r2000', 's', 's', 's', 'h:colonial', 's', 'r2000', 's', 's', 'o', 's'],
      cash: 200000, materials: 2500, workers: 5, maxWorkers: 9,
      houses: ['cottage', 'colonial', 'victorian', 'craftsman', 'mansion'], upgrades: ['star', 'paint', 'yard'], specials: ['park', 'mill', 'workshop'], canSell: true,
      goals: [{ kind: 'houseType', type: 'mansion', target: 2 }, { kind: 'houses', target: 12 }, { kind: 'cash', target: 400000 }],
      expertDays: 44,
    },
  ];

  return {
    DAY_SECONDS, HOUSES, UPGRADES, SPECIALS, DEMOLISH, HIRE_COSTS,
    PARK_BONUS, MATERIAL_ORDERS, DELIVERY_SECONDS, SAWMILL_DELIVERY_SECONDS,
    WORKSHOP_SPEED, HOUSE_DECAY_DAYS, TRAINING_COST, REPAIR_MATERIALS, LEVELS,
  };
});
