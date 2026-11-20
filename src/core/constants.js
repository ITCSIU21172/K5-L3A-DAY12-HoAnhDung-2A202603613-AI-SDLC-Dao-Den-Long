export const DEFAULT_TUNING = {
  player_speed: 6.0,
  player_accel_time_s: 0.1,
  jump_velocity: 7.0,
  gravity: -20.0,
  dash_speed: 14.0,
  dash_duration_s: 0.2, // 12 ticks
  dash_cooldown_s: 1.5, // 90 ticks
  carry_capacity: 10,
  lantern_cost: 10,
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
  night1_duration_s: 300,
  night2_duration_s: 330,
  night3_duration_s: 360,
  flames: 3,
  score: {
    per_mote: 10,
    per_lantern: 100,
    per_stun: 5,
    per_second_left: 2,
    per_flame_left: 50
  }
};

/**
 * Generate standard map configurations for Night 1, 2, 3
 */
export function getMapConfig(night = 1) {
  if (night === 2) {
    // Night 2 - Đảo Cau
    const lanterns = [
      { id: 'L1', pos: [0.0, 0.0, 20.0], lit: false, deposited: 0 },
      { id: 'L2', pos: [17.0, 0.0, -10.0], lit: false, deposited: 0 },
      { id: 'L3', pos: [-17.0, 0.0, -10.0], lit: false, deposited: 0 },
      { id: 'L4', pos: [70.0, 0.0, 20.0], lit: false, deposited: 0 },
      { id: 'L5', pos: [87.0, 0.0, -10.0], lit: false, deposited: 0 },
      { id: 'L6', pos: [53.0, 0.0, -10.0], lit: false, deposited: 0 }
    ];

    // Mote spawn points (12 on Island A, 12 on Island B)
    const motePoints = [];
    [ [0, 0], [70, 0] ].forEach(([cx, cz]) => {
      // 4 points on radius 10m
      [0, 90, 180, 270].forEach(deg => {
        const rad = (deg * Math.PI) / 180;
        motePoints.push([cx + Math.cos(rad) * 10, 0, cz + Math.sin(rad) * 10]);
      });
      // 8 points on radius 22m (every 45 deg)
      for (let i = 0; i < 8; i++) {
        const rad = (i * 45 * Math.PI) / 180;
        motePoints.push([cx + Math.cos(rad) * 22, 0, cz + Math.sin(rad) * 22]);
      }
    });

    // Shade spawn points (8 on r=26m for each island: 22.5, 67.5, ...)
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
      duration_s: 330,
      lanterns,
      motePoints,
      shadePoints,
      jumpPads,
      charms,
      shadeSpeed: 4.0,
      shadeIntervalTicks: 420, // 7s
      shadeMax: 8,
      windEnabled: false,
      hasDrifters: true
    };
  }

  if (night === 3) {
    // Night 3 - Đảo Chuông
    const lanterns = [
      { id: 'L1', pos: [0.0, 6.0, 6.0], lit: false, deposited: 0 },
      { id: 'L2', pos: [18.0, 3.0, 10.0], lit: false, deposited: 0 },
      { id: 'L3', pos: [-18.0, 3.0, 10.0], lit: false, deposited: 0 },
      { id: 'L4', pos: [35.0, 0.0, -10.0], lit: false, deposited: 0 },
      { id: 'L5', pos: [-35.0, 0.0, -10.0], lit: false, deposited: 0 },
      { id: 'L6', pos: [20.0, 0.0, -35.0], lit: false, deposited: 0 },
      { id: 'L7', pos: [-20.0, 0.0, -35.0], lit: false, deposited: 0 }
    ];

    const motePoints = [];
    // Tier 0: 18 points on r=34m (every 20 deg from 0)
    for (let i = 0; i < 18; i++) {
      const rad = (i * 20 * Math.PI) / 180;
      motePoints.push([Math.cos(rad) * 34, 0, Math.sin(rad) * 34]);
    }
    // Tier 1: 8 points on r=18m (20, 40, ... 160 deg) at Y=3
    for (let i = 1; i <= 8; i++) {
      const rad = (i * 20 * Math.PI) / 180;
      motePoints.push([Math.cos(rad) * 18, 3, Math.sin(rad) * 18]);
    }
    // Tier 2: 4 points on r=5m (45, 135, 225, 315 deg) at Y=6
    [45, 135, 225, 315].forEach(deg => {
      const rad = (deg * Math.PI) / 180;
      motePoints.push([Math.cos(rad) * 5, 6, Math.sin(rad) * 5]);
    });

    // Shade spawn points: 16 points on r=43m (every 22.5 deg)
    const shadePoints = [];
    for (let i = 0; i < 16; i++) {
      const rad = (i * 22.5 * Math.PI) / 180;
      shadePoints.push([Math.cos(rad) * 43, 0, Math.sin(rad) * 43]);
    }

    const jumpPads = [
      { id: 'JP1', pos: [0.0, 3.0, 13.0], radius: 1.0, vy: 12.0, target: [0.0, 6.0, 5.0], speedHoriz: 8.0, dir: [0, -1] }
    ];

    const charms = [
      { id: 'C1', pos: [30.0, 0.0, 25.0], available: true, respawn_timer: 0 },
      { id: 'C2', pos: [-30.0, 0.0, 25.0], available: true, respawn_timer: 0 }
    ];

    return {
      night: 3,
      duration_s: 360,
      lanterns,
      motePoints,
      shadePoints,
      jumpPads,
      charms,
      shadeSpeed: 4.5,
      shadeIntervalTicks: 360, // 6s
      shadeMax: 10,
      windEnabled: true,
      hasDrifters: true
    };
  }

  // Night 1 - Đảo Bến (Standardized)
  const lanterns = [
    { id: 'L1', pos: [0.0, 0.0, 25.0], lit: false, deposited: 0 },
    { id: 'L2', pos: [23.8, 0.0, 7.7], lit: false, deposited: 0 },
    { id: 'L3', pos: [14.7, 0.0, -20.2], lit: false, deposited: 0 },
    { id: 'L4', pos: [-14.7, 0.0, -20.2], lit: false, deposited: 0 },
    { id: 'L5', pos: [-23.8, 0.0, 7.7], lit: false, deposited: 0 }
  ];

  const motePoints = [];
  // 8 points on r=12m (every 45 deg)
  for (let i = 0; i < 8; i++) {
    const rad = (i * 45 * Math.PI) / 180;
    motePoints.push([Math.cos(rad) * 12, 0, Math.sin(rad) * 12]);
  }
  // 16 points on r=33m (every 22.5 deg)
  for (let i = 0; i < 16; i++) {
    const rad = (i * 22.5 * Math.PI) / 180;
    motePoints.push([Math.cos(rad) * 33, 0, Math.sin(rad) * 33]);
  }

  // 12 points on r=37m (15, 45, 75, ... 345 deg)
  const shadePoints = [];
  for (let i = 0; i < 12; i++) {
    const rad = ((15 + i * 30) * Math.PI) / 180;
    shadePoints.push([Math.cos(rad) * 37, 0, Math.sin(rad) * 37]);
  }

  return {
    night: 1,
    duration_s: 300,
    lanterns,
    motePoints,
    shadePoints,
    jumpPads: [],
    charms: [],
    shadeSpeed: 4.0,
    shadeIntervalTicks: 480, // 8s
    shadeMax: 6,
    windEnabled: false,
    hasDrifters: false
  };
}
