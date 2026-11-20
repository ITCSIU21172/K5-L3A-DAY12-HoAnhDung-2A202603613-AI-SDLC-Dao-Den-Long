import fs from 'fs';
import path from 'path';
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

console.log('=== RUNNING UNIT TESTS ===');

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

// Test 2: Mote pickup logic
try {
  const sim = new Simulation({
    seed: 101,
    random_motes: false,
    random_shades: false,
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      motes: [[0, 0, 1.0]],
      shades: [],
      lanterns: []
    }
  });
  const events = sim.step();
  assert(events.length === 1 && events[0].name === 'mote_picked', 'Mote picked up within pickup radius');
  assert(sim.player.carried === 1, 'Player carried count incremented');
  assert(sim.motes.length === 0, 'Mote removed from island');
} catch (e) {}

// Test 3: Deposit & Lantern Lighting
try {
  const sim = new Simulation({
    seed: 102,
    random_motes: false,
    random_shades: false,
    scenario: {
      player: { pos: [0, 0, 0], carried: 3, flames: 3 },
      motes: [],
      shades: [],
      lanterns: [{ id: 'L1', pos: [0, 0, 1.5], deposited: 0, lit: false }]
    }
  });
  sim.setInput({ interact: true });
  const events = sim.step();
  assert(events.some(e => e.name === 'deposit'), 'Deposit event emitted');
  assert(events.some(e => e.name === 'lantern_lit'), 'Lantern lit event emitted when cost reached');
  assert(sim.player.carried === 0, 'Carried motes depleted after deposit');
  assert(sim.lanterns.find(l => l.id === 'L1').lit === true, 'Lantern L1 is lit');
} catch (e) {}

// Test 4: Pulse Stun & Push
try {
  const sim = new Simulation({
    seed: 103,
    random_motes: false,
    random_shades: false,
    scenario: {
      player: { pos: [0, 0, 0], carried: 2, flames: 3 },
      motes: [],
      shades: [{ id: 'S1', pos: [3.0, 0, 0] }],
      lanterns: []
    }
  });
  sim.setInput({ pulse: true });
  const events = sim.step();
  assert(events.some(e => e.name === 'pulse'), 'Pulse event emitted');
  const shade = sim.shades[0];
  assert(shade.state === 'stunned', 'Shade enters stunned state');
  assert(shade.pos[0] > 3.0, 'Shade pushed back away from player');
  assert(sim.player.carried === 1, 'Pulse consumed 1 mote');
} catch (e) {}

// Test 5: Shade Hit Player
try {
  const sim = new Simulation({
    seed: 104,
    random_motes: false,
    random_shades: false,
    scenario: {
      player: { pos: [0, 0, 0], carried: 2, flames: 3 },
      motes: [],
      shades: [{ id: 'S1', pos: [0.5, 0, 0] }],
      lanterns: []
    }
  });
  const events = sim.step();
  assert(events.some(e => e.name === 'player_hit'), 'Player hit event emitted');
  assert(sim.player.flames === 2, 'Player lost 1 flame');
  assert(sim.player.carried === 1, 'Player dropped 50% of motes');
  assert(sim.player.invuln_timer > 0, 'Player gains invulnerability duration');
} catch (e) {}

// Test 6: Win Condition (All Lanterns Lit)
try {
  const sim = new Simulation({
    seed: 105,
    random_motes: false,
    random_shades: false,
    scenario: {
      player: { pos: [0, 0, 0], carried: 1, flames: 3 },
      motes: [],
      shades: [],
      lanterns: [
        { id: 'L1', lit: true, deposited: 3 },
        { id: 'L2', lit: true, deposited: 3 },
        { id: 'L3', lit: true, deposited: 3 },
        { id: 'L4', lit: true, deposited: 3 },
        { id: 'L5', pos: [0, 0, 1.0], lit: false, deposited: 2 }
      ],
      time_left_s: 150
    }
  });
  sim.setInput({ interact: true });
  const events = sim.step();
  assert(sim.state === 'won', 'Game state transitions to won');
  assert(events.some(e => e.name === 'game_over' && e.data.result === 'won'), 'Game over event emitted with result won');
} catch (e) {}

console.log('\n=== RUNNING HEADLESS CLI & CONTRACT TESTS ===');

// Test 7: CLI headless scenario pickup
try {
  const outPath = 'tests/out_pickup.jsonl';
  execSync(
    `node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_pickup.json --inputs tests/scenarios/inputs_pickup.json --ticks 25 --out ${outPath}`,
    { stdio: 'pipe' }
  );
  assert(fs.existsSync(outPath), 'CLI produced out_pickup.jsonl');
  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
  assert(lines.length > 0, 'Output contains JSONL lines');
  const hasPickup = lines.some(l => {
    try {
      const obj = JSON.parse(l);
      return obj.type === 'event' && obj.name === 'mote_picked';
    } catch (e) { return false; }
  });
  assert(hasPickup, 'Headless run detected mote_picked event');
  fs.unlinkSync(outPath);
} catch (e) {
  console.error(e);
}

// Test 8: CLI headless scenario deposit & win
try {
  const outPath = 'tests/out_win.jsonl';
  execSync(
    `node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_win.json --inputs tests/scenarios/inputs_win.json --ticks 10 --out ${outPath}`,
    { stdio: 'pipe' }
  );
  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
  const lastLine = JSON.parse(lines[lines.length - 1]);
  assert(lastLine.type === 'end' && lastLine.state === 'won', 'Headless run completed with end state won');
  fs.unlinkSync(outPath);
} catch (e) {
  console.error(e);
}

// Test 9: Determinism Verification (Byte-for-byte match)
try {
  const out1 = 'tests/det1.jsonl';
  const out2 = 'tests/det2.jsonl';
  execSync(`node src/headless.js --seed 98765 --night 1 --ticks 180 --out ${out1}`, { stdio: 'pipe' });
  execSync(`node src/headless.js --seed 98765 --night 1 --ticks 180 --out ${out2}`, { stdio: 'pipe' });

  const buf1 = fs.readFileSync(out1);
  const buf2 = fs.readFileSync(out2);

  const hash1 = crypto.createHash('sha256').update(buf1).digest('hex');
  const hash2 = crypto.createHash('sha256').update(buf2).digest('hex');

  assert(hash1 === hash2, `Determinism verified: identical SHA256 hashes (${hash1.slice(0, 8)}...)`);
  fs.unlinkSync(out1);
  fs.unlinkSync(out2);
} catch (e) {
  console.error(e);
}

// Test 10: Exit code 2 on invalid scenario
try {
  let exitCode = 0;
  try {
    execSync('node src/headless.js --seed 1 --night 1 --scenario package.json --ticks 10 --out tests/invalid.jsonl', {
      stdio: 'pipe'
    });
  } catch (err) {
    exitCode = err.status;
  }
  // If package.json doesn't match scenario schema, or malformed JSON
  // Let's create an invalid JSON file
  fs.writeFileSync('tests/bad_schema.json', '{"player": "not_an_object"}', 'utf-8');
  try {
    execSync('node src/headless.js --seed 1 --night 1 --scenario tests/bad_schema.json --ticks 10 --out tests/invalid.jsonl', {
      stdio: 'pipe'
    });
  } catch (err) {
    exitCode = err.status;
  }
  fs.unlinkSync('tests/bad_schema.json');
  assert(exitCode === 2, 'CLI exits with code 2 on malformed scenario/inputs schema');
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
