import { PRNG } from './rng.js';
import { DEFAULT_TUNING, getMapConfig } from './constants.js';

export function round3(val) {
  return Math.round(val * 1000) / 1000;
}

export function round1(val) {
  return Number(val.toFixed(1));
}

export function distXZ(p1, p2) {
  const dx = p1[0] - p2[0];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export function dist3D(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export class Simulation {
  constructor(options = {}) {
    this.seed = options.seed !== undefined ? options.seed : 12345;
    this.rng = new PRNG(this.seed);
    this.night = options.night || 1;
    this.tuning = JSON.parse(JSON.stringify(options.tuning || DEFAULT_TUNING));

    this.map = getMapConfig(this.night);

    this.tick = 0;
    this.sim_tick = 0;
    this.state = 'playing'; // 'playing' | 'won' | 'lost' | 'paused'
    this.paused = false;
    this.score = 0;
    this.time_left_s = this.map.duration_s;

    this.player = {
      pos: [0.0, 0.0, 0.0],
      vel: [0.0, 0.0, 0.0],
      flames: this.tuning.flames,
      carried: 0,
      grounded: true,
      invuln_timer: 0,
      dash_timer: 0,
      dash_cd: 0,
      pulse_cd: 0,
      charm_timer: 0,
      facing_yaw: 0.0,
      dash_dir: [0.0, 1.0],
      in_pad_flight: false,
      fall_respawn_timer: 0,
      successful_lights: 0
    };

    this.wind = {
      active: false,
      dir_deg: 0.0,
      timer: 0,
      cycle: 0
    };

    // Deep copy lanterns and initialize fuel_ticks (60 ticks = 1.0 fuel unit)
    this.lanterns = this.map.lanterns.map(l => ({
      id: l.id,
      pos: [...l.pos],
      lit: !!l.lit,
      deposited: l.deposited || 0,
      fuel_ticks: l.lit ? 6000 : 0,
      ever_lit: !!l.ever_lit,
      relit_count: l.relit_count || 0
    }));

    this.charms = JSON.parse(JSON.stringify(this.map.charms));
    this.jumpPads = JSON.parse(JSON.stringify(this.map.jumpPads));

    this.moteIdCounter = 1;
    this.shadeIdCounter = 1;
    this.drifterIdCounter = 1;

    this.motes = [];
    this.shades = [];
    this.drifters = [];

    this.random_motes = options.random_motes !== false;
    this.random_shades = options.random_shades !== false;
    this.random_drifters = options.random_drifters !== false;
    this.wind_enabled = options.wind_enabled !== undefined ? options.wind_enabled : this.map.windEnabled;

    if (options.scenario) {
      this.applyScenario(options.scenario);
    } else {
      if (this.random_motes) {
        this.spawnInitialMotes();
      }
    }

    this.currentInput = {
      move: [0.0, 0.0],
      cam_yaw_deg: 0.0,
      jump: false,
      interact: false,
      pulse: false,
      dash: false,
      pause: false
    };

    this.prevButtons = {
      jump: false,
      interact: false,
      pulse: false,
      dash: false,
      pause: false
    };

    this.currentEvents = [];
  }

  getCapacity() {
    return Math.min(this.tuning.capacity_max, this.tuning.carry_capacity + 2 * this.player.successful_lights);
  }

  spawnInitialMotes() {
    const points = this.map.motePoints;
    const indices = [];
    for (let i = 0; i < points.length; i++) indices.push(i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = this.rng.int(0, i);
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const initialCount = Math.min(20, points.length);
    for (let i = 0; i < initialCount; i++) {
      const pt = points[indices[i]];
      this.motes.push({
        id: `M${this.moteIdCounter++}`,
        pos: [round3(pt[0]), round3(pt[1]), round3(pt[2])],
        kind: 'random',
        ttl_ticks: null
      });
    }
  }

  applyScenario(scenario) {
    if (scenario.player) {
      if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
      if (scenario.player.vel) this.player.vel = [...scenario.player.vel];
      if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
      if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
      if (scenario.player.grounded !== undefined) this.player.grounded = !!scenario.player.grounded;
      if (scenario.player.invuln_ticks !== undefined) this.player.invuln_timer = scenario.player.invuln_ticks;
      if (scenario.player.dash_cd_ticks !== undefined) this.player.dash_cd = scenario.player.dash_cd_ticks;
      if (scenario.player.pulse_cd_ticks !== undefined) this.player.pulse_cd = scenario.player.pulse_cd_ticks;
      if (scenario.player.charm_ticks !== undefined) this.player.charm_timer = scenario.player.charm_ticks;
      if (scenario.player.successful_lights !== undefined) this.player.successful_lights = scenario.player.successful_lights;
    }

    if (scenario.time_left_s !== undefined) {
      this.time_left_s = scenario.time_left_s;
    }
    if (scenario.random_motes !== undefined) this.random_motes = scenario.random_motes;
    if (scenario.random_shades !== undefined) this.random_shades = scenario.random_shades;
    if (scenario.random_drifters !== undefined) this.random_drifters = scenario.random_drifters;
    if (scenario.wind_enabled !== undefined) this.wind_enabled = scenario.wind_enabled;

    if (scenario.lanterns && Array.isArray(scenario.lanterns)) {
      for (const lOverride of scenario.lanterns) {
        let target = this.lanterns.find(l => l.id === lOverride.id);
        if (!target) {
          target = {
            id: lOverride.id,
            pos: lOverride.pos ? [...lOverride.pos] : [0, 0, 0],
            lit: false,
            deposited: 0,
            fuel_ticks: 0,
            ever_lit: false,
            relit_count: 0
          };
          this.lanterns.push(target);
        }
        if (lOverride.pos) target.pos = [...lOverride.pos];
        if (lOverride.deposited !== undefined) target.deposited = lOverride.deposited;
        if (lOverride.ever_lit !== undefined) target.ever_lit = lOverride.ever_lit;
        if (lOverride.relit_count !== undefined) target.relit_count = lOverride.relit_count;

        if (lOverride.lit !== undefined) target.lit = lOverride.lit;

        if (lOverride.fuel !== undefined) {
          target.fuel_ticks = Math.round(lOverride.fuel * 60);
          if (target.fuel_ticks > 0) target.lit = true;
        } else if (target.lit && target.fuel_ticks === 0) {
          target.fuel_ticks = 6000;
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
            pos: [m[0], m[1] || 0.0, m[2]],
            kind: 'random',
            ttl_ticks: null
          });
        } else if (typeof m === 'object' && m.pos) {
          this.motes.push({
            id: m.id || `M${this.moteIdCounter++}`,
            pos: [...m.pos],
            kind: m.kind || 'random',
            ttl_ticks: m.ttl_ticks || null
          });
        }
      }
    } else if (this.random_motes) {
      this.spawnInitialMotes();
    }

    if (scenario.shades !== undefined) {
      this.shades = [];
      for (let i = 0; i < scenario.shades.length; i++) {
        const s = scenario.shades[i];
        this.shades.push({
          id: s.id || `S${this.shadeIdCounter++}`,
          pos: [...s.pos],
          state: s.state || 'chase',
          state_ticks_left: s.state_ticks_left !== undefined ? s.state_ticks_left : 0,
          target_lantern_id: s.target_lantern_id || null,
          drain_ticks: 0,
          push_vec: [0, 0],
          push_ticks_left: 0,
          recoil_vec: [0, 0],
          recoil_ticks_left: 0
        });
      }
    }

    if (scenario.drifters !== undefined) {
      this.drifters = [];
      for (let i = 0; i < scenario.drifters.length; i++) {
        const d = scenario.drifters[i];
        this.drifters.push({
          id: d.id || `D${this.drifterIdCounter++}`,
          pos: [...d.pos],
          state: d.state || 'idle',
          stolen: d.stolen || 0,
          flee_timer: d.flee_timer || 0,
          drop_die_timer: d.drop_die_timer || 0
        });
      }
    }

    if (scenario.charms !== undefined) {
      this.charms = JSON.parse(JSON.stringify(scenario.charms));
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
    if (newInput.dash !== undefined) {
      this.currentInput.dash = !!newInput.dash;
    }
    if (newInput.pause !== undefined) {
      this.currentInput.pause = !!newInput.pause;
    }
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.sim_tick,
      state: this.paused ? 'paused' : this.state,
      night: this.night,
      time_left_s: Number(Math.max(0, this.time_left_s).toFixed(1)),
      score: this.score,
      wind: {
        active: this.wind.active,
        dir_deg: round3(this.wind.dir_deg)
      },
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        vel: [round3(this.player.vel[0]), round3(this.player.vel[1]), round3(this.player.vel[2])],
        flames: this.player.flames,
        carried: this.player.carried,
        capacity: this.getCapacity(),
        grounded: this.player.grounded,
        invuln: this.player.invuln_timer > 0 || this.player.fall_respawn_timer > 0,
        dash_cd_s: Number(Math.max(0, this.player.dash_cd / 60.0).toFixed(1)),
        pulse_cd_s: Number(Math.max(0, this.player.pulse_cd / 60.0).toFixed(1)),
        charm_s: Number(Math.max(0, this.player.charm_timer / 60.0).toFixed(1))
      },
      lanterns: this.lanterns.map(l => ({
        id: l.id,
        pos: [round3(l.pos[0]), round3(l.pos[1]), round3(l.pos[2])],
        lit: l.lit,
        deposited: l.deposited,
        fuel: l.lit ? round1(l.fuel_ticks / 60.0) : 0.0,
        ever_lit: l.ever_lit,
        relit_count: l.relit_count
      })),
      shades: this.shades.map(s => ({
        id: s.id,
        pos: [round3(s.pos[0]), round3(s.pos[1]), round3(s.pos[2])],
        state: s.state
      })),
      drifters: this.drifters.map(d => ({
        id: d.id,
        pos: [round3(d.pos[0]), round3(d.pos[1]), round3(d.pos[2])],
        state: d.state,
        stolen: d.stolen
      })),
      charms: this.charms.map(c => ({
        id: c.id,
        available: c.available,
        respawn_s: Number(Math.max(0, c.respawn_timer / 60.0).toFixed(1))
      })),
      motes: this.motes.map(m => ({
        id: m.id,
        pos: [round3(m.pos[0]), round3(m.pos[1]), round3(m.pos[2])],
        kind: m.kind,
        ttl_s: m.ttl_ticks !== null ? Number(Math.max(0, m.ttl_ticks / 60.0).toFixed(1)) : null
      })),
      motes_active: this.motes.length
    };
  }

  getGroundHeight(x, z) {
    if (this.night === 1) {
      const r = Math.sqrt(x * x + z * z);
      return r <= 40.0 ? 0.0 : -100.0;
    }
    if (this.night === 2) {
      const rA = Math.sqrt(x * x + z * z);
      if (rA <= 28.0) return 0.0;
      const rB = Math.sqrt((x - 70.0) * (x - 70.0) + z * z);
      if (rB <= 28.0) return 0.0;
      if (x >= 26.0 && x <= 44.0 && z >= -2.0 && z <= 2.0) return 0.0;
      return -100.0;
    }
    if (this.night === 3) {
      const r = Math.sqrt(x * x + z * z);
      if (r > 45.0) return -100.0;
      if (r <= 8.0) return 6.0;
      if (r >= 12.0 && r <= 24.0 && z > 0) return 3.0;

      const angleDeg = (Math.atan2(z, x) * 180) / Math.PI;
      const normalizedAngle = (angleDeg + 360) % 360;
      const isRamp1 = Math.abs(normalizedAngle - 30) <= 3.5;
      const isRamp2 = Math.abs(normalizedAngle - 150) <= 3.5;
      if ((isRamp1 || isRamp2) && r >= 24.0 && r <= 30.0) {
        return ((30.0 - r) / 6.0) * 3.0;
      }
      return 0.0;
    }
    return 0.0;
  }

  step() {
    this.currentEvents = [];

    // Step 1: Read input & handle pause
    const pauseTriggered = this.currentInput.pause && !this.prevButtons.pause;
    this.prevButtons.pause = this.currentInput.pause;

    if (pauseTriggered) {
      this.paused = !this.paused;
      this.currentEvents.push({
        type: 'event',
        tick: this.tick + 1,
        name: this.paused ? 'paused' : 'resumed',
        data: {}
      });
    }

    if (this.paused) {
      this.tick++;
      return this.currentEvents;
    }

    if (this.state !== 'playing') {
      this.tick++;
      return this.currentEvents;
    }

    const dt = 1.0 / 60.0;
    this.tick++;
    this.sim_tick++;

    if (this.sim_tick === 1) {
      this.currentEvents.push({
        type: 'event',
        tick: this.sim_tick,
        name: 'night_start',
        data: { night: this.night }
      });
    }

    // Step 2: Decrement counters & Fuel reduction
    this.time_left_s = Math.max(0, this.time_left_s - dt);
    if (this.player.invuln_timer > 0) this.player.invuln_timer--;
    if (this.player.dash_cd > 0) this.player.dash_cd--;
    if (this.player.pulse_cd > 0) this.player.pulse_cd--;
    if (this.player.charm_timer > 0) this.player.charm_timer--;

    for (const c of this.charms) {
      if (!c.available) {
        c.respawn_timer--;
        if (c.respawn_timer <= 0) {
          c.available = true;
          c.respawn_timer = 0;
        }
      }
    }

    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      if (m.ttl_ticks !== null) {
        m.ttl_ticks--;
        if (m.ttl_ticks <= 0) {
          this.motes.splice(i, 1);
        }
      }
    }

    // Phase 3 Fuel Decay & Shade Drain
    for (const l of this.lanterns) {
      if (l.lit) {
        // Natural decay: 1.0/s = 1 tick per tick
        l.fuel_ticks -= 1;

        // Count shades draining this lantern
        for (const s of this.shades) {
          if (s.state === 'drain' && s.target_lantern_id === l.id) {
            // Drain 5.0/s = 5 ticks per tick
            l.fuel_ticks -= 5;
            s.drain_ticks = (s.drain_ticks || 0) + 1;
            // Record fuel_drain event every 60 ticks while draining
            if (s.drain_ticks % 60 === 0) {
              this.currentEvents.push({
                type: 'event',
                tick: this.sim_tick,
                name: 'fuel_drain',
                data: {
                  lantern_id: l.id,
                  shade_id: s.id,
                  fuel: round1(Math.max(0, l.fuel_ticks) / 60.0)
                }
              });
            }
          }
        }

        // Extinguish if fuel depleted
        if (l.fuel_ticks <= 0) {
          l.fuel_ticks = 0;
          l.lit = false;
          l.deposited = 0;
          l.ever_lit = true;
          this.currentEvents.push({
            type: 'event',
            tick: this.sim_tick,
            name: 'lantern_out',
            data: { lantern_id: l.id }
          });
        }
      }
    }

    // Handle fall respawn wait timer
    if (this.player.fall_respawn_timer > 0) {
      this.player.fall_respawn_timer--;
      if (this.player.fall_respawn_timer === 0) {
        this.player.pos = [0.0, 0.0, 0.0];
        this.player.vel = [0.0, 0.0, 0.0];
        this.player.grounded = true;
        this.player.invuln_timer = 90;
      }
      return this.currentEvents;
    }

    // Wind updates (Night 3)
    if (this.wind_enabled) {
      this.wind.cycle++;
      if (this.wind.cycle % 1800 === 0) {
        this.wind.active = true;
        this.wind.timer = 300;
        this.wind.dir_deg = this.rng.range(0, 360);
      }
      if (this.wind.active) {
        this.wind.timer--;
        if (this.wind.timer <= 0) {
          this.wind.active = false;
        }
      }
    }

    // Step 3: Move Player
    const dashTriggered = this.currentInput.dash && !this.prevButtons.dash;
    const jumpTriggered = this.currentInput.jump && !this.prevButtons.jump;
    const interactTriggered = this.currentInput.interact && !this.prevButtons.interact;
    const pulseTriggered = this.currentInput.pulse && !this.prevButtons.pulse;

    this.prevButtons.dash = this.currentInput.dash;
    this.prevButtons.jump = this.currentInput.jump;
    this.prevButtons.interact = this.currentInput.interact;
    this.prevButtons.pulse = this.currentInput.pulse;

    let [mx, mz] = this.currentInput.move;
    let len = Math.sqrt(mx * mx + mz * mz);
    let moveDirWorld = [0, 0];

    if (len > 0.001) {
      if (len > 1.0) {
        mx /= len;
        mz /= len;
      }
      const theta = (this.currentInput.cam_yaw_deg * Math.PI) / 180.0;
      moveDirWorld = [
        mx * Math.cos(theta) + mz * Math.sin(theta),
        -mx * Math.sin(theta) + mz * Math.cos(theta)
      ];
      this.player.facing_yaw = (Math.atan2(moveDirWorld[0], moveDirWorld[1]) * 180) / Math.PI;
    } else {
      const fRad = (this.player.facing_yaw * Math.PI) / 180.0;
      moveDirWorld = [Math.sin(fRad), Math.cos(fRad)];
    }

    // Dash initiation
    if (dashTriggered && this.player.dash_timer === 0) {
      const cdZero = this.player.charm_timer > 0;
      if (this.player.dash_cd === 0 || cdZero) {
        this.player.dash_timer = 12;
        this.player.dash_cd = cdZero ? 0 : 90;
        this.player.dash_dir = [...moveDirWorld];
        this.currentEvents.push({
          type: 'event',
          tick: this.sim_tick,
          name: 'dash',
          data: {}
        });
      }
    }

    // Jump initiation
    if (jumpTriggered && this.player.grounded && this.player.dash_timer === 0 && !this.player.in_pad_flight) {
      this.player.vel[1] = this.tuning.jump_velocity;
      this.player.grounded = false;
    }

    // Apply movement physics
    const currentSpeed = this.player.charm_timer > 0 ? this.tuning.charm_speed : this.tuning.player_speed;

    if (this.player.dash_timer > 0) {
      this.player.dash_timer--;
      this.player.pos[0] += this.player.dash_dir[0] * this.tuning.dash_speed * dt;
      this.player.pos[2] += this.player.dash_dir[1] * this.tuning.dash_speed * dt;
      this.player.vel[0] = this.player.dash_dir[0] * this.tuning.dash_speed;
      this.player.vel[2] = this.player.dash_dir[1] * this.tuning.dash_speed;
      this.player.vel[1] = 0.0;
    } else if (this.player.in_pad_flight) {
      this.player.pos[0] += this.player.vel[0] * dt;
      this.player.pos[2] += this.player.vel[2] * dt;
      this.player.vel[1] += this.tuning.gravity * dt;
      this.player.pos[1] += this.player.vel[1] * dt;
    } else {
      let targetVx = moveDirWorld[0] * currentSpeed * (len > 0.001 ? 1 : 0);
      let targetVz = moveDirWorld[1] * currentSpeed * (len > 0.001 ? 1 : 0);

      if (this.wind.active) {
        const wRad = (this.wind.dir_deg * Math.PI) / 180;
        targetVx += Math.cos(wRad) * 2.0;
        targetVz += Math.sin(wRad) * 2.0;
      }

      this.player.vel[0] = targetVx;
      this.player.vel[2] = targetVz;

      this.player.pos[0] += this.player.vel[0] * dt;
      this.player.pos[2] += this.player.vel[2] * dt;

      if (!this.player.grounded) {
        this.player.vel[1] += this.tuning.gravity * dt;
        this.player.pos[1] += this.player.vel[1] * dt;
      }
    }

    // Ground check
    const groundY = this.getGroundHeight(this.player.pos[0], this.player.pos[2]);
    if (this.player.pos[1] <= groundY && groundY > -50.0) {
      this.player.pos[1] = groundY;
      this.player.vel[1] = 0.0;
      this.player.grounded = true;
      this.player.in_pad_flight = false;
    } else if (groundY > -50.0 && this.player.pos[1] > groundY) {
      this.player.grounded = false;
    }

    // Jump Pads
    for (const pad of this.jumpPads) {
      const d = distXZ(this.player.pos, pad.pos);
      if (d <= pad.radius && Math.abs(this.player.pos[1] - pad.pos[1]) <= 0.6) {
        this.player.vel[1] = pad.vy;
        this.player.in_pad_flight = true;
        this.player.grounded = false;

        let dirX, dirZ;
        if (pad.dir) {
          dirX = pad.dir[0];
          dirZ = pad.dir[1];
        } else {
          dirX = pad.target[0] - pad.pos[0];
          dirZ = pad.target[2] - pad.pos[2];
          const distT = Math.sqrt(dirX * dirX + dirZ * dirZ);
          dirX /= distT;
          dirZ /= distT;
        }
        this.player.vel[0] = dirX * pad.speedHoriz;
        this.player.vel[2] = dirZ * pad.speedHoriz;
        break;
      }
    }

    // Fall check (Y < -10)
    if (this.player.pos[1] < -10.0) {
      this.player.flames = Math.max(0, this.player.flames - 1);
      const dropped = this.player.carried;
      this.player.carried = 0;
      this.player.fall_respawn_timer = this.tuning.fall_respawn_ticks;
      this.player.pos[1] = -100.0;

      this.currentEvents.push({
        type: 'event',
        tick: this.sim_tick,
        name: 'player_hit',
        data: { by: 'fall', flames: this.player.flames, dropped, lost: dropped }
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

    // Step 4: Pick up motes and charms
    if (this.player.fall_respawn_timer === 0) {
      const capacity = this.getCapacity();
      for (let i = this.motes.length - 1; i >= 0; i--) {
        const m = this.motes[i];
        if (m.spawn_tick === this.sim_tick) continue;

        const dXZ = distXZ(this.player.pos, m.pos);
        const dY = Math.abs(this.player.pos[1] - m.pos[1]);
        if (dXZ <= this.tuning.pickup_radius && dY <= this.tuning.pickup_height) {
          if (this.player.carried < capacity) {
            this.motes.splice(i, 1);
            this.player.carried++;
            this.currentEvents.push({
              type: 'event',
              tick: this.sim_tick,
              name: 'mote_picked',
              data: { carried: this.player.carried }
            });
          }
        }
      }

      for (const c of this.charms) {
        if (c.available) {
          const dXZ = distXZ(this.player.pos, c.pos);
          const dY = Math.abs(this.player.pos[1] - c.pos[1]);
          if (dXZ <= 1.0 && dY <= 1.5) {
            c.available = false;
            c.respawn_timer = this.tuning.charm_respawn_ticks;
            this.player.charm_timer = this.tuning.charm_duration_ticks;
            this.currentEvents.push({
              type: 'event',
              tick: this.sim_tick,
              name: 'charm_picked',
              data: { charm_id: c.id, charm_ticks: this.tuning.charm_duration_ticks }
            });
          }
        }
      }
    }

    // Step 5: Interact with Lanterns (Light / Relight / Refuel)
    if (interactTriggered && this.player.fall_respawn_timer === 0) {
      // Find candidate lanterns: unlit OR (lit but fuel < 100)
      let candidate = null;
      let minDist = Infinity;
      for (const l of this.lanterns) {
        const canReceive = !l.lit || (l.lit && l.fuel_ticks < 6000);
        if (canReceive) {
          const d = distXZ(this.player.pos, l.pos);
          if (d <= this.tuning.interact_radius) {
            if (d < minDist || (Math.abs(d - minDist) < 0.001 && l.id < candidate.id)) {
              minDist = d;
              candidate = l;
            }
          }
        }
      }

      if (candidate && this.player.carried > 0) {
        if (!candidate.lit) {
          // Lighting (First time or Relight)
          const cost = candidate.ever_lit ? this.tuning.relight_cost : this.tuning.lantern_cost;
          const needed = cost - candidate.deposited;
          const amount = Math.min(this.player.carried, needed);
          if (amount > 0) {
            this.player.carried -= amount;
            candidate.deposited += amount;
            this.score += amount * this.tuning.score.per_mote;

            this.currentEvents.push({
              type: 'event',
              tick: this.sim_tick,
              name: 'deposit',
              data: {
                lantern_id: candidate.id,
                amount: amount,
                deposited: candidate.deposited
              }
            });

            if (candidate.deposited >= cost) {
              candidate.lit = true;
              candidate.fuel_ticks = 6000; // 100 fuel
              this.player.successful_lights++;
              const isRelight = candidate.ever_lit;
              candidate.ever_lit = true;
              if (isRelight) {
                candidate.relit_count++;
                this.score += this.tuning.score.per_lantern_relight;
              } else {
                this.score += this.tuning.score.per_lantern_first;
              }

              this.currentEvents.push({
                type: 'event',
                tick: this.sim_tick,
                name: 'lantern_lit',
                data: { lantern_id: candidate.id, relight: isRelight }
              });

              // Push shades out of safe zone (6m)
              for (const s of this.shades) {
                const d = distXZ(s.pos, candidate.pos);
                if (d < this.tuning.safe_radius) {
                  let dx = s.pos[0] - candidate.pos[0];
                  let dz = s.pos[2] - candidate.pos[2];
                  const dLen = Math.sqrt(dx * dx + dz * dz);
                  const dirX = dLen > 0.001 ? dx / dLen : 1;
                  const dirZ = dLen > 0.001 ? dz / dLen : 0;
                  s.push_vec = [dirX * (this.tuning.safe_radius - d) / 30.0, dirZ * (this.tuning.safe_radius - d) / 30.0];
                  s.push_ticks_left = 30;
                  s.safe_pushing = true;
                }
              }
            }
          }
        } else {
          // Refueling an already lit lantern
          const currentFuel = candidate.fuel_ticks / 60.0;
          const neededMotes = Math.ceil((100.0 - currentFuel) / this.tuning.fuel_per_mote);
          const used = Math.min(this.player.carried, neededMotes);
          if (used > 0) {
            this.player.carried -= used;
            const newFuel = Math.min(100.0, currentFuel + used * this.tuning.fuel_per_mote);
            candidate.fuel_ticks = Math.round(newFuel * 60);
            this.score += used * this.tuning.score.per_mote;

            this.currentEvents.push({
              type: 'event',
              tick: this.sim_tick,
              name: 'refuel',
              data: {
                lantern_id: candidate.id,
                amount: used,
                fuel: round1(newFuel)
              }
            });

            // If fuel restored to >= 30, safe zone restored!
            if (newFuel >= this.tuning.low_fuel_threshold) {
              for (const s of this.shades) {
                const d = distXZ(s.pos, candidate.pos);
                if (d < this.tuning.safe_radius) {
                  let dx = s.pos[0] - candidate.pos[0];
                  let dz = s.pos[2] - candidate.pos[2];
                  const dLen = Math.sqrt(dx * dx + dz * dz);
                  const dirX = dLen > 0.001 ? dx / dLen : 1;
                  const dirZ = dLen > 0.001 ? dz / dLen : 0;
                  s.push_vec = [dirX * (this.tuning.safe_radius - d) / 30.0, dirZ * (this.tuning.safe_radius - d) / 30.0];
                  s.push_ticks_left = 30;
                  s.safe_pushing = true;
                }
              }
            }
          }
        }
      }
    }

    // Step 6: Update safe zones (handle ongoing safe push)
    for (const s of this.shades) {
      if (s.push_ticks_left > 0) {
        s.pos[0] += s.push_vec[0];
        s.pos[2] += s.push_vec[1];
        s.push_ticks_left--;
        if (s.push_ticks_left === 0) s.safe_pushing = false;
      }
    }

    // Step 7: Pulse (Tỏa Sáng)
    if (pulseTriggered && this.player.fall_respawn_timer === 0) {
      if (this.player.pulse_cd === 0 && this.player.carried >= this.tuning.pulse_cost) {
        this.player.pulse_cd = 180;
        this.player.carried -= this.tuning.pulse_cost;

        const pulseCenter = [this.player.pos[0], this.player.pos[1] + 0.8, this.player.pos[2]];
        const stunnedIds = [];

        for (const s of this.shades) {
          const shadeCenter = [s.pos[0], s.pos[1] + 0.8, s.pos[2]];
          const d3 = dist3D(pulseCenter, shadeCenter);
          if (d3 <= this.tuning.pulse_radius) {
            const wasDraining = s.state === 'drain';
            s.state = 'stunned';
            s.state_ticks_left = 120;
            stunnedIds.push(s.id);

            // Phase 3 Score: +15 if draining immediately before pulse, +5 otherwise
            this.score += wasDraining ? this.tuning.score.per_drain_stun : this.tuning.score.per_stun;

            // Push back 4m horizontally over 15 ticks
            let dx = s.pos[0] - this.player.pos[0];
            let dz = s.pos[2] - this.player.pos[2];
            let dLen = Math.sqrt(dx * dx + dz * dz);
            if (dLen < 0.001) {
              dx = 1;
              dz = 0;
              dLen = 1;
            }
            s.push_vec = [(dx / dLen) * (4.0 / 15.0), (dz / dLen) * (4.0 / 15.0)];
            s.push_ticks_left = 15;
          }
        }

        for (const d of this.drifters) {
          const dCenter = [d.pos[0], d.pos[1] + 0.8, d.pos[2]];
          const d3 = dist3D(pulseCenter, dCenter);
          if (d3 <= this.tuning.pulse_radius) {
            if (d.state === 'chase') {
              d.state = 'flee';
              d.flee_timer = 240;
            } else if (d.state === 'flee' && d.stolen > 0) {
              const droppedCount = d.stolen;
              for (let i = 0; i < droppedCount; i++) {
                this.motes.push({
                  id: `M${this.moteIdCounter++}`,
                  pos: [round3(d.pos[0]), round3(d.pos[1]), round3(d.pos[2])],
                  kind: 'dropped',
                  ttl_ticks: this.tuning.dropped_mote_ttl_ticks,
                  spawn_tick: this.sim_tick
                });
              }
              this.currentEvents.push({
                type: 'event',
                tick: this.sim_tick,
                name: 'drifter_drop',
                data: { drifter_id: d.id, amount: droppedCount }
              });
              d.stolen = 0;
              d.drop_die_timer = 120;
            }
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

    // Step 8: Move Shades & Drifters
    const shadeSpeed = this.night === 3 ? this.tuning.shade_speed_night3 : this.tuning.shade_speed;

    for (const s of this.shades) {
      if (s.state === 'stunned') {
        s.state_ticks_left--;
        if (s.state_ticks_left <= 0) {
          s.state = 'wander'; // Returns to wander after stunned
        }
      } else if (s.state === 'recoil') {
        s.recoil_ticks_left--;
        s.pos[0] += s.recoil_vec[0];
        s.pos[2] += s.recoil_vec[1];
        if (s.recoil_ticks_left <= 0) {
          s.state = 'chase';
        }
      } else if (s.state === 'drain') {
        // Drain state
        const targetLantern = this.lanterns.find(l => l.id === s.target_lantern_id);
        const distL = targetLantern ? distXZ(s.pos, targetLantern.pos) : 999;
        const dToPlayer = distXZ(s.pos, this.player.pos);

        if (dToPlayer <= 6.0) {
          // Player within 6m -> switches to chase
          s.state = 'chase';
          s.target_lantern_id = null;
        } else if (!targetLantern || !targetLantern.lit || (targetLantern.fuel_ticks / 60.0) >= this.tuning.low_fuel_threshold || distL > 2.0) {
          s.state = 'wander';
          s.target_lantern_id = null;
        }
        // Stands still while in drain
      } else {
        // State is wander or chase
        const dToPlayer = distXZ(s.pos, this.player.pos);
        if (s.state === 'wander' && dToPlayer <= this.tuning.shade_detect_radius) {
          s.state = 'chase';
        } else if (s.state === 'chase' && dToPlayer > this.tuning.shade_lose_radius) {
          s.state = 'wander';
        }

        let dirX = 0, dirZ = 0;

        if (s.state === 'chase' && this.player.fall_respawn_timer === 0) {
          dirX = this.player.pos[0] - s.pos[0];
          dirZ = this.player.pos[2] - s.pos[2];
          const distP = Math.sqrt(dirX * dirX + dirZ * dirZ);
          if (distP > 0.001) {
            dirX /= distP;
            dirZ /= distP;
          }
        } else if (s.state === 'wander') {
          // Look for lit lantern with fuel < 30 nearest
          let weakLantern = null;
          let minWeakDist = Infinity;
          for (const l of this.lanterns) {
            if (l.lit && (l.fuel_ticks / 60.0) < this.tuning.low_fuel_threshold) {
              const d = distXZ(s.pos, l.pos);
              if (d < minWeakDist || (Math.abs(d - minWeakDist) < 0.001 && l.id < weakLantern.id)) {
                minWeakDist = d;
                weakLantern = l;
              }
            }
          }

          if (weakLantern) {
            s.target_lantern_id = weakLantern.id;
            dirX = weakLantern.pos[0] - s.pos[0];
            dirZ = weakLantern.pos[2] - s.pos[2];
            const distL = Math.sqrt(dirX * dirX + dirZ * dirZ);
            if (distL <= 2.0) {
              s.state = 'drain';
              dirX = 0;
              dirZ = 0;
            } else if (distL > 0.001) {
              dirX /= distL;
              dirZ /= distL;
            }
          } else {
            // Wander towards nearest unlit lantern
            let unlitLantern = null;
            let minUnlitDist = Infinity;
            for (const l of this.lanterns) {
              if (!l.lit) {
                const d = distXZ(s.pos, l.pos);
                if (d < minUnlitDist) {
                  minUnlitDist = d;
                  unlitLantern = l;
                }
              }
            }
            if (unlitLantern) {
              dirX = unlitLantern.pos[0] - s.pos[0];
              dirZ = unlitLantern.pos[2] - s.pos[2];
              const distU = Math.sqrt(dirX * dirX + dirZ * dirZ);
              if (distU > 0.001) {
                dirX /= distU;
                dirZ /= distU;
              }
            }
          }
        }

        let nextX = s.pos[0] + dirX * shadeSpeed * dt;
        let nextZ = s.pos[2] + dirZ * shadeSpeed * dt;

        // Safe zone check: only lanterns with fuel >= 30 have safe zone!
        let blocked = false;
        for (const l of this.lanterns) {
          if (l.lit && (l.fuel_ticks / 60.0) >= this.tuning.low_fuel_threshold) {
            const dNext = distXZ([nextX, 0, nextZ], l.pos);
            const dCurr = distXZ(s.pos, l.pos);
            if (dNext < this.tuning.safe_radius && dCurr >= this.tuning.safe_radius) {
              blocked = true;
              break;
            }
          }
        }

        if (!blocked) {
          s.pos[0] = nextX;
          s.pos[2] = nextZ;
        }

        s.pos[1] = this.getGroundHeight(s.pos[0], s.pos[2]);
      }
    }

    // Move Drifters (Gió Lạc)
    for (let i = this.drifters.length - 1; i >= 0; i--) {
      const d = this.drifters[i];
      if (d.drop_die_timer > 0) {
        d.drop_die_timer--;
        if (d.drop_die_timer <= 0) {
          this.drifters.splice(i, 1);
          continue;
        }
      }

      const dToPlayer = distXZ(d.pos, this.player.pos);

      if (d.state === 'idle') {
        if (this.player.carried >= 5 && dToPlayer <= this.tuning.drifter_detect_radius) {
          d.state = 'chase';
        }
      } else if (d.state === 'chase') {
        if (this.player.carried < 5 || dToPlayer > this.tuning.drifter_detect_radius) {
          d.state = 'idle';
        }
      }

      if (d.state === 'idle') {
        d.pos[0] += Math.cos(this.sim_tick * 0.05 + i) * this.tuning.drifter_idle_speed * dt;
        d.pos[2] += Math.sin(this.sim_tick * 0.05 + i) * this.tuning.drifter_idle_speed * dt;
      } else if (d.state === 'chase') {
        let dx = this.player.pos[0] - d.pos[0];
        let dz = this.player.pos[2] - d.pos[2];
        const distP = Math.sqrt(dx * dx + dz * dz);
        if (distP > 0.001) {
          d.pos[0] += (dx / distP) * this.tuning.drifter_speed * dt;
          d.pos[2] += (dz / distP) * this.tuning.drifter_speed * dt;
        }
      } else if (d.state === 'flee') {
        let dx = d.pos[0] - this.player.pos[0];
        let dz = d.pos[2] - this.player.pos[2];
        const distP = Math.sqrt(dx * dx + dz * dz);
        if (distP > 0.001) {
          d.pos[0] += (dx / distP) * this.tuning.drifter_speed * dt;
          d.pos[2] += (dz / distP) * this.tuning.drifter_speed * dt;
        }
        d.flee_timer--;
        if (d.flee_timer <= 0) {
          this.drifters.splice(i, 1);
          continue;
        }
      }
    }

    // Step 9: Contact hits (Drifters first, then Shades)
    if (this.player.fall_respawn_timer === 0) {
      for (const d of this.drifters) {
        if (d.state === 'chase') {
          const dXZ = distXZ(this.player.pos, d.pos);
          if (dXZ <= this.tuning.drifter_hit_radius) {
            const stealAmount = Math.min(this.tuning.drifter_steal_count, this.player.carried);
            if (stealAmount > 0) {
              this.player.carried -= stealAmount;
              d.stolen += stealAmount;
              d.state = 'flee';
              d.flee_timer = 240;

              this.currentEvents.push({
                type: 'event',
                tick: this.sim_tick,
                name: 'drifter_steal',
                data: {
                  drifter_id: d.id,
                  amount: stealAmount,
                  carried: this.player.carried
                }
              });
            }
          }
        }
      }

      const sortedShades = [...this.shades].sort((a, b) => a.id.localeCompare(b.id));
      let hitOccurredThisTick = false;

      for (const s of sortedShades) {
        if (s.state === 'stunned' || s.safe_pushing) continue;

        const dXZ = distXZ(this.player.pos, s.pos);
        const dY = Math.abs(this.player.pos[1] - s.pos[1]);

        if (dXZ <= this.tuning.shade_hit_radius && dY <= this.tuning.shade_hit_height) {
          if (!hitOccurredThisTick && this.player.invuln_timer === 0) {
            hitOccurredThisTick = true;
            this.player.flames = Math.max(0, this.player.flames - 1);
            const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
            this.player.carried -= dropped;
            this.player.invuln_timer = this.tuning.invuln_ticks;

            for (let i = 0; i < dropped; i++) {
              const angle = (i * Math.PI * 2) / Math.max(1, dropped);
              const r = 1.5 + this.rng.range(0, 1.0);
              this.motes.push({
                id: `M${this.moteIdCounter++}`,
                pos: [round3(this.player.pos[0] + Math.cos(angle) * r), round3(this.player.pos[1]), round3(this.player.pos[2] + Math.sin(angle) * r)],
                kind: 'dropped',
                ttl_ticks: this.tuning.dropped_mote_ttl_ticks,
                spawn_tick: this.sim_tick
              });
            }

            let rdx = s.pos[0] - this.player.pos[0];
            let rdz = s.pos[2] - this.player.pos[2];
            const rLen = Math.sqrt(rdx * rdx + rdz * rdz);
            if (rLen > 0.001) {
              rdx /= rLen;
              rdz /= rLen;
            } else {
              rdx = 1;
              rdz = 0;
            }
            s.state = 'recoil';
            s.recoil_ticks_left = this.tuning.shade_recoil_ticks;
            s.recoil_vec = [rdx * (this.tuning.shade_recoil_m / this.tuning.shade_recoil_ticks), rdz * (this.tuning.shade_recoil_m / this.tuning.shade_recoil_ticks)];

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

    // Step 10: Spawn motes, Shades, Drifters on schedule
    if (this.random_motes && this.sim_tick % 240 === 0 && this.motes.length < 30) {
      const points = this.map.motePoints;
      const emptyPts = points.filter(p => !this.motes.some(m => distXZ(m.pos, p) < 2.0));
      if (emptyPts.length > 0) {
        const pt = emptyPts[this.rng.int(0, emptyPts.length - 1)];
        this.motes.push({
          id: `M${this.moteIdCounter++}`,
          pos: [round3(pt[0]), round3(pt[1]), round3(pt[2])],
          kind: 'random',
          ttl_ticks: null,
          spawn_tick: this.sim_tick
        });
      }
    }

    if (this.random_shades) {
      const shadeMax = this.map.shadeMax;
      const interval = this.map.shadeIntervalTicks;

      if (this.sim_tick === 300) {
        this.spawnShade();
        this.spawnShade();
      } else if (this.sim_tick > 300 && (this.sim_tick - 300) % interval === 0) {
        if (this.shades.length < shadeMax) {
          this.spawnShade();
        }
      }
    }

    if (this.random_drifters && this.map.hasDrifters) {
      if (this.sim_tick % 1200 === 0 && this.drifters.length < 2) {
        const angle = this.rng.range(0, Math.PI * 2);
        const r = this.night === 2 ? 35 : 42;
        const x = round3(Math.cos(angle) * r);
        const z = round3(Math.sin(angle) * r);
        this.drifters.push({
          id: `D${this.drifterIdCounter++}`,
          pos: [x, 2.0, z],
          state: 'idle',
          stolen: 0,
          flee_timer: 0,
          drop_die_timer: 0
        });
      }
    }

    // Step 11: Check Win / Loss (Phase 3 Rules)
    // 1. Loss by Flames
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

    // 2. Dawn check (when time runs out: time_left_s <= 0)
    if (this.time_left_s <= 0) {
      const litLanterns = this.lanterns.filter(l => l.lit);
      const winThreshold = Math.ceil(this.tuning.win_ratio * this.lanterns.length);

      if (litLanterns.length >= winThreshold) {
        this.state = 'won';
        // Phase 3 Scoring:
        // +50 + floor(fuel) for each currently lit lantern
        // +50 for each remaining flame
        let dawnBonus = 0;
        for (const l of litLanterns) {
          const currentFuel = l.fuel_ticks / 60.0;
          dawnBonus += this.tuning.score.per_lit_lantern_dawn + Math.floor(currentFuel);
        }
        dawnBonus += this.player.flames * this.tuning.score.per_flame_dawn;
        this.score += dawnBonus;

        this.currentEvents.push({
          type: 'event',
          tick: this.sim_tick,
          name: 'game_over',
          data: { result: 'won', reason: 'dawn_survived' }
        });
      } else {
        this.state = 'lost';
        this.currentEvents.push({
          type: 'event',
          tick: this.sim_tick,
          name: 'game_over',
          data: { result: 'lost', reason: 'dawn' }
        });
      }
    }

    return this.currentEvents;
  }

  spawnShade() {
    const pts = this.map.shadePoints.filter(p => distXZ(p, this.player.pos) >= this.tuning.shade_detect_radius);
    const chosen = pts.length > 0 ? pts[this.rng.int(0, pts.length - 1)] : this.map.shadePoints[0];
    const newShade = {
      id: `S${this.shadeIdCounter++}`,
      pos: [round3(chosen[0]), round3(chosen[1]), round3(chosen[2])],
      state: 'wander',
      state_ticks_left: 0,
      target_lantern_id: null,
      drain_ticks: 0,
      push_vec: [0, 0],
      push_ticks_left: 0,
      recoil_vec: [0, 0],
      recoil_ticks_left: 0
    };
    this.shades.push(newShade);
    this.currentEvents.push({
      type: 'event',
      tick: this.sim_tick,
      name: 'shade_spawned',
      data: { id: newShade.id }
    });
  }
}
