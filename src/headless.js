#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { Simulation } from './core/simulation.js';
import { exportLeaderboardToFile } from './core/leaderboard.js';

// CLI support for --export-leaderboard
if (process.argv.includes('--export-leaderboard')) {
  const idx = process.argv.indexOf('--export-leaderboard');
  const outPath = process.argv[idx + 1] || 'leaderboard_export.json';
  exportLeaderboardToFile(outPath);
  console.log(`Leaderboard exported to ${outPath}`);
  process.exit(0);
}

function printUsageAndExit(msg = null, code = 1) {
  if (msg) console.error(`Error: ${msg}`);
  console.error(
    'Usage: node src/headless.js --seed <int> --night <1|2|3> [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]'
  );
  process.exit(code);
}

function parseArgs(args) {
  const options = {
    seed: 12345,
    night: 1,
    scenarioPath: null,
    inputsPath: null,
    ticks: null,
    outPath: null,
    snapshotEvery: 10
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--seed') {
      options.seed = parseInt(args[++i], 10);
      if (isNaN(options.seed)) printUsageAndExit('Invalid seed value', 1);
    } else if (arg === '--night') {
      options.night = parseInt(args[++i], 10);
      if (isNaN(options.night) || ![1, 2, 3].includes(options.night)) {
        printUsageAndExit('Invalid night value (must be 1, 2, or 3)', 1);
      }
    } else if (arg === '--scenario') {
      options.scenarioPath = args[++i];
    } else if (arg === '--inputs') {
      options.inputsPath = args[++i];
    } else if (arg === '--ticks') {
      options.ticks = parseInt(args[++i], 10);
      if (isNaN(options.ticks) || options.ticks < 0) printUsageAndExit('Invalid ticks value', 1);
    } else if (arg === '--out') {
      options.outPath = args[++i];
    } else if (arg === '--snapshot-every') {
      options.snapshotEvery = parseInt(args[++i], 10);
      if (isNaN(options.snapshotEvery) || options.snapshotEvery <= 0) {
        printUsageAndExit('Invalid snapshot-every value', 1);
      }
    }
  }

  if (options.ticks === null) {
    printUsageAndExit('Missing required argument --ticks', 1);
  }
  if (!options.outPath) {
    printUsageAndExit('Missing required argument --out', 1);
  }

  return options;
}

function loadJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse JSON from ${filePath}: ${err.message}`);
    process.exit(2);
  }
}

function validateInputs(inputsData) {
  if (!inputsData || typeof inputsData !== 'object') {
    console.error('Inputs file must be a JSON object');
    process.exit(2);
  }
  if (inputsData.frames !== undefined && !Array.isArray(inputsData.frames)) {
    console.error('Inputs "frames" must be an array');
    process.exit(2);
  }
  if (inputsData.frames) {
    let lastTick = -1;
    for (const frame of inputsData.frames) {
      if (typeof frame.tick !== 'number' || frame.tick < 0 || frame.tick <= lastTick) {
        console.error('Inputs frame tick must be strictly increasing and >= 0');
        process.exit(2);
      }
      lastTick = frame.tick;
    }
  }
}

function validateScenario(scenarioData) {
  if (!scenarioData || typeof scenarioData !== 'object') {
    console.error('Scenario file must be a JSON object');
    process.exit(2);
  }
  if (scenarioData.player && typeof scenarioData.player !== 'object') {
    console.error('Scenario "player" must be an object');
    process.exit(2);
  }
  if (scenarioData.motes && !Array.isArray(scenarioData.motes)) {
    console.error('Scenario "motes" must be an array');
    process.exit(2);
  }
  if (scenarioData.shades && !Array.isArray(scenarioData.shades)) {
    console.error('Scenario "shades" must be an array');
    process.exit(2);
  }
  if (scenarioData.drifters && !Array.isArray(scenarioData.drifters)) {
    console.error('Scenario "drifters" must be an array');
    process.exit(2);
  }
  if (scenarioData.charms && !Array.isArray(scenarioData.charms)) {
    console.error('Scenario "charms" must be an array');
    process.exit(2);
  }
  if (scenarioData.lanterns && !Array.isArray(scenarioData.lanterns)) {
    console.error('Scenario "lanterns" must be an array');
    process.exit(2);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  let scenario = null;
  if (options.scenarioPath) {
    scenario = loadJsonFile(options.scenarioPath);
    validateScenario(scenario);
  }

  let inputs = null;
  if (options.inputsPath) {
    inputs = loadJsonFile(options.inputsPath);
    validateInputs(inputs);
  }

  let tuning = null;
  const contractPath = path.resolve(process.cwd(), 'game.contract.json');
  if (fs.existsSync(contractPath)) {
    try {
      const contract = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
      if (contract.tuning) tuning = contract.tuning;
    } catch (e) {
      // fallback to default
    }
  }

  const sim = new Simulation({
    seed: options.seed,
    night: options.night,
    tuning: tuning,
    scenario: scenario
  });

  const outLines = [];

  // Snapshot at tick 0
  outLines.push(JSON.stringify(sim.getSnapshot()));

  // Map inputs by tick
  const inputFrames = new Map();
  if (inputs && inputs.frames) {
    for (const frame of inputs.frames) {
      inputFrames.set(frame.tick, frame);
    }
  }

  const targetTicks = options.ticks;
  for (let k = 0; k < targetTicks; k++) {
    if (inputFrames.has(k)) {
      sim.setInput(inputFrames.get(k));
    }

    const events = sim.step();

    for (const evt of events) {
      outLines.push(JSON.stringify(evt));
    }

    if (sim.tick % options.snapshotEvery === 0) {
      outLines.push(JSON.stringify(sim.getSnapshot()));
    }

    if (sim.state !== 'playing' && !sim.paused) {
      break;
    }
  }

  const endObj = {
    type: 'end',
    ticks: sim.tick,
    state: sim.state,
    score: sim.score
  };
  outLines.push(JSON.stringify(endObj));

  const outDir = path.dirname(options.outPath);
  if (outDir && outDir !== '.' && !fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(options.outPath, outLines.join('\n') + '\n', 'utf-8');
  process.exit(0);
}

main();
