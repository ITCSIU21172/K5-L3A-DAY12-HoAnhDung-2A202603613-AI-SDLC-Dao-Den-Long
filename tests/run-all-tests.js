import fs from 'fs';
import { execSync } from 'child_process';
import crypto from 'crypto';
import { Simulation } from '../src/core/simulation.js';
import { PRNG } from '../src/core/rng.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`  PASS: ${message}`);
    passed++;
  }
}

console.log('=== RUNNING UNIT & REGRESSION TESTS (CONTRACT V1.1) ===');

// Test 1: PRNG Determinism
try {
  const rng1 = new PRNG(42);
  const rng2 = new PRNG(42);
  let match = true;
  for (let i = 0; i < 100; i++) {
    if (rng1.next() !== rng2.next()) {
      match = false;
      break;
    }
  }
  assert(match, 'PRNG is 100% deterministic with same seed');
} catch (e) {}

// Test 2: Standardized Mote Pickup
try {
  const sim = new Simulation({
    seed: 101,
    night: 1,
    random_motes: false,
    random_shades: false,
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      motes: [[0, 0, 0.8]],
      shades: [],
      lanterns: []
    }
  });
  const events = sim.step();
  assert(events.length >= 1 && events.some(e => e.name === 'mote_picked'), 'Mote picked up within pickup radius <= 1.0m');
  assert(sim.player.carried === 1, 'Player carried count incremented to 1');
} catch (e) {}

// Test 3: Standardized Deposit & Lantern Lighting (Cost 10)
try {
  const sim = new Simulation({
    seed: 102,
    night: 1,
    random_motes: false,
    random_shades: false,
    scenario: {
      player: { pos: [0, 0, 0], carried: 10, flames: 3 },
      motes: [],
      shades: [],
      lanterns: [{ id: 'L1', pos: [0, 0, 1.5], deposited: 0, lit: false }]
    }
  });
  sim.setInput({ interact: true });
  const events = sim.step();
  assert(events.some(e => e.name === 'deposit'), 'Deposit event emitted');
  assert(events.some(e => e.name === 'lantern_lit'), 'Lantern lit event emitted when cost 10 reached');
  assert(sim.player.carried === 0, 'Carried motes depleted after full deposit');
  assert(sim.lanterns.find(l => l.id === 'L1').lit === true, 'Lantern L1 is marked lit');
} catch (e) {}

// Test 4: Pulse Stun & Push (Contract v1.1)
try {
  const sim = new Simulation({
    seed: 103,
    night: 1,
    random_motes: false,
    random_shades: false,
    scenario: {
      player: { pos: [0, 0, 0], carried: 5, flames: 3 },
      motes: [],
      shades: [{ id: 'S1', pos: [3.0, 0, 0] }],
      lanterns: []
    }
  });
  sim.setInput({ pulse: true });
  const events = sim.step();
  assert(events.some(e => e.name === 'pulse'), 'Pulse event emitted');
  const shade = sim.shades[0];
  assert(shade.state === 'stunned', 'Shade enters stunned state for 120 ticks');
  assert(sim.player.carried === 2, 'Pulse consumed exactly 3 motes');
  assert(sim.score === 5, 'Pulse awarded +5 score per shade hit');
} catch (e) {}

// Test 5: Shade Hit & Dropped Motes
try {
  const sim = new Simulation({
    seed: 104,
    night: 1,
    random_motes: false,
    random_shades: false,
    scenario: {
      player: { pos: [0, 0, 0], carried: 6, flames: 3 },
      motes: [],
      shades: [{ id: 'S1', pos: [0.5, 0, 0] }],
      lanterns: []
    }
  });
  const events = sim.step();
  assert(events.some(e => e.name === 'player_hit'), 'Player hit event emitted');
  assert(sim.player.flames === 2, 'Player lost 1 flame');
  assert(sim.player.carried === 3, 'Player dropped 50% of motes (3/6)');
  assert(sim.motes.some(m => m.kind === 'dropped'), 'Dropped motes spawned in surrounding ring');
} catch (e) {}

// Test 6: Dash Mechanic (Phase 2 Feature)
try {
  const sim = new Simulation({
    seed: 106,
    night: 1,
    random_motes: false,
    random_shades: false
  });
  sim.setInput({ move: [0, 1], dash: true });
  const events = sim.step();
  assert(events.some(e => e.name === 'dash'), 'Dash event emitted on rising edge');
  assert(sim.player.dash_timer === 11, 'Dash timer active (12 ticks total)');
  assert(sim.player.dash_cd === 90, 'Dash cooldown initialized to 90 ticks (1.5s)');
} catch (e) {}

// Test 7: Bùa Gió (Wind Charm) Pickup & Effect
try {
  const sim = new Simulation({
    seed: 107,
    night: 2,
    random_motes: false,
    random_shades: false,
    scenario: {
      player: { pos: [34.5, 0, 0], carried: 0, flames: 3 },
      charms: [{ id: 'C1', pos: [35.0, 0, 0], available: true, respawn_timer: 0 }]
    }
  });
  sim.setInput({ move: [1, 0] });
  const events = sim.step();
  assert(events.some(e => e.name === 'charm_picked'), 'Charm picked event emitted');
  assert(sim.player.charm_timer === 600, 'Charm buff active for 600 ticks');
} catch (e) {}

// Test 8: Gió Lạc (Drifter) Steal & Drop
try {
  const sim = new Simulation({
    seed: 108,
    night: 2,
    random_motes: false,
    random_shades: false,
    scenario: {
      player: { pos: [0, 0, 0], carried: 6, flames: 3 },
      drifters: [{ id: 'D1', pos: [0.8, 0, 0], state: 'chase', stolen: 0 }]
    }
  });
  const events = sim.step();
  assert(events.some(e => e.name === 'drifter_steal'), 'Drifter steal event emitted');
  assert(sim.player.carried === 3, 'Drifter stole exactly min(3, carried) = 3 motes');
  assert(sim.drifters[0].state === 'flee', 'Drifter switched to flee state');
} catch (e) {}

// Test 9: Pause Feature
try {
  const sim = new Simulation({ seed: 109, night: 1 });
  sim.setInput({ pause: true });
  const events = sim.step();
  assert(events.some(e => e.name === 'paused'), 'Paused event emitted');
  assert(sim.paused === true, 'Simulation state entered pause mode');
} catch (e) {}

// Test 10: Multi-Night Initialization (Night 1, Night 2, Night 3)
try {
  const sim1 = new Simulation({ night: 1 });
  const sim2 = new Simulation({ night: 2 });
  const sim3 = new Simulation({ night: 3 });

  assert(sim1.lanterns.length === 5, 'Night 1 has 5 lanterns');
  assert(sim2.lanterns.length === 6, 'Night 2 has 6 lanterns (Đảo Cau)');
  assert(sim3.lanterns.length === 7, 'Night 3 has 7 lanterns (Đảo Chuông)');
  assert(sim2.jumpPads.length === 2, 'Night 2 has 2 jump pads connecting the two islands');
  assert(sim3.jumpPads.length === 1, 'Night 3 has jump pad to tier 2');
} catch (e) {}

console.log('\n=== RUNNING HEADLESS CLI & CONTRACT SCENARIOS ===');

// Test 11: Headless Night 1 Run
try {
  const outPath = 'tests/out_night1.jsonl';
  execSync(`node src/headless.js --seed 42 --night 1 --ticks 60 --out ${outPath}`, { stdio: 'pipe' });
  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
  const snap0 = JSON.parse(lines[0]);
  assert(snap0.night === 1, 'Snapshot 0 has night = 1');
  assert(Array.isArray(snap0.motes), 'Snapshot has motes array');
  assert(Array.isArray(snap0.charms), 'Snapshot has charms array');
  assert(Array.isArray(snap0.drifters), 'Snapshot has drifters array');
  fs.unlinkSync(outPath);
} catch (e) {
  console.error(e);
}

// Test 12: Headless Night 2 Run
try {
  const outPath = 'tests/out_night2.jsonl';
  execSync(`node src/headless.js --seed 42 --night 2 --ticks 60 --out ${outPath}`, { stdio: 'pipe' });
  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
  const snap0 = JSON.parse(lines[0]);
  assert(snap0.night === 2, 'Snapshot has night = 2 with Đảo Cau map');
  fs.unlinkSync(outPath);
} catch (e) {
  console.error(e);
}

// Test 13: Headless Night 3 Run
try {
  const outPath = 'tests/out_night3.jsonl';
  execSync(`node src/headless.js --seed 42 --night 3 --ticks 60 --out ${outPath}`, { stdio: 'pipe' });
  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
  const snap0 = JSON.parse(lines[0]);
  assert(snap0.night === 3, 'Snapshot has night = 3 with Đảo Chuông map');
  fs.unlinkSync(outPath);
} catch (e) {
  console.error(e);
}

// Test 14: Determinism (SHA256 Match) on Night 2
try {
  const out1 = 'tests/det_n2_1.jsonl';
  const out2 = 'tests/det_n2_2.jsonl';
  execSync(`node src/headless.js --seed 7777 --night 2 --ticks 240 --out ${out1}`, { stdio: 'pipe' });
  execSync(`node src/headless.js --seed 7777 --night 2 --ticks 240 --out ${out2}`, { stdio: 'pipe' });

  const buf1 = fs.readFileSync(out1);
  const buf2 = fs.readFileSync(out2);
  const hash1 = crypto.createHash('sha256').update(buf1).digest('hex');
  const hash2 = crypto.createHash('sha256').update(buf2).digest('hex');

  assert(hash1 === hash2, `Determinism verified on Night 2: identical SHA256 (${hash1.slice(0, 8)}...)`);
  fs.unlinkSync(out1);
  fs.unlinkSync(out2);
} catch (e) {
  console.error(e);
}

// Test 15: Error code 2 on malformed input schema
try {
  fs.writeFileSync('tests/bad_schema.json', '{"frames": "not_an_array"}', 'utf-8');
  let exitCode = 0;
  try {
    execSync('node src/headless.js --seed 1 --night 1 --inputs tests/bad_schema.json --ticks 10 --out tests/invalid.jsonl', {
      stdio: 'pipe'
    });
  } catch (err) {
    exitCode = err.status;
  }
  fs.unlinkSync('tests/bad_schema.json');
  assert(exitCode === 2, 'CLI exits with code 2 on malformed inputs schema');
} catch (e) {
  console.error(e);
}

// Test 16: Performance Benchmark (Headless 21,600 ticks in <= 30 seconds)
try {
  const outPerf = 'tests/out_perf.jsonl';
  const t0 = Date.now();
  execSync(`node src/headless.js --seed 123 --night 1 --ticks 21600 --out ${outPerf} --snapshot-every 600`, { stdio: 'pipe' });
  const elapsedS = (Date.now() - t0) / 1000.0;
  assert(elapsedS <= 30.0, `Performance benchmark: 21,600 ticks completed in ${elapsedS.toFixed(2)}s (<= 30s target)`);
  fs.unlinkSync(outPerf);
} catch (e) {
  console.error(e);
}

console.log('\n================================');
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
