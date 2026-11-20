import * as THREE from '/three';
import { Simulation } from '../core/simulation.js';
import { sounds } from './audio.js';

let sim = null;
let currentNight = 1;
let cumulativeScore = 0;
let scene, camera, renderer, ambientLight, moonLight;
let playerMesh, hatLanternLight;
let lanternMeshes = [];
let moteMeshes = [];
let shadeMeshes = [];
let drifterMeshes = [];
let charmMeshes = [];
let jumpPadMeshes = [];
let islandMeshes = [];
let pulseMesh = null;
let pulseTimer = 0;

let cameraYaw = 0;
let cameraPitch = 25;
let cameraDistance = 11;
let mouseSens = parseFloat(localStorage.getItem('dao_den_long_sens') || '1.0');
let mouseLook = false;
let colorblindMode = localStorage.getItem('dao_den_long_colorblind') === 'true';

const keys = {};

function initThree() {
  const canvas = document.getElementById('game-canvas');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1430); // Standardized sky color
  scene.fog = new THREE.FogExp2(0x1b2350, 0.015); // Standardized fog color

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  ambientLight = new THREE.AmbientLight(0x2f5d50, 0.2);
  scene.add(ambientLight);

  moonLight = new THREE.DirectionalLight(0xffe9b0, 0.5);
  moonLight.position.set(40, 70, 30);
  moonLight.castShadow = true;
  scene.add(moonLight);

  // Sea of clouds
  const cloudGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0x12384a, transparent: true, opacity: 0.85 });
  const clouds = new THREE.Mesh(cloudGeo, cloudMat);
  clouds.rotation.x = -Math.PI / 2;
  clouds.position.y = -8;
  scene.add(clouds);

  buildStars();
  buildPulseSphere();

  window.addEventListener('resize', onWindowResize);
}

function buildStars() {
  const count = 700;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const r = 250;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 15;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.85 });
  scene.add(new THREE.Points(geometry, material));
}

function buildMapGeometry(night) {
  islandMeshes.forEach(m => scene.remove(m));
  islandMeshes = [];
  jumpPadMeshes.forEach(m => scene.remove(m));
  jumpPadMeshes = [];

  const grassMat = new THREE.MeshStandardMaterial({ color: 0x2f5d50, roughness: 0.85 });
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xc9b48a, roughness: 0.8 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.7 });

  if (night === 1) {
    // Round Island r=40m
    const topGeo = new THREE.CylinderGeometry(40, 42, 4, 48);
    const island = new THREE.Mesh(topGeo, grassMat);
    island.position.y = -2;
    island.receiveShadow = true;
    scene.add(island);
    islandMeshes.push(island);
  } else if (night === 2) {
    // Island A (0,0) and B (70,0), r=28m
    const geoA = new THREE.CylinderGeometry(28, 30, 4, 40);
    const islandA = new THREE.Mesh(geoA, grassMat);
    islandA.position.set(0, -2, 0);
    scene.add(islandA);
    islandMeshes.push(islandA);

    const geoB = new THREE.CylinderGeometry(28, 30, 4, 40);
    const islandB = new THREE.Mesh(geoB, grassMat);
    islandB.position.set(70, -2, 0);
    scene.add(islandB);
    islandMeshes.push(islandB);

    // Bamboo bridge: x in [26, 44], z in [-2, 2]
    const bridgeGeo = new THREE.BoxGeometry(18, 0.3, 4);
    const bridge = new THREE.Mesh(bridgeGeo, woodMat);
    bridge.position.set(35, -0.05, 0);
    scene.add(bridge);
    islandMeshes.push(bridge);
  } else if (night === 3) {
    // 3 Tiers
    // Tier 0: r=45m at Y=0
    const t0Geo = new THREE.CylinderGeometry(45, 47, 4, 48);
    const t0 = new THREE.Mesh(t0Geo, grassMat);
    t0.position.y = -2;
    scene.add(t0);
    islandMeshes.push(t0);

    // Tier 1: Y=3, Annulus r=12-24m on z > 0
    const t1Geo = new THREE.CylinderGeometry(24, 24, 3, 36, 1, false, 0, Math.PI);
    const t1 = new THREE.Mesh(t1Geo, sandMat);
    t1.position.set(0, 1.5, 0);
    scene.add(t1);
    islandMeshes.push(t1);

    // Tier 2: Y=6, Disc r=8m
    const t2Geo = new THREE.CylinderGeometry(8, 8, 6, 24);
    const t2 = new THREE.Mesh(t2Geo, grassMat);
    t2.position.set(0, 3, 0);
    scene.add(t2);
    islandMeshes.push(t2);

    // Bell Tower at center of Tier 2 (radius 2m, height 8m)
    const towerGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
    const tower = new THREE.Mesh(towerGeo, woodMat);
    tower.position.set(0, 10, 0);
    scene.add(tower);
    islandMeshes.push(tower);
  }

  // Jump pads
  for (const pad of sim.jumpPads) {
    const padGeo = new THREE.CylinderGeometry(pad.radius, pad.radius + 0.1, 0.15, 16);
    const padMat = new THREE.MeshStandardMaterial({ color: 0xf2c14e, emissive: 0xd69e2e, emissiveIntensity: 0.6 });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.set(pad.pos[0], pad.pos[1] + 0.08, pad.pos[2]);
    scene.add(padMesh);
    jumpPadMeshes.push(padMesh);
  }
}

function buildPlayer() {
  const group = new THREE.Group();

  // Robe (Standardized #E8E2D0)
  const bodyGeo = new THREE.ConeGeometry(0.5, 1.2, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.6 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  group.add(body);

  // Red Scarf (Standardized #C8102E)
  const scarfGeo = new THREE.TorusGeometry(0.3, 0.08, 8, 16);
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xc8102e });
  const scarf = new THREE.Mesh(scarfGeo, scarfMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.15;
  group.add(scarf);

  // Head
  const headGeo = new THREE.SphereGeometry(0.26, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfbd38d, roughness: 0.5 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.25;
  group.add(head);

  // Conical Hat (Nón Lá)
  const hatGeo = new THREE.ConeGeometry(0.85, 0.4, 24);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.8 });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.y = 1.48;
  group.add(hat);

  // Mini Lantern on Hat
  const miniLanternGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.16, 8);
  const miniLanternMat = new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xffb347, emissiveIntensity: 2.0 });
  const miniLantern = new THREE.Mesh(miniLanternGeo, miniLanternMat);
  miniLantern.position.set(0.65, 1.25, 0.2);
  group.add(miniLantern);

  hatLanternLight = new THREE.PointLight(0xffb347, 1.5, 8);
  hatLanternLight.position.set(0.65, 1.25, 0.2);
  group.add(hatLanternLight);

  scene.add(group);
  return group;
}

function buildGrandLantern(lData) {
  const group = new THREE.Group();
  group.position.set(lData.pos[0], lData.pos[1], lData.pos[2]);

  // Base
  const baseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.6, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.9 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.3;
  group.add(base);

  // Timber post
  const postGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.2, 8);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.7 });
  const post = new THREE.Mesh(postGeo, postMat);
  post.position.y = 1.7;
  group.add(post);

  // Chamber (#5B5F6E when dim, #FFB347 when lit)
  const chamberGeo = new THREE.CylinderGeometry(0.7, 0.5, 1.1, 8);
  const chamberMat = new THREE.MeshStandardMaterial({
    color: lData.lit ? 0xffb347 : 0x5b5f6e,
    emissive: lData.lit ? 0xffb347 : 0x110800,
    emissiveIntensity: lData.lit ? 3.0 : 0.2,
    transparent: true,
    opacity: 0.9
  });
  const chamber = new THREE.Mesh(chamberGeo, chamberMat);
  chamber.position.y = 2.8;
  group.add(chamber);

  // Pagoda roof
  const roofGeo = new THREE.ConeGeometry(1.1, 0.5, 8);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.5 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 3.5;
  group.add(roof);

  const light = new THREE.PointLight(0xffb347, lData.lit ? 4.5 : 0.2, lData.lit ? 25 : 3);
  light.position.y = 2.8;
  group.add(light);

  // Phase 3 Fuel Bar Indicator
  const barGroup = new THREE.Group();
  barGroup.position.y = 4.2;
  const barBgGeo = new THREE.BoxGeometry(1.2, 0.12, 0.05);
  const barBgMat = new THREE.MeshBasicMaterial({ color: 0x1a202c });
  const barBg = new THREE.Mesh(barBgGeo, barBgMat);
  barGroup.add(barBg);

  const barFillGeo = new THREE.BoxGeometry(1.16, 0.08, 0.06);
  const barFillMat = new THREE.MeshBasicMaterial({ color: 0x48bb78 });
  const barFill = new THREE.Mesh(barFillGeo, barFillMat);
  barGroup.add(barFill);
  barGroup.visible = false;
  group.add(barGroup);

  scene.add(group);
  return { id: lData.id, group, chamber, light, barGroup, barFill, data: lData };
}

function buildPulseSphere() {
  const geo = new THREE.SphereGeometry(1, 24, 24);
  const mat = new THREE.MeshBasicMaterial({ color: 0xf2c14e, transparent: true, opacity: 0.5, wireframe: true });
  pulseMesh = new THREE.Mesh(geo, mat);
  pulseMesh.visible = false;
  scene.add(pulseMesh);
}

function updateVisualEntities() {
  // Update ambient light intensity according to progress: 0.15 + 0.55 * (lit / total)
  const litCount = sim.lanterns.filter(l => l.lit).length;
  ambientLight.intensity = 0.15 + 0.55 * (litCount / Math.max(1, sim.lanterns.length));

  // 1. Lanterns
  for (const lData of sim.lanterns) {
    let lMesh = lanternMeshes.find(m => m.id === lData.id);
    if (!lMesh) {
      lMesh = buildGrandLantern(lData);
      lanternMeshes.push(lMesh);
    }
    const fuel = lData.fuel_ticks ? (lData.fuel_ticks / 60.0) : (lData.fuel || 0);
    if (lData.lit) {
      if (lMesh.barGroup) {
        lMesh.barGroup.visible = true;
        const fuelRatio = Math.max(0, Math.min(1, fuel / 100.0));
        lMesh.barFill.scale.x = Math.max(0.01, fuelRatio);
        lMesh.barFill.position.x = (fuelRatio - 1) * 0.58;

        const isLowFuel = fuel < 30;
        if (isLowFuel) {
          const blink = Math.sin(Date.now() * 0.002 * Math.PI) > 0;
          lMesh.barFill.material.color.setHex(colorblindMode ? 0xffffff : 0xff3b30);
          lMesh.chamber.material.color.setHex(0xffb347);
          lMesh.chamber.material.emissive.setHex(0xffb347);
          lMesh.chamber.material.emissiveIntensity = blink ? 3.0 : 0.6;
          lMesh.light.intensity = blink ? 4.5 : 1.0;
          lMesh.light.distance = 25;
        } else {
          lMesh.barFill.material.color.setHex(fuelRatio > 0.5 ? 0x48bb78 : 0xecc94b);
          lMesh.chamber.material.color.setHex(0xffb347);
          lMesh.chamber.material.emissive.setHex(0xffb347);
          lMesh.chamber.material.emissiveIntensity = 3.0;
          lMesh.light.intensity = 4.5;
          lMesh.light.distance = 25;
        }
      }
      lMesh.group.scale.y = 1.0;
    } else {
      if (lMesh.barGroup) lMesh.barGroup.visible = false;
      lMesh.chamber.material.color.setHex(0x332211);
      lMesh.chamber.material.emissive.setHex(0x000000);
      lMesh.chamber.material.emissiveIntensity = 0.0;
      lMesh.light.intensity = 0.0;
      lMesh.group.scale.y = colorblindMode ? 0.8 : 1.0;
    }
  }

  // 2. Motes (Fireflies)
  while (moteMeshes.length < sim.motes.length) {
    const geo = new THREE.SphereGeometry(0.18, 12, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0xfff6c2, emissive: 0xffe58a, emissiveIntensity: 2.2 });
    const mesh = new THREE.Mesh(geo, mat);
    const pLight = new THREE.PointLight(0xffe58a, 0.8, 4);
    mesh.add(pLight);
    scene.add(mesh);
    moteMeshes.push({ mesh, id: null });
  }
  while (moteMeshes.length > sim.motes.length) {
    const m = moteMeshes.pop();
    scene.remove(m.mesh);
  }
  for (let i = 0; i < sim.motes.length; i++) {
    const mData = sim.motes[i];
    const mMesh = moteMeshes[i];
    mMesh.id = mData.id;
    const bob = Math.sin(Date.now() * 0.005 + i) * 0.2 + 0.35;
    mMesh.mesh.position.set(mData.pos[0], mData.pos[1] + bob, mData.pos[2]);
  }

  // 3. Shades
  while (shadeMeshes.length < sim.shades.length) {
    const group = new THREE.Group();
    const blobGeo = new THREE.DodecahedronGeometry(0.7, 1);
    const blobMat = new THREE.MeshStandardMaterial({ color: 0x120a1a, emissive: 0x7a3cff, emissiveIntensity: 0.5, roughness: 0.9 });
    const blob = new THREE.Mesh(blobGeo, blobMat);
    blob.position.y = 0.8;
    group.add(blob);

    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x7a3cff });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.25, 0.9, 0.55);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(-0.25, 0.9, 0.55);
    group.add(eyeL);
    group.add(eyeR);

    scene.add(group);
    shadeMeshes.push({ group, blob, eyeL, eyeR, id: null });
  }
  while (shadeMeshes.length > sim.shades.length) {
    const s = shadeMeshes.pop();
    scene.remove(s.group);
  }
  for (let i = 0; i < sim.shades.length; i++) {
    const sData = sim.shades[i];
    const sMesh = shadeMeshes[i];
    sMesh.id = sData.id;
    sMesh.group.position.set(sData.pos[0], sData.pos[1], sData.pos[2]);

    const eyeColor = colorblindMode ? 0x00b3ff : 0x7a3cff;
    if (sMesh.eyeL) sMesh.eyeL.material.color.setHex(eyeColor);
    if (sMesh.eyeR) sMesh.eyeR.material.color.setHex(eyeColor);

    if (sData.state === 'stunned') {
      sMesh.blob.material.color.setHex(0x3a3450);
      sMesh.group.rotation.y += 0.15;
    } else if (sData.state === 'drain') {
      sMesh.blob.material.color.setHex(0x5a189a);
      sMesh.group.rotation.y = 0;
    } else {
      sMesh.blob.material.color.setHex(0x120a1a);
      sMesh.group.rotation.y = 0;
    }
  }

  // 4. Drifters (Gió Lạc - Standardized #8FA3B8)
  while (drifterMeshes.length < sim.drifters.length) {
    const ribbonGeo = new THREE.CylinderGeometry(0.3, 0.05, 1.8, 8);
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x8fa3b8, emissive: 0x4a6572, transparent: true, opacity: 0.85 });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.rotation.z = Math.PI / 4;
    scene.add(ribbon);
    drifterMeshes.push({ mesh: ribbon, id: null });
  }
  while (drifterMeshes.length > sim.drifters.length) {
    const d = drifterMeshes.pop();
    scene.remove(d.mesh);
  }
  for (let i = 0; i < sim.drifters.length; i++) {
    const dData = sim.drifters[i];
    const dMesh = drifterMeshes[i];
    dMesh.id = dData.id;
    const wave = Math.sin(Date.now() * 0.008 + i) * 0.3;
    dMesh.mesh.position.set(dData.pos[0], dData.pos[1] + wave, dData.pos[2]);
  }

  // 5. Charms (Bùa Gió - Standardized #C8102E with #F2C14E border)
  while (charmMeshes.length < sim.charms.length) {
    const charmGeo = new THREE.BoxGeometry(0.6, 0.9, 0.05);
    const charmMat = new THREE.MeshStandardMaterial({ color: 0xc8102e, emissive: 0xf2c14e, emissiveIntensity: 0.4 });
    const cMesh = new THREE.Mesh(charmGeo, charmMat);
    scene.add(cMesh);
    charmMeshes.push({ mesh: cMesh, id: null });
  }
  for (let i = 0; i < sim.charms.length; i++) {
    const cData = sim.charms[i];
    const cMesh = charmMeshes[i];
    cMesh.id = cData.id;
    cMesh.mesh.position.set(cData.pos[0], cData.pos[1] + 0.8, cData.pos[2]);
    cMesh.mesh.rotation.y += 0.03;
    cMesh.mesh.visible = cData.available;
  }

  // 6. Player
  playerMesh.position.set(sim.player.pos[0], sim.player.pos[1], sim.player.pos[2]);
  if (sim.player.invuln_timer > 0 || sim.player.fall_respawn_timer > 0) {
    playerMesh.visible = Math.floor(Date.now() / 100) % 2 === 0;
  } else {
    playerMesh.visible = true;
  }

  // 7. Pulse Mesh
  if (pulseTimer > 0) {
    pulseTimer -= 0.016;
    const progress = 1.0 - pulseTimer / 0.4;
    const r = progress * sim.tuning.pulse_radius;
    pulseMesh.scale.set(r, r, r);
    pulseMesh.position.set(sim.player.pos[0], sim.player.pos[1] + 0.8, sim.player.pos[2]);
    pulseMesh.visible = true;
  } else {
    pulseMesh.visible = false;
  }
}

function updateHUD() {
  // Flames
  const flamesEl = document.getElementById('hud-flames');
  let flamesHtml = '';
  for (let i = 0; i < sim.player.flames; i++) flamesHtml += '<span>🔥</span>';
  if (sim.player.flames <= 0) flamesHtml = '<span style="color:#ff5a5f;">ĐÃ TẮT</span>';
  flamesEl.innerHTML = flamesHtml;

  // Timer mm:ss
  const sec = Math.ceil(sim.time_left_s);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  const timerEl = document.getElementById('hud-timer');
  timerEl.textContent = timeStr;
  if (sec <= 30) {
    timerEl.classList.add('timer-danger');
  } else {
    timerEl.classList.remove('timer-danger');
  }

  // Lanterns & Score
  const litCount = sim.lanterns.filter(l => l.lit).length;
  document.getElementById('hud-lanterns').textContent = `${litCount} / ${sim.lanterns.length}`;
  document.getElementById('hud-score').textContent = sim.score + cumulativeScore;

  // Mote Slots & Dynamic Capacity
  const cap = sim.getCapacity();
  const capEl = document.getElementById('motes-capacity-text');
  if (capEl) capEl.textContent = cap;
  document.getElementById('motes-count-text').textContent = sim.player.carried;

  const moteSlotsContainer = document.getElementById('mote-slots');
  if (moteSlotsContainer) {
    while (moteSlotsContainer.children.length < cap) {
      const d = document.createElement('div');
      d.className = 'mote-slot';
      moteSlotsContainer.appendChild(d);
    }
    while (moteSlotsContainer.children.length > cap) {
      moteSlotsContainer.removeChild(moteSlotsContainer.lastChild);
    }
    const slots = moteSlotsContainer.querySelectorAll('.mote-slot');
    slots.forEach((slot, idx) => {
      if (idx < sim.player.carried) {
        slot.classList.add('filled');
      } else {
        slot.classList.remove('filled');
      }
    });
  }

  // Cooldowns
  const dashEl = document.getElementById('dash-status');
  if (sim.player.charm_timer > 0) {
    dashEl.textContent = 'BÙA HỒI 0s';
    dashEl.style.color = '#fc8181';
  } else if (sim.player.dash_cd > 0) {
    dashEl.textContent = `${(sim.player.dash_cd / 60).toFixed(1)}s`;
    dashEl.style.color = '#cbd5e0';
  } else {
    dashEl.textContent = 'SẴN SÀNG';
    dashEl.style.color = '#68d391';
  }

  const pulseEl = document.getElementById('pulse-status');
  if (sim.player.pulse_cd > 0) {
    pulseEl.textContent = `${(sim.player.pulse_cd / 60).toFixed(1)}s`;
    pulseEl.style.color = '#cbd5e0';
  } else {
    pulseEl.textContent = sim.player.carried >= sim.tuning.pulse_cost ? 'SẴN SÀNG' : 'THIẾU ĐOM ĐÓM';
    pulseEl.style.color = sim.player.carried >= sim.tuning.pulse_cost ? '#68d391' : '#cbd5e0';
  }

  // Charm badge
  const charmBadge = document.getElementById('charm-badge');
  if (sim.player.charm_timer > 0) {
    charmBadge.style.display = 'flex';
    document.getElementById('charm-status').textContent = `${Math.ceil(sim.player.charm_timer / 60)}s`;
  } else {
    charmBadge.style.display = 'none';
  }

  // Interact Prompt (Lighting, Relighting, Refueling)
  const promptEl = document.getElementById('interact-prompt');
  let nearLantern = null;
  for (const l of sim.lanterns) {
    const d = Math.sqrt((sim.player.pos[0] - l.pos[0]) ** 2 + (sim.player.pos[2] - l.pos[2]) ** 2);
    const canReceive = !l.lit || (l.lit && l.fuel_ticks < 6000);
    if (d <= sim.tuning.interact_radius && canReceive) {
      nearLantern = l;
      break;
    }
  }
  if (nearLantern) {
    if (!nearLantern.lit) {
      const cost = nearLantern.ever_lit ? sim.tuning.relight_cost : sim.tuning.lantern_cost;
      const label = nearLantern.ever_lit ? 'Thắp lại' : 'Nạp ánh sáng';
      promptEl.textContent = `E — ${label} (${nearLantern.deposited}/${cost})`;
    } else {
      const fuelVal = Math.floor(nearLantern.fuel_ticks / 60.0);
      promptEl.textContent = `E — Châm dầu (Dầu: ${fuelVal}/100)`;
    }
    promptEl.style.display = 'block';
  } else {
    promptEl.style.display = 'none';
  }

  // Off-screen Direction Arrow to nearest unlit lantern
  updateDirectionArrow();

  // Render Minimap
  renderMinimap();
}

function updateDirectionArrow() {
  const arrow = document.getElementById('lantern-pointer');
  let unlit = sim.lanterns.filter(l => !l.lit);
  if (unlit.length === 0) {
    arrow.style.display = 'none';
    return;
  }

  let nearest = unlit[0];
  let minDist = Infinity;
  for (const l of unlit) {
    const d = (sim.player.pos[0] - l.pos[0]) ** 2 + (sim.player.pos[2] - l.pos[2]) ** 2;
    if (d < minDist) {
      minDist = d;
      nearest = l;
    }
  }

  // Project nearest lantern to screen space
  const pos3D = new THREE.Vector3(nearest.pos[0], nearest.pos[1] + 2, nearest.pos[2]);
  pos3D.project(camera);

  // If outside NDC [-0.9, 0.9]
  if (pos3D.x < -0.9 || pos3D.x > 0.9 || pos3D.y < -0.9 || pos3D.y > 0.9 || pos3D.z > 1.0) {
    arrow.style.display = 'block';
    const angle = Math.atan2(-pos3D.y, pos3D.x);
    const screenX = window.innerWidth / 2 + Math.cos(angle) * (window.innerWidth / 2 - 40);
    const screenY = window.innerHeight / 2 + Math.sin(angle) * (window.innerHeight / 2 - 40);
    arrow.style.left = `${screenX}px`;
    arrow.style.top = `${screenY}px`;
    arrow.style.transform = `translate(-50%, -50%) rotate(${angle + Math.PI / 2}rad)`;
  } else {
    arrow.style.display = 'none';
  }
}

function renderMinimap() {
  const canvas = document.getElementById('minimap');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const mapRadius = currentNight === 2 ? 55 : (currentNight === 3 ? 48 : 42);
  const scale = (w / 2 - 8) / mapRadius;

  // Background Island
  ctx.beginPath();
  if (currentNight === 2) {
    ctx.arc(cx - 35 * scale, cy, 28 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 35 * scale, cy, 28 * scale, 0, Math.PI * 2);
  } else {
    ctx.arc(cx, cy, (currentNight === 3 ? 45 : 40) * scale, 0, Math.PI * 2);
  }
  ctx.fillStyle = '#2f5d50';
  ctx.fill();

  // Lanterns
  for (const l of sim.lanterns) {
    const lx = cx + l.pos[0] * scale - (currentNight === 2 ? 35 * scale : 0);
    const lz = cy + l.pos[2] * scale;
    ctx.beginPath();
    ctx.arc(lx, lz, 4, 0, Math.PI * 2);
    ctx.fillStyle = l.lit ? '#ffb347' : '#5b5f6e';
    ctx.fill();
  }

  // Player
  const px = cx + sim.player.pos[0] * scale - (currentNight === 2 ? 35 * scale : 0);
  const pz = cy + sim.player.pos[2] * scale;
  ctx.beginPath();
  ctx.arc(px, pz, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#63b3ed';
  ctx.fill();
}

function showStartNightModal(night) {
  const modal = document.getElementById('modal-start');
  const title = document.getElementById('start-title');
  const desc = document.getElementById('start-desc');
  const btn = document.getElementById('btn-start-game');

  const nightNames = ['', 'ĐÊM 1 — ĐẢO BẾN', 'ĐÊM 2 — ĐẢO CAU', 'ĐÊM 3 — ĐẢO CHUÔNG'];
  title.textContent = nightNames[night];
  document.getElementById('night-label').textContent = nightNames[night];

  if (night === 1) {
    desc.textContent = 'Lời Ông Đăng: "Mây ơi, sương đen đã bao trùm Đảo Bến. Hãy dùng nón lá và ngọn đèn nhỏ của con gom đom đóm thắp sáng 5 Đèn Lồng Lớn nhé!"';
    btn.textContent = 'Bắt Đầu Đêm 1';
  } else if (night === 2) {
    desc.textContent = 'Lời Ông Đăng: "Đảo Cau gồm hai hòn đảo nối bằng cầu tre. Hãy dùng bục nhảy để phóng qua đảo đối diện, cẩn thận loài Gió Lạc bay nhanh chuyên cướp đom đóm, và nhặt Bùa Gió trên cầu để lướt liên tục!"';
    btn.textContent = 'Bắt Đầu Đêm 2';
  } else if (night === 3) {
    desc.textContent = 'Lời Ông Đăng: "Đảo Chuông có 3 tầng đá cao vút và ngọn Tháp Chuông ở đỉnh. Gió mạnh sẽ thổi từng cơn, hãy bước theo các đường dốc hoặc dùng bục nhảy bay lên tầng cao nhất!"';
    btn.textContent = 'Bắt Đầu Đêm 3';
  }

  modal.style.display = 'flex';
}

function showDawnVictoryModal() {
  const modal = document.getElementById('modal-start');
  const title = document.getElementById('start-title');
  const desc = document.getElementById('start-desc');
  const btn = document.getElementById('btn-start-game');

  title.textContent = 'BÌNH MINH TRÊN ĐẢO ĐÈN LỒNG';
  desc.innerHTML = `
    Chúc mừng Mây! Bạn đã thắp sáng tất cả các Đèn Lồng Lớn trên cả 3 Đêm! Sương đen đã tan biến hoàn toàn, ánh dương rực rỡ đã trở lại trên biển mây!<br><br>
    <b style="color:#f2c14e; font-size: 20px;">TỔNG ĐIỂM CHUNG CUỘC: ${cumulativeScore}</b>
  `;
  btn.textContent = 'Chơi Lại Từ Đêm 1';
  modal.style.display = 'flex';
}

function startNight(night) {
  currentNight = night;
  sim = new Simulation({ seed: Date.now(), night: currentNight });
  buildMapGeometry(currentNight);

  lanternMeshes.forEach(l => scene.remove(l.group));
  lanternMeshes = [];
  moteMeshes.forEach(m => scene.remove(m.mesh));
  moteMeshes = [];
  shadeMeshes.forEach(s => scene.remove(s.group));
  shadeMeshes = [];
  drifterMeshes.forEach(d => scene.remove(d.mesh));
  drifterMeshes = [];
  charmMeshes.forEach(c => scene.remove(c.mesh));
  charmMeshes = [];

  document.getElementById('modal-start').style.display = 'none';
  sounds.init();
}

function setupInputs() {
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyE') sim.setInput({ interact: true });
    if (e.code === 'KeyQ') sim.setInput({ pulse: true });
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyF') sim.setInput({ dash: true });
    if (e.code === 'Space') sim.setInput({ jump: true });
    if (e.code === 'Escape' || e.code === 'KeyP') {
      sim.setInput({ pause: true });
      togglePauseMenu();
    }
  });

  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'KeyE') sim.setInput({ interact: false });
    if (e.code === 'KeyQ') sim.setInput({ pulse: false });
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyF') sim.setInput({ dash: false });
    if (e.code === 'Space') sim.setInput({ jump: false });
    if (e.code === 'Escape' || e.code === 'KeyP') sim.setInput({ pause: false });
  });

  window.addEventListener('mousedown', e => {
    if (e.button === 2) sim.setInput({ pulse: true });
    else if (e.button === 0) mouseLook = true;
  });
  window.addEventListener('mouseup', e => {
    if (e.button === 2) sim.setInput({ pulse: false });
    else if (e.button === 0) mouseLook = false;
  });
  window.addEventListener('contextmenu', e => e.preventDefault());

  window.addEventListener('mousemove', e => {
    if (mouseLook) {
      cameraYaw -= e.movementX * 0.25 * mouseSens;
      cameraPitch = Math.max(5, Math.min(65, cameraPitch + e.movementY * 0.25 * mouseSens));
    }
  });

  document.getElementById('btn-start-game').addEventListener('click', () => {
    if (currentNight > 3) {
      currentNight = 1;
      cumulativeScore = 0;
    }
    startNight(currentNight);
  });

  document.getElementById('btn-resume').addEventListener('click', () => {
    sim.setInput({ pause: true });
    togglePauseMenu();
  });

  document.getElementById('btn-restart-night').addEventListener('click', () => {
    document.getElementById('modal-pause').style.display = 'none';
    startNight(currentNight);
  });

  document.getElementById('btn-to-menu').addEventListener('click', () => {
    document.getElementById('modal-pause').style.display = 'none';
    showStartNightModal(1);
  });

  document.getElementById('btn-settings-open').addEventListener('click', () => {
    document.getElementById('modal-settings').style.display = 'flex';
  });
  document.getElementById('btn-settings-close').addEventListener('click', () => {
    document.getElementById('modal-settings').style.display = 'none';
  });
  document.getElementById('setting-vol').addEventListener('input', e => {
    sounds.setVolume(parseFloat(e.target.value));
  });
  document.getElementById('setting-sens').addEventListener('input', e => {
    mouseSens = parseFloat(e.target.value);
    localStorage.setItem('dao_den_long_sens', mouseSens.toString());
  });

  const cbToggle = document.getElementById('setting-colorblind');
  if (cbToggle) {
    cbToggle.checked = colorblindMode;
    cbToggle.addEventListener('change', e => {
      colorblindMode = e.target.checked;
      localStorage.setItem('dao_den_long_colorblind', colorblindMode.toString());
    });
  }
}

function togglePauseMenu() {
  const pModal = document.getElementById('modal-pause');
  pModal.style.display = sim.paused ? 'flex' : 'none';
}

function updateCamera() {
  const yawRad = (cameraYaw * Math.PI) / 180;
  const pitchRad = (cameraPitch * Math.PI) / 180;

  const camX = sim.player.pos[0] + cameraDistance * Math.sin(yawRad) * Math.cos(pitchRad);
  const camY = sim.player.pos[1] + 1.2 + cameraDistance * Math.sin(pitchRad);
  const camZ = sim.player.pos[2] + cameraDistance * Math.cos(yawRad) * Math.cos(pitchRad);

  camera.position.set(camX, camY, camZ);
  camera.lookAt(sim.player.pos[0], sim.player.pos[1] + 1.2, sim.player.pos[2]);

  const moveX = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
  const moveZ = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
  if (moveX !== 0 || moveZ !== 0) {
    const moveAngle = Math.atan2(moveX, moveZ);
    playerMesh.rotation.y = yawRad + moveAngle;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let lastTickTime = performance.now();
const tickInterval = 1000 / 60;

function animate(now) {
  requestAnimationFrame(animate);

  if (!sim) {
    renderer.render(scene, camera);
    return;
  }

  while (now - lastTickTime >= tickInterval) {
    if (sim.state === 'playing' && !sim.paused) {
      let mx = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
      let mz = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
      sim.setInput({
        move: [mx, mz],
        cam_yaw_deg: cameraYaw
      });

      const events = sim.step();
      for (const evt of events) {
        if (evt.name === 'mote_picked') sounds.playMotePickup();
        if (evt.name === 'deposit') sounds.playDeposit();
        if (evt.name === 'refuel') sounds.playDeposit();
        if (evt.name === 'lantern_lit') sounds.playLanternLit();
        if (evt.name === 'lantern_out') sounds.playPlayerHit();
        if (evt.name === 'dash') sounds.playDash();
        if (evt.name === 'charm_picked') sounds.playCharm();
        if (evt.name === 'pulse') {
          sounds.playPulse();
          pulseTimer = 0.4;
        }
        if (evt.name === 'player_hit') sounds.playPlayerHit();
        if (evt.name === 'game_over') {
          if (evt.data.result === 'won') {
            cumulativeScore += sim.score;
            sounds.playVictory();
            if (currentNight < 3) {
              currentNight++;
              showStartNightModal(currentNight);
            } else {
              showDawnVictoryModal();
            }
          } else {
            sounds.playDefeat();
            showStartNightModal(currentNight);
          }
        }
      }
    }
    lastTickTime += tickInterval;
  }

  updateVisualEntities();
  updateCamera();
  updateHUD();

  renderer.render(scene, camera);
}

initThree();
playerMesh = buildPlayer();
setupInputs();
showStartNightModal(1);
requestAnimationFrame(animate);
