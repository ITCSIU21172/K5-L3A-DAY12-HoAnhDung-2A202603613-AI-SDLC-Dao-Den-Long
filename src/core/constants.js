export const DEFAULT_TUNING = {
  player_speed: 6.0,
  player_accel_time_s: 0.1,
  jump_velocity: 7.0,
  gravity: -20.0,
  dash_speed: 14.0,
  dash_duration_s: 0.2, // 12 ticks
  dash_cooldown_s: 1.5, // 90 ticks
  carry_capacity: 10,
  capacity_max: 20,
  lantern_cost: 10,
  relight_cost: 5,
  fuel_max: 100,
  fuel_decay_per_s: 1.0,
  fuel_per_mote: 10,
  low_fuel_threshold: 30,
  drain_per_s: 5,
  win_ratio: 0.6,
  lantern_count_night1: 5,
  lantern_count_night2: 6,
  lantern_count_night3: 7,
  pickup_radius: 1.0,
  pickup_height: 1.5,
  interact_radius: 2.0,
  safe_radius: 6.0,
  pulse_cost: 3,
  pulse_radius: 5.0,
  pulse_stun_s: 2.0, // 120 ticks
  pulse_push_m: 4.0,
  pulse_push_ticks: 15,
  pulse_cooldown_s: 3.0,
  shade_speed: 4.0,
  shade_speed_night3: 4.5,
  shade_detect_radius: 12.0,
  shade_lose_radius: 18.0,
  shade_hit_radius: 1.0,
  shade_hit_height: 1.5,
  shade_recoil_m: 2.0,
  shade_recoil_ticks: 60,
  invuln_s: 1.5,
  invuln_ticks: 90,
  fall_respawn_ticks: 60,
  fall_enabled: true,
  hit_drop_ratio: 0.5,
  dropped_mote_ttl_ticks: 480,
  drifter_speed: 7.0,
  drifter_idle_speed: 2.0,
  drifter_detect_radius: 15.0,
  drifter_steal_count: 3,
  drifter_hit_radius: 1.2,
  charm_duration_ticks: 600,
  charm_respawn_ticks: 2700,
  charm_speed: 7.2,
  night1_duration_s: 240,
  night2_duration_s: 270,
  night3_duration_s: 300,
  flames: 3,
  score: {
    per_mote: 5,
    per_lantern_first: 100,
    per_lantern_relight: 40,
    per_stun: 5,
    per_drain_stun: 15,
    per_lit_lantern_dawn: 50,
    per_flame_dawn: 50
  }
};

/**
 * Generate standard map configurations for Night 1, 2, 3
 */
export function getMapConfig(night = 1) {
  if (night === 2) {
    const lanterns = [
      { id: 'L1', pos: [0.0, 0.0, 20.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
      { id: 'L2', pos: [17.0, 0.0, -10.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
      { id: 'L3', pos: [-17.0, 0.0, -10.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
      { id: 'L4', pos: [70.0, 0.0, 20.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
      { id: 'L5', pos: [87.0, 0.0, -10.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
      { id: 'L6', pos: [53.0, 0.0, -10.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 }
    ];

    const motePoints = [];
    [ [0, 0], [70, 0] ].forEach(([cx, cz]) => {
      [0, 90, 180, 270].forEach(deg => {
        const rad = (deg * Math.PI) / 180;
        motePoints.push([cx + Math.cos(rad) * 10, 0, cz + Math.sin(rad) * 10]);
      });
      for (let i = 0; i < 8; i++) {
        const rad = (i * 45 * Math.PI) / 180;
        motePoints.push([cx + Math.cos(rad) * 22, 0, cz + Math.sin(rad) * 22]);
      }
    });

    const shadePoints = [];
    [ [0, 0], [70, 0] ].forEach(([cx, cz]) => {
      for (let i = 0; i < 8; i++) {
        const rad = ((22.5 + i * 45) * Math.PI) / 180;
        shadePoints.push([cx + Math.cos(rad) * 26, 0, cz + Math.sin(rad) * 26]);
      }
    });

    const jumpPads = [
      { id: 'JP1', pos: [20.0, 0.0, 18.0], radius: 1.0, vy: 14.0, target: [70.0, 0.0, 0.0], speedHoriz: 24.0 },
      { id: 'JP2', pos: [50.0, 0.0, -18.0], radius: 1.0, vy: 14.0, target: [0.0, 0.0, 0.0], speedHoriz: 24.0 }
    ];

    const charms = [
      { id: 'C1', pos: [35.0, 0.0, 0.0], available: true, respawn_timer: 0 }
    ];

    return {
      night: 2,
      duration_s: 270,
      lanterns,
      motePoints,
      shadePoints,
      jumpPads,
      charms,
      shadeSpeed: 4.0,
      shadeIntervalTicks: 420,
      shadeMax: 8,
      windEnabled: false,
      hasDrifters: true
    };
  }

  if (night === 3) {
    const lanterns = [
      { id: 'L1', pos: [0.0, 0.0, 6.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
      { id: 'L2', pos: [18.0, 0.0, 10.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
      { id: 'L3', pos: [-18.0, 0.0, 10.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
      { id: 'L4', pos: [35.0, 0.0, -10.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
      { id: 'L5', pos: [-35.0, 0.0, -10.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
      { id: 'L6', pos: [20.0, 0.0, -35.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
      { id: 'L7', pos: [-20.0, 0.0, -35.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 }
    ];

    const motePoints = [];
    for (let i = 0; i < 18; i++) {
      const rad = (i * 20 * Math.PI) / 180;
      motePoints.push([Math.cos(rad) * 34, 0, Math.sin(rad) * 34]);
    }
    for (let i = 1; i <= 8; i++) {
      const rad = (i * 20 * Math.PI) / 180;
      motePoints.push([Math.cos(rad) * 18, 0, Math.sin(rad) * 18]);
    }
    [45, 135, 225, 315].forEach(deg => {
      const rad = (deg * Math.PI) / 180;
      motePoints.push([Math.cos(rad) * 5, 0, Math.sin(rad) * 5]);
    });

    const shadePoints = [];
    for (let i = 0; i < 16; i++) {
      const rad = (i * 22.5 * Math.PI) / 180;
      shadePoints.push([Math.cos(rad) * 43, 0, Math.sin(rad) * 43]);
    }

    const jumpPads = [
      { id: 'JP1', pos: [0.0, 0.0, 18.0], radius: 1.0, vy: 12.0, target: [0.0, 0.0, -10.0], speedHoriz: 12.0, dir: [0, -1] }
    ];

    const charms = [
      { id: 'C1', pos: [30.0, 0.0, 25.0], available: true, respawn_timer: 0 },
      { id: 'C2', pos: [-30.0, 0.0, 25.0], available: true, respawn_timer: 0 }
    ];

    return {
      night: 3,
      duration_s: 300,
      lanterns,
      motePoints,
      shadePoints,
      jumpPads,
      charms,
      shadeSpeed: 4.5,
      shadeIntervalTicks: 360,
      shadeMax: 10,
      windEnabled: true,
      hasDrifters: true
    };
  }

  // Night 1
  const lanterns = [
    { id: 'L1', pos: [0.0, 0.0, 25.0], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
    { id: 'L2', pos: [23.8, 0.0, 7.7], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
    { id: 'L3', pos: [14.7, 0.0, -20.2], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
    { id: 'L4', pos: [-14.7, 0.0, -20.2], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 },
    { id: 'L5', pos: [-23.8, 0.0, 7.7], lit: false, deposited: 0, fuel: 0.0, ever_lit: false, relit_count: 0 }
  ];

  const motePoints = [];
  for (let i = 0; i < 8; i++) {
    const rad = (i * 45 * Math.PI) / 180;
    motePoints.push([Math.cos(rad) * 12, 0, Math.sin(rad) * 12]);
  }
  for (let i = 0; i < 16; i++) {
    const rad = (i * 22.5 * Math.PI) / 180;
    motePoints.push([Math.cos(rad) * 33, 0, Math.sin(rad) * 33]);
  }

  const shadePoints = [];
  for (let i = 0; i < 12; i++) {
    const rad = ((15 + i * 30) * Math.PI) / 180;
    shadePoints.push([Math.cos(rad) * 37, 0, Math.sin(rad) * 37]);
  }

  return {
    night: 1,
    duration_s: 240,
    lanterns,
    motePoints,
    shadePoints,
    jumpPads: [],
    charms: [],
    shadeSpeed: 4.0,
    shadeIntervalTicks: 480,
    shadeMax: 6,
    windEnabled: false,
    hasDrifters: false
  };
}
