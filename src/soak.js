#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { Simulation } from './core/simulation.js';
import { PRNG } from './core/rng.js';

function parseArgs(args) {
  const options = {
    seed: 7,
    nights: 10,
    outPath: 'soak.json'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--seed') {
      options.seed = parseInt(args[++i], 10);
    } else if (arg === '--nights') {
      options.nights = parseInt(args[++i], 10);
    } else if (arg === '--out') {
      options.outPath = args[++i];
    }
  }

  return options;
}

function getMemoryRssMb() {
  if (global.gc) {
    try { global.gc(); } catch (e) {}
  }
  return Math.round(process.memoryUsage().rss / (1024 * 1024));
}

function main() {
  // If not run with --expose-gc, respawn to ensure clean memory reset
  if (!global.gc) {
    const child = spawn(process.execPath, ['--expose-gc', ...process.argv.slice(1)], { stdio: 'inherit' });
    child.on('exit', code => process.exit(code || 0));
    return;
  }

  const options = parseArgs(process.argv.slice(2));
  console.log(`Starting Soak Test: seed=${options.seed}, nights=${options.nights}, out=${options.outPath}`);

  const startTime = Date.now();
  let crashes = 0;
  const results = [];
  let memStartMb = 0;

  const moveOptions = [-1, 0, 1];

  // Pre-warm engine configurations so code pages are compiled on load
  new Simulation({ seed: options.seed, night: 1 }).step();
  new Simulation({ seed: options.seed + 1, night: 2 }).step();
  new Simulation({ seed: options.seed + 2, night: 3 }).step();
  if (global.gc) {
    try { global.gc(); } catch (e) {}
  }

  for (let i = 0; i < options.nights; i++) {
    const nightIndex = (i % 3) + 1; // 1 -> 2 -> 3 -> 1 -> 2 ...
    const nightSeed = options.seed + i;
    const inputRng = new PRNG(nightSeed * 1000 + 13);

    let sim = null;
    try {
      sim = new Simulation({
        seed: nightSeed,
        night: nightIndex
      });

      const maxTicks = (nightIndex === 1 ? 240 : (nightIndex === 2 ? 270 : 300)) * 60;
      let currentMove = [0, 0];

      for (let t = 0; t < maxTicks; t++) {
        // Every 30 ticks, re-pick movement direction
        if (t % 30 === 0) {
          const mx = moveOptions[inputRng.int(0, 2)];
          const mz = moveOptions[inputRng.int(0, 2)];
          currentMove = [mx, mz];
        }

        const input = {
          move: currentMove,
          jump: inputRng.range(0, 1) < 0.05,
          dash: inputRng.range(0, 1) < 0.03,
          pulse: inputRng.range(0, 1) < 0.02,
          interact: inputRng.range(0, 1) < 0.10
        };

        sim.setInput(input);
        sim.step();

        if (sim.state !== 'playing' && !sim.paused) {
          break;
        }
      }

      results.push(sim.state === 'won' ? 'won' : 'lost');
    } catch (err) {
      console.error(`Crash on night ${i + 1} (seed ${nightSeed}):`, err);
      crashes++;
      results.push('crash');
    } finally {
      sim = null;
      if (global.gc) {
        try { global.gc(); } catch (e) {}
      }
      if (i === 0) {
        memStartMb = getMemoryRssMb();
      }
    }
  }

  const memEndMb = getMemoryRssMb();
  const durationS = Number(((Date.now() - startTime) / 1000.0).toFixed(1));

  const soakOutput = {
    nights: options.nights,
    crashes: crashes,
    results: results,
    mem_start_mb: memStartMb,
    mem_end_mb: memEndMb,
    duration_s: durationS
  };

  const outDir = path.dirname(options.outPath);
  if (outDir && outDir !== '.' && !fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(options.outPath, JSON.stringify(soakOutput, null, 2) + '\n', 'utf-8');
  console.log('Soak Test Completed:');
  console.log(JSON.stringify(soakOutput, null, 2));

  // Acceptance threshold: crashes = 0 and mem_end_mb <= 1.2 * mem_start_mb
  if (crashes > 0) {
    console.error('Soak test failed with crashes');
    process.exit(1);
  }

  if (memEndMb > 1.2 * memStartMb) {
    console.error(`Soak test memory growth exceeded 20%: start=${memStartMb}MB, end=${memEndMb}MB`);
    process.exit(1);
  }

  process.exit(0);
}

main();
