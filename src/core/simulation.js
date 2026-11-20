import { PRNG } from './rng.js';
import { DEFAULT_TUNING, ISLAND_RADIUS } from './constants.js';

export function round3(val) {
  return Math.round(val * 1000) / 1000;
}

export function distXZ(p1, p2) {
  const dx = p1[0] - p2[0];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export class Simulation {
  constructor(options = {}) {
    this.seed = options.seed !== undefined ? options.seed : 12345;
    this.rng = new PRNG(this.seed);
    this.night = options.night || 1;
    this.tuning = JSON.parse(JSON.stringify(options.tuning || DEFAULT_TUNING));
    this.islandRadius = ISLAND_RADIUS;

    this.tick = 0;
    this.sim_tick = 0;
    this.state = 'playing'; // 'playing' | 'won' | 'lost'
    this.score = 0;
    this.time_left_s = this.tuning.night1_duration_s;

    this.player = {
      pos: [0.0, 0.0, 0.0],
      flames: this.tuning.flames,
      carried: 0,
      invuln_timer: 0.0,
      pulse_cooldown: 0.0
    };

    // Default 5 Lanterns arranged in a pentagram/circle at radius 25m
    this.lanterns = [
      { id: 'L1', pos: [0.0, 0.0, 25.0], lit: false, deposited: 0 },
      { id: 'L2', pos: [23.776, 0.0, 7.725], lit: false, deposited: 0 },
      { id: 'L3', pos: [14.695, 0.0, -20.225], lit: false, deposited: 0 },
      { id: 'L4', pos: [-14.695, 0.0, -20.225], lit: false, deposited: 0 },
      { id: 'L5', pos: [-23.776, 0.0, 7.725], lit: false, deposited: 0 }
    ];

    this.moteIdCounter = 1;
    this.shadeIdCounter = 1;
    this.motes = [];
    this.shades = [];

    this.random_motes = options.random_motes !== false;
    this.random_shades = options.random_shades !== false;

    // Apply scenario overrides if provided
    if (options.scenario) {
      this.applyScenario(options.scenario);
    } else {
      if (this.random_motes) {
        this.spawnInitialMotes(20);
      }
      if (this.random_shades) {
        this.spawnInitialShades(3);
      }
    }

    // Input state
    this.currentInput = {
      move: [0.0, 0.0],
      cam_yaw_deg: 0.0,
      jump: false,
      interact: false,
      pulse: false
    };
    this.prevButtons = {
      jump: false,
      interact: false,
      pulse: false
    };

    this.currentEvents = [];
  }

  spawnInitialMotes(count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = this.rng.range(0, Math.PI * 2);
      const r = this.rng.range(3, this.islandRadius - 3);
      const x = round3(Math.cos(angle) * r);
      const z = round3(Math.sin(angle) * r);
      this.motes.push({
        id: `M${this.moteIdCounter++}`,
        pos: [x, 0.0, z]
      });
    }
  }

  spawnInitialShades(count = 3) {
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + this.rng.range(-0.2, 0.2);
      const r = this.rng.range(18, this.islandRadius - 2);
      const x = round3(Math.cos(angle) * r);
      const z = round3(Math.sin(angle) * r);
      this.shades.push({
        id: `S${this.shadeIdCounter++}`,
        pos: [x, 0.0, z],
        state: 'chase',
        stun_timer: 0.0
      });
    }
  }

  applyScenario(scenario) {
    if (scenario.player) {
      if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
      if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
      if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
    }
    if (scenario.time_left_s !== undefined) {
      this.time_left_s = scenario.time_left_s;
    }
    if (scenario.random_motes !== undefined) {
      this.random_motes = scenario.random_motes;
    }
    if (scenario.random_shades !== undefined) {
      this.random_shades = scenario.random_shades;
    }

    if (scenario.lanterns && Array.isArray(scenario.lanterns)) {
      for (const lOverride of scenario.lanterns) {
        const target = this.lanterns.find(l => l.id === lOverride.id);
        if (target) {
          if (lOverride.pos) target.pos = [...lOverride.pos];
          if (lOverride.deposited !== undefined) target.deposited = lOverride.deposited;
          if (lOverride.lit !== undefined) target.lit = lOverride.lit;
        } else {
          this.lanterns.push({
            id: lOverride.id,
            pos: lOverride.pos ? [...lOverride.pos] : [0, 0, 0],
            lit: !!lOverride.lit,
            deposited: lOverride.deposited || 0
          });
        }
      }
    }

    if (scenario.motes !== undefined) {
      this.motes = [];
      for (let i = 0; i < scenario.motes.length; i++) {
        const m = scenario.motes[i];
        if (Array.isArray(m)) {
          this.motes.push({
            id: `M${this.moteIdCounter++}`,
            pos: [m[0], m[1] || 0.0, m[2]]
          });
        } else if (typeof m === 'object' && m.pos) {
          this.motes.push({
            id: m.id || `M${this.moteIdCounter++}`,
            pos: [...m.pos]
          });
        }
      }
    } else if (this.random_motes) {
      this.spawnInitialMotes(20);
    }

    if (scenario.shades !== undefined) {
      this.shades = [];
      for (let i = 0; i < scenario.shades.length; i++) {
        const s = scenario.shades[i];
        this.shades.push({
          id: s.id || `S${this.shadeIdCounter++}`,
          pos: [...s.pos],
          state: s.state || 'chase',
          stun_timer: s.stun_timer || 0.0
        });
      }
    } else if (this.random_shades) {
      this.spawnInitialShades(3);
    }
  }

  setInput(newInput) {
    if (!newInput) return;
    if (newInput.move !== undefined) {
      this.currentInput.move = [Number(newInput.move[0]) || 0, Number(newInput.move[1]) || 0];
    }
    if (newInput.cam_yaw_deg !== undefined) {
      this.currentInput.cam_yaw_deg = Number(newInput.cam_yaw_deg) || 0;
    }
    if (newInput.jump !== undefined) {
      this.currentInput.jump = !!newInput.jump;
    }
    if (newInput.interact !== undefined) {
      this.currentInput.interact = !!newInput.interact;
    }
    if (newInput.pulse !== undefined) {
      this.currentInput.pulse = !!newInput.pulse;
    }
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.sim_tick,
      state: this.state,
      time_left_s: Number(Math.max(0, this.time_left_s).toFixed(1)),
      score: this.score,
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        flames: this.player.flames,
        carried: this.player.carried
      },
      lanterns: this.lanterns.map(l => ({
        id: l.id,
        pos: [round3(l.pos[0]), round3(l.pos[1]), round3(l.pos[2])],
        lit: l.lit,
        deposited: l.deposited
      })),
      shades: this.shades.map(s => ({
        id: s.id,
        pos: [round3(s.pos[0]), round3(s.pos[1]), round3(s.pos[2])],
        state: s.state
      })),
      motes_active: this.motes.length
    };
  }

  /**
   * Run 1 step (1/60s)
   */
  step() {
    if (this.state !== 'playing') {
      this.tick++;
      return [];
    }

    const dt = 1.0 / 60.0;
    this.tick++;
    this.sim_tick++;
    this.currentEvents = [];

    // Update timers
    this.time_left_s = Math.max(0, this.time_left_s - dt);
    if (this.player.invuln_timer > 0) {
      this.player.invuln_timer = Math.max(0, this.player.invuln_timer - dt);
    }
    if (this.player.pulse_cooldown > 0) {
      this.player.pulse_cooldown = Math.max(0, this.player.pulse_cooldown - dt);
    }

    // 1. Process player movement
    let [mx, mz] = this.currentInput.move;
    let len = Math.sqrt(mx * mx + mz * mz);
    if (len > 1.0) {
      mx /= len;
      mz /= len;
    }

    if (len > 0.0001) {
      const theta = (this.currentInput.cam_yaw_deg * Math.PI) / 180.0;
      const xPrime = mx * Math.cos(theta) + mz * Math.sin(theta);
      const zPrime = -mx * Math.sin(theta) + mz * Math.cos(theta);

      const speed = this.tuning.player_speed;
      let newX = this.player.pos[0] + xPrime * speed * dt;
      let newZ = this.player.pos[2] + zPrime * speed * dt;

      // Island boundary check
      const distCenter = Math.sqrt(newX * newX + newZ * newZ);
      if (this.tuning.fall_enabled) {
        if (distCenter > this.islandRadius + 2.0) {
          // Player falls off island
          this.player.flames = Math.max(0, this.player.flames - 1);
          const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
          this.player.carried = Math.max(0, this.player.carried - dropped);
          this.player.pos = [0.0, 0.0, 0.0];
          this.currentEvents.push({
            type: 'event',
            tick: this.sim_tick,
            name: 'player_hit',
            data: { by: 'fall', flames: this.player.flames, dropped }
          });
          if (this.player.flames <= 0) {
            this.state = 'lost';
            this.currentEvents.push({
              type: 'event',
              tick: this.sim_tick,
              name: 'game_over',
              data: { result: 'lost', reason: 'no_flames' }
            });
            return this.currentEvents;
          }
        } else {
          this.player.pos[0] = newX;
          this.player.pos[2] = newZ;
        }
      } else {
        // Clamp to island boundary
        if (distCenter > this.islandRadius) {
          newX = (newX / distCenter) * this.islandRadius;
          newZ = (newZ / distCenter) * this.islandRadius;
        }
        this.player.pos[0] = newX;
        this.player.pos[2] = newZ;
      }
    }

    // 2. Rising edge button triggers
    const interactTriggered = this.currentInput.interact && !this.prevButtons.interact;
    const pulseTriggered = this.currentInput.pulse && !this.prevButtons.pulse;
    this.prevButtons.interact = this.currentInput.interact;
    this.prevButtons.pulse = this.currentInput.pulse;
    this.prevButtons.jump = this.currentInput.jump;

    // 3. Mote collection check
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const mote = this.motes[i];
      const dist = distXZ(this.player.pos, mote.pos);
      if (dist <= this.tuning.pickup_radius) {
        if (this.player.carried < this.tuning.carry_capacity) {
          this.motes.splice(i, 1);
          this.player.carried++;
          this.score += this.tuning.score.per_mote;
          this.currentEvents.push({
            type: 'event',
            tick: this.sim_tick,
            name: 'mote_picked',
            data: { carried: this.player.carried }
          });
        }
      }
    }

    // 4. Interact (Deposit into Lantern)
    if (interactTriggered) {
      let nearestLantern = null;
      let minDist = Infinity;
      for (const lantern of this.lanterns) {
        const d = distXZ(this.player.pos, lantern.pos);
        if (d <= this.tuning.interact_radius && d < minDist) {
          minDist = d;
          nearestLantern = lantern;
        }
      }

      if (nearestLantern && !nearestLantern.lit && this.player.carried > 0) {
        const needed = this.tuning.lantern_cost - nearestLantern.deposited;
        const amount = Math.min(this.player.carried, needed);
        if (amount > 0) {
          this.player.carried -= amount;
          nearestLantern.deposited += amount;
          this.currentEvents.push({
            type: 'event',
            tick: this.sim_tick,
            name: 'deposit',
            data: {
              lantern_id: nearestLantern.id,
              amount: amount,
              deposited: nearestLantern.deposited
            }
          });

          if (nearestLantern.deposited >= this.tuning.lantern_cost) {
            nearestLantern.lit = true;
            this.score += this.tuning.score.per_lantern;
            this.currentEvents.push({
              type: 'event',
              tick: this.sim_tick,
              name: 'lantern_lit',
              data: { lantern_id: nearestLantern.id }
            });

            // Check if all lanterns lit
            const allLit = this.lanterns.length > 0 && this.lanterns.every(l => l.lit);
            if (allLit) {
              this.state = 'won';
              // Calculate end bonus score
              const secondsBonus = Math.max(0, Math.floor(this.time_left_s)) * this.tuning.score.per_second_left;
              const flamesBonus = this.player.flames * this.tuning.score.per_flame_left;
              this.score += secondsBonus + flamesBonus;

              this.currentEvents.push({
                type: 'event',
                tick: this.sim_tick,
                name: 'game_over',
                data: { result: 'won', reason: 'all_lit' }
              });
              return this.currentEvents;
            }
          }
        }
      }
    }

    // 5. Pulse Skill
    if (pulseTriggered) {
      if (this.player.pulse_cooldown <= 0 && this.player.carried >= this.tuning.pulse_cost) {
        this.player.pulse_cooldown = this.tuning.pulse_cooldown_s;
        this.player.carried -= this.tuning.pulse_cost;

        const stunnedIds = [];
        for (const shade of this.shades) {
          const d = distXZ(this.player.pos, shade.pos);
          if (d <= this.tuning.pulse_radius) {
            shade.state = 'stunned';
            shade.stun_timer = this.tuning.pulse_stun_s;
            stunnedIds.push(shade.id);

            // Push shade away from player
            let pdx = shade.pos[0] - this.player.pos[0];
            let pdz = shade.pos[2] - this.player.pos[2];
            const pLen = Math.sqrt(pdx * pdx + pdz * pdz);
            if (pLen > 0.001) {
              pdx /= pLen;
              pdz /= pLen;
            } else {
              pdx = 1;
              pdz = 0;
            }
            shade.pos[0] += pdx * this.tuning.pulse_push_m;
            shade.pos[2] += pdz * this.tuning.pulse_push_m;

            this.score += this.tuning.score.per_stun;
          }
        }

        this.currentEvents.push({
          type: 'event',
          tick: this.sim_tick,
          name: 'pulse',
          data: { stunned_ids: stunnedIds }
        });
      }
    }

    // 6. Update Shades
    for (const shade of this.shades) {
      if (shade.state === 'stunned') {
        shade.stun_timer -= dt;
        if (shade.stun_timer <= 0) {
          shade.state = 'chase';
          shade.stun_timer = 0;
        }
      } else {
        // Shade chases player
        let sdx = this.player.pos[0] - shade.pos[0];
        let sdz = this.player.pos[2] - shade.pos[2];
        const sDist = Math.sqrt(sdx * sdx + sdz * sdz);

        if (sDist > 0.001) {
          sdx /= sDist;
          sdz /= sDist;
        }

        let nextX = shade.pos[0] + sdx * this.tuning.shade_speed * dt;
        let nextZ = shade.pos[2] + sdz * this.tuning.shade_speed * dt;

        // Check if next pos enters safe radius of any lit lantern
        let insideSafe = false;
        for (const lantern of this.lanterns) {
          if (lantern.lit) {
            const dLantern = distXZ([nextX, 0, nextZ], lantern.pos);
            if (dLantern < this.tuning.safe_radius) {
              insideSafe = true;
              break;
            }
          }
        }

        if (!insideSafe) {
          shade.pos[0] = nextX;
          shade.pos[2] = nextZ;
        }

        // Check hit player
        const hitDist = distXZ(this.player.pos, shade.pos);
        if (hitDist <= this.tuning.shade_hit_radius) {
          if (this.player.invuln_timer <= 0) {
            this.player.flames = Math.max(0, this.player.flames - 1);
            const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
            this.player.carried = Math.max(0, this.player.carried - dropped);
            this.player.invuln_timer = this.tuning.invuln_s;

            this.currentEvents.push({
              type: 'event',
              tick: this.sim_tick,
              name: 'player_hit',
              data: { by: 'shade', flames: this.player.flames, dropped }
            });

            if (this.player.flames <= 0) {
              this.state = 'lost';
              this.currentEvents.push({
                type: 'event',
                tick: this.sim_tick,
                name: 'game_over',
                data: { result: 'lost', reason: 'no_flames' }
              });
              return this.currentEvents;
            }
          }
        }
      }
    }

    // 7. Check Time Limit (Dawn)
    if (this.time_left_s <= 0 && this.state === 'playing') {
      this.state = 'lost';
      this.currentEvents.push({
        type: 'event',
        tick: this.sim_tick,
        name: 'game_over',
        data: { result: 'lost', reason: 'dawn' }
      });
    }

    return this.currentEvents;
  }
}
