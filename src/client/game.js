import * as THREE from '/three';
import { Simulation } from '../core/simulation.js';
import { sounds } from './audio.js';
import { PRNG } from '../core/rng.js';

let sim = null;
let currentNight = 1;
let cumulativeScore = 0;
let scene, camera, renderer, ambientLight, moonLight;
let sunLight, sunMesh, cloudsMesh;
let isDawnCinematic = false;
let dawnStartTime = 0;
let dawnDurationS = 5.0;
let onDawnComplete = null;

let cheatGodMode = false;
let cheatSuperSpeed = false;
let playerMesh, hatLanternLight;
let playerParts = { legL: null, legR: null, armL: null, armR: null, body: null, hat: null, scarf: null };
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
let reduceMotion = localStorage.getItem('dao_den_long_reduce_motion') === 'true';
let largeFont = localStorage.getItem('dao_den_long_large_font') === 'true';

// Keybindings configuration
const defaultKeybinds = {
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  jump: 'Space',
  dash: 'ShiftLeft',
  interact: 'KeyE',
  pulse: 'KeyQ',
  pause: 'Escape'
};

let keybinds = { ...defaultKeybinds };
try {
  const savedKeys = JSON.parse(localStorage.getItem('dao_den_long_keybinds') || '{}');
  keybinds = { ...defaultKeybinds, ...savedKeys };
} catch (e) {}

let recordingAction = null;

// Benchmark URL parameters
const urlParams = new URLSearchParams(window.location.search);
const isBenchmark = urlParams.get('benchmark') === 'true' || urlParams.get('bench') === '1';
const benchSeed = parseInt(urlParams.get('seed') || '42', 10);
const benchDuration = parseFloat(urlParams.get('duration') || '30');

let benchStartTime = 0;
let benchFirstFrameTime = 0;
let benchDtList = [];
let benchLoadMs = 0;
let benchFinished = false;

const keys = {};

function initThree() {
  if (largeFont) document.body.classList.add('large-font');
  if (reduceMotion) document.body.classList.add('reduce-motion');

  const canvas = document.getElementById('game-canvas');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1430); // Standardized sky color
  scene.fog = new THREE.FogExp2(0x1b2350, 0.015); // Standardized fog color

  const width = isBenchmark ? 1280 : window.innerWidth;
  const height = isBenchmark ? 720 : window.innerHeight;

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 600);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(isBenchmark ? 1 : Math.min(window.devicePixelRatio, 1.25));
  renderer.shadowMap.enabled = true;

  if (isBenchmark) {
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'none';
  }

  ambientLight = new THREE.AmbientLight(0x2f5d50, 0.2);
  scene.add(ambientLight);

  moonLight = new THREE.DirectionalLight(0xffe9b0, 0.5);
  moonLight.position.set(40, 70, 30);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 1024;
  moonLight.shadow.mapSize.height = 1024;
  scene.add(moonLight);

  // Sea of clouds
  const cloudGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0x12384a, transparent: true, opacity: 0.85 });
  const clouds = new THREE.Mesh(cloudGeo, cloudMat);
  clouds.rotation.x = -Math.PI / 2;
  clouds.position.y = -8;
  scene.add(clouds);
  cloudsMesh = clouds;

  // Sun Light for Dawn
  sunLight = new THREE.DirectionalLight(0xfffae0, 0.0);
  sunLight.position.set(0, -20, -120);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // Sun visual sphere with radiant halo
  const sunGroup = new THREE.Group();
  const sunCoreGeo = new THREE.SphereGeometry(14, 32, 32);
  const sunCoreMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
  const sunCore = new THREE.Mesh(sunCoreGeo, sunCoreMat);
  sunGroup.add(sunCore);

  const sunGlowGeo = new THREE.SphereGeometry(24, 32, 32);
  const sunGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffa726,
    transparent: true,
    opacity: 0.5,
    side: THREE.BackSide
  });
  const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
  sunGroup.add(sunGlow);

  sunGroup.position.set(0, -40, -140);
  sunGroup.visible = false;
  scene.add(sunGroup);
  sunMesh = sunGroup;

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
    // Đảo Chuông: Wide Grand Island with flat Courtyard Terraces and Bell Tower
    // Base Island: r=45m at Y=0
    const t0Geo = new THREE.CylinderGeometry(45, 47, 4, 48);
    const t0 = new THREE.Mesh(t0Geo, grassMat);
    t0.position.y = -2;
    scene.add(t0);
    islandMeshes.push(t0);

    // Flat decorative stone courtyard ring (height 0.12m, no collision ledge)
    const t1Geo = new THREE.CylinderGeometry(24, 24, 0.12, 36);
    const t1 = new THREE.Mesh(t1Geo, sandMat);
    t1.position.set(0, 0.06, 0);
    scene.add(t1);
    islandMeshes.push(t1);

    // Flat decorative shrine courtyard (height 0.18m)
    const t2Geo = new THREE.CylinderGeometry(10, 10, 0.18, 24);
    const t2 = new THREE.Mesh(t2Geo, woodMat);
    t2.position.set(0, 0.09, 0);
    scene.add(t2);
    islandMeshes.push(t2);

    // Bell Tower at center of Island (radius 2.0m, height 8m)
    const towerGeo = new THREE.CylinderGeometry(2.0, 2.3, 8, 16);
    const tower = new THREE.Mesh(towerGeo, woodMat);
    tower.position.set(0, 4.0, 0);
    scene.add(tower);
    islandMeshes.push(tower);

    // Pagoda roof for Bell Tower
    const roofGeo = new THREE.ConeGeometry(3.5, 1.8, 8);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 8.8, 0);
    scene.add(roof);
    islandMeshes.push(roof);
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

  // 1. Lower Body / Robe Base
  const bodyGeo = new THREE.ConeGeometry(0.5, 1.0, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.6 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.65;
  group.add(body);
  playerParts.body = body;

  // 2. Legs (Chân nhân vật Mây với giày vải xinh xắn)
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.8 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 0.7 });

  // Left Leg
  const legLGroup = new THREE.Group();
  legLGroup.position.set(0.16, 0.35, 0);
  const legLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.38, 8), legMat);
  legLMesh.position.y = -0.15;
  legLGroup.add(legLMesh);
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.22), shoeMat);
  shoeL.position.set(0, -0.32, 0.04);
  legLGroup.add(shoeL);
  group.add(legLGroup);
  playerParts.legL = legLGroup;

  // Right Leg
  const legRGroup = new THREE.Group();
  legRGroup.position.set(-0.16, 0.35, 0);
  const legRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.38, 8), legMat);
  legRMesh.position.y = -0.15;
  legRGroup.add(legRMesh);
  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.22), shoeMat);
  shoeR.position.set(0, -0.32, 0.04);
  legRGroup.add(shoeR);
  group.add(legRGroup);
  playerParts.legR = legRGroup;

  // 3. Arms (Tay áo thụng truyền thống)
  const armMat = new THREE.MeshStandardMaterial({ color: 0xd8d2bf, roughness: 0.6 });

  // Left Arm
  const armLGroup = new THREE.Group();
  armLGroup.position.set(0.38, 0.95, 0);
  const armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.42, 8), armMat);
  armLMesh.position.y = -0.16;
  armLMesh.rotation.z = -0.2;
  armLGroup.add(armLMesh);
  group.add(armLGroup);
  playerParts.armL = armLGroup;

  // Right Arm
  const armRGroup = new THREE.Group();
  armRGroup.position.set(-0.38, 0.95, 0);
  const armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.42, 8), armMat);
  armRMesh.position.y = -0.16;
  armRMesh.rotation.z = 0.2;
  armRGroup.add(armRMesh);
  group.add(armRGroup);
  playerParts.armR = armRGroup;

  // 4. Red Scarf (Khăn rằn / khăn quàng đỏ)
  const scarfGeo = new THREE.TorusGeometry(0.3, 0.08, 8, 16);
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xc8102e });
  const scarf = new THREE.Mesh(scarfGeo, scarfMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.15;
  group.add(scarf);
  playerParts.scarf = scarf;

  // 5. Head & Cute Face
  const headGeo = new THREE.SphereGeometry(0.26, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfbd38d, roughness: 0.5 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.25;

  // Expressive dark eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a202c });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
  eyeL.position.set(0.08, 0.02, 0.24);
  head.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
  eyeR.position.set(-0.08, 0.02, 0.24);
  head.add(eyeR);

  group.add(head);

  // 6. Conical Hat (Nón Lá)
  const hatGeo = new THREE.ConeGeometry(0.85, 0.4, 24);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.8 });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.y = 1.48;
  group.add(hat);
  playerParts.hat = hat;

  // 7. Mini Lantern on Hat
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

  // 2. Motes (Fireflies) - High Performance: Glowing Emissive Material without 100 dynamic point lights
  const moteGeo = new THREE.SphereGeometry(0.2, 10, 10);
  const moteMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
  while (moteMeshes.length < sim.motes.length) {
    const mesh = new THREE.Mesh(moteGeo, moteMat);
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
  currentNight = night;
  const modal = document.getElementById('modal-start');
  const title = document.getElementById('start-title');
  const desc = document.getElementById('start-desc');
  const btn = document.getElementById('btn-start-game');

  const nightNames = ['', 'ĐÊM 1 — ĐẢO BẾN', 'ĐÊM 2 — ĐẢO CAU', 'ĐÊM 3 — ĐẢO CHUÔNG'];
  title.textContent = nightNames[night] || `ĐÊM ${night}`;
  const labelEl = document.getElementById('night-label');
  if (labelEl) labelEl.textContent = nightNames[night] || `ĐÊM ${night}`;

  if (night === 1) {
    desc.textContent = 'Lời Ông Đăng: "Mây ơi, sương đen đã bao trùm Đảo Bến. Hãy dùng nón lá và ngọn đèn nhỏ của con gom đom đóm thắp sáng 5 Đèn Lồng Lớn nhé!"';
    btn.textContent = 'Bắt Đầu Đêm 1';
  } else if (night === 2) {
    desc.textContent = 'Lời Ông Đăng: "Đảo Cau gồm hai hòn đảo nối bằng cầu tre. Hãy dùng bục nhảy để phóng qua đảo đối diện, cẩn thận loài Gió Lạc bay nhanh chuyên cướp đom đóm, và nhặt Bùa Gió trên cầu để lướt liên tục!"';
    btn.textContent = 'Bắt Đầu Đêm 2';
  } else if (night === 3) {
    desc.textContent = 'Lời Ông Đăng: "Đảo Chuông có khuôn viên Tháp Chuông uy nghiêm. Gió mạnh sẽ thổi từng cơn, hãy gom đom đóm thắp sáng 7 Đèn Lồng và giữ ánh sáng tới bình minh!"';
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
  const labelEl = document.getElementById('night-label');
  if (labelEl) labelEl.textContent = 'HOÀN THÀNH 3 ĐÊM';
  desc.innerHTML = `
    Chúc mừng Mây! Bạn đã thắp sáng tất cả các Đèn Lồng Lớn trên cả 3 Đêm! Sương đen đã tan biến hoàn toàn, ánh dương rực rỡ đã trở lại trên biển mây!<br><br>
    <b style="color:#f2c14e; font-size: 20px;">TỔNG ĐIỂM CHUNG CUỘC: ${cumulativeScore}</b>
  `;
  btn.textContent = 'Chơi Lại Từ Đêm 1';
  modal.style.display = 'flex';
}

function startNight(night) {
  currentNight = night;
  const nightNames = ['', 'ĐÊM 1 — ĐẢO BẾN', 'ĐÊM 2 — ĐẢO CAU', 'ĐÊM 3 — ĐẢO CHUÔNG'];
  const labelEl = document.getElementById('night-label');
  if (labelEl) labelEl.textContent = nightNames[night] || `ĐÊM ${night}`;

  const restartBtn = document.getElementById('btn-restart-night');
  if (restartBtn) restartBtn.textContent = `Chơi Lại Đêm ${currentNight}`;

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

  // Reset visual state from dawn back to dark night
  isDawnCinematic = false;
  onDawnComplete = null;
  if (sunMesh) sunMesh.visible = false;
  if (sunLight) sunLight.intensity = 0;
  if (moonLight) moonLight.intensity = 0.5;
  if (ambientLight) {
    ambientLight.color.setHex(0x2f5d50);
    ambientLight.intensity = 0.2;
  }
  if (scene) {
    scene.background.setHex(0x0e1430);
    if (scene.fog) {
      scene.fog.color.setHex(0x1b2350);
      scene.fog.density = 0.015;
    }
  }
  if (cloudsMesh) {
    cloudsMesh.material.color.setHex(0x12384a);
  }
  const dawnBanner = document.getElementById('dawn-banner');
  if (dawnBanner) dawnBanner.style.display = 'none';

  // Apply cheat states if enabled
  if (cheatGodMode && sim) {
    sim.player.flames = 3;
  }
  if (cheatSuperSpeed && sim) {
    sim.tuning.speed = 13.0;
    sim.tuning.dash_speed = 26.0;
    sim.player.dash_cd = 0;
  }
}

function triggerDawnCinematic(onComplete) {
  if (isDawnCinematic) return;
  isDawnCinematic = true;
  dawnStartTime = performance.now();
  onDawnComplete = onComplete || null;

  if (sunMesh) {
    sunMesh.visible = true;
    sunMesh.position.set(0, -35, -140);
  }
  const banner = document.getElementById('dawn-banner');
  if (banner) {
    banner.style.display = 'block';
  }
  sounds.playDawnSunrise();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showSubtitle(text, durationMs = 3500) {
  const banner = document.getElementById('subtitle-banner');
  if (!banner) return;
  banner.textContent = text;
  banner.style.display = 'block';
  clearTimeout(banner._timeout);
  banner._timeout = setTimeout(() => {
    banner.style.display = 'none';
  }, durationMs);
}

function showEdgeAlert(targetPos) {
  const arrow = document.getElementById('edge-alert-indicator');
  if (!arrow || !targetPos) return;
  const p3 = new THREE.Vector3(targetPos[0], targetPos[1] + 1, targetPos[2]);
  p3.project(camera);
  const angle = Math.atan2(-p3.y, p3.x);
  const screenX = window.innerWidth / 2 + Math.cos(angle) * (window.innerWidth / 2 - 35);
  const screenY = window.innerHeight / 2 + Math.sin(angle) * (window.innerHeight / 2 - 35);
  arrow.style.left = `${screenX}px`;
  arrow.style.top = `${screenY}px`;
  arrow.style.transform = `translate(-50%, -50%) rotate(${angle + Math.PI / 2}rad)`;
  arrow.style.display = 'block';
  clearTimeout(arrow._timeout);
  arrow._timeout = setTimeout(() => {
    arrow.style.display = 'none';
  }, 3000);
}

async function loadLeaderboardUI() {
  const tbody = document.getElementById('leaderboard-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Đang tải...</td></tr>';
  let entries = [];
  try {
    const res = await fetch('/api/leaderboard');
    if (res.ok) {
      const data = await res.json();
      entries = data.entries || [];
    }
  } catch (e) {
    try {
      entries = JSON.parse(localStorage.getItem('dao_den_long_lb') || '[]');
    } catch (err) {}
  }
  if (!entries || entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#a0aec0;">Chưa có bản ghi nào</td></tr>';
    return;
  }
  let html = '';
  entries.slice(0, 10).forEach((entry, idx) => {
    const d = new Date(entry.achieved_at);
    const dateStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    html += `<tr>
      <td style="font-weight:bold; color:${idx === 0 ? 'var(--color-gold)' : '#cbd5e0'};">#${idx + 1}</td>
      <td style="font-weight:bold;">${escapeHtml(entry.name)}</td>
      <td style="color:var(--color-gold); font-weight:bold;">${entry.score}</td>
      <td>${entry.nights_won} / 3</td>
      <td style="font-size:12px; color:#a0aec0;">${dateStr}</td>
    </tr>`;
  });
  tbody.innerHTML = html;
}

let pendingGameResult = null;
function promptSaveScore(result, score, nightsWon, seed) {
  pendingGameResult = { result, score, nightsWon, seed };
  const saveModal = document.getElementById('modal-save-score');
  const title = document.getElementById('save-score-title');
  const desc = document.getElementById('save-score-desc');
  if (title) title.textContent = result === 'won' ? 'BÌNH MINH LÊN — LƯU ĐIỂM XẾP HẠNG' : `KẾT THÚC ĐÊM ${currentNight} — THỬ LẠI`;
  if (desc) desc.textContent = result === 'won'
    ? `Chúc mừng! Tổng điểm: ${score} · Hoàn thành: ${nightsWon}/3 Đêm. Hãy ghi danh vào bảng vàng!`
    : `Tổng điểm: ${score} · Số Đêm vượt qua: ${nightsWon}/3. Bạn có thể lưu điểm hoặc bấm Thử Lại để chơi lại ngay Đêm ${currentNight}!`;
  const nameInput = document.getElementById('input-player-name');
  if (nameInput) nameInput.value = localStorage.getItem('dao_den_long_last_player_name') || 'NguoiChoi_1';
  const skipBtn = document.getElementById('btn-save-score-skip');
  if (skipBtn) skipBtn.textContent = result === 'won' ? 'Tiếp Tục' : `Chơi Lại Đêm ${currentNight}`;
  if (saveModal) saveModal.style.display = 'flex';
}

function updateKeybindButtons() {
  document.querySelectorAll('.keybind-btn[data-action]').forEach(btn => {
    const act = btn.dataset.action;
    btn.textContent = keybinds[act] || 'None';
  });
}

function setupInputs() {
  updateKeybindButtons();

  document.querySelectorAll('.keybind-btn[data-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.keybind-btn[data-action]').forEach(b => b.classList.remove('recording'));
      btn.classList.add('recording');
      btn.textContent = 'Bấm phím...';
      recordingAction = btn.dataset.action;
    });
  });

  const restoreBtn = document.getElementById('btn-restore-defaults');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
      keybinds = { ...defaultKeybinds };
      localStorage.setItem('dao_den_long_keybinds', JSON.stringify(keybinds));
      const warn = document.getElementById('key-conflict-warning');
      if (warn) warn.style.display = 'none';
      updateKeybindButtons();
    });
  }

  window.addEventListener('keydown', e => {
    if (recordingAction) {
      e.preventDefault();
      keybinds[recordingAction] = e.code;
      const acts = Object.keys(keybinds);
      const conflict = acts.some(a1 => acts.some(a2 => a1 !== a2 && keybinds[a1] === keybinds[a2]));
      const warn = document.getElementById('key-conflict-warning');
      if (warn) warn.style.display = conflict ? 'block' : 'none';
      localStorage.setItem('dao_den_long_keybinds', JSON.stringify(keybinds));
      recordingAction = null;
      document.querySelectorAll('.keybind-btn[data-action]').forEach(b => b.classList.remove('recording'));
      updateKeybindButtons();
      return;
    }

    keys[e.code] = true;
    if (e.code === keybinds.interact) sim?.setInput({ interact: true });
    if (e.code === keybinds.pulse) sim?.setInput({ pulse: true });
    if (e.code === keybinds.dash || e.code === 'KeyF') sim?.setInput({ dash: true });
    if (e.code === keybinds.jump) sim?.setInput({ jump: true });
    if (e.code === keybinds.pause || e.code === 'KeyP') {
      sim?.setInput({ pause: true });
      togglePauseMenu();
    }
  });

  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === keybinds.interact) sim?.setInput({ interact: false });
    if (e.code === keybinds.pulse) sim?.setInput({ pulse: false });
    if (e.code === keybinds.dash || e.code === 'KeyF') sim?.setInput({ dash: false });
    if (e.code === keybinds.jump) sim?.setInput({ jump: false });
    if (e.code === keybinds.pause || e.code === 'KeyP') sim?.setInput({ pause: false });
  });

  window.addEventListener('mousedown', e => {
    if (e.button === 2) sim?.setInput({ pulse: true });
    else if (e.button === 0) mouseLook = true;
  });
  window.addEventListener('mouseup', e => {
    if (e.button === 2) sim?.setInput({ pulse: false });
    else if (e.button === 0) mouseLook = false;
  });
  window.addEventListener('contextmenu', e => e.preventDefault());

  window.addEventListener('mousemove', e => {
    if (mouseLook && !reduceMotion) {
      cameraYaw -= e.movementX * 0.25 * mouseSens;
      cameraPitch = Math.max(5, Math.min(65, cameraPitch + e.movementY * 0.25 * mouseSens));
    }
  });

  document.getElementById('btn-start-game')?.addEventListener('click', () => {
    if (currentNight > 3) {
      currentNight = 1;
      cumulativeScore = 0;
    }
    startNight(currentNight);
  });

  document.getElementById('btn-resume')?.addEventListener('click', () => {
    sim?.setInput({ pause: true });
    togglePauseMenu();
  });

  document.getElementById('btn-restart-night')?.addEventListener('click', () => {
    document.getElementById('modal-pause').style.display = 'none';
    startNight(currentNight);
  });

  document.getElementById('btn-to-menu')?.addEventListener('click', () => {
    document.getElementById('modal-pause').style.display = 'none';
    showStartNightModal(1);
  });

  // Leaderboard modal buttons
  const openLb = () => {
    loadLeaderboardUI();
    document.getElementById('modal-leaderboard').style.display = 'flex';
  };
  document.getElementById('btn-leaderboard-start')?.addEventListener('click', openLb);
  document.getElementById('btn-leaderboard-pause')?.addEventListener('click', openLb);
  document.getElementById('btn-leaderboard-close')?.addEventListener('click', () => {
    document.getElementById('modal-leaderboard').style.display = 'none';
    if (pendingGameResult && pendingGameResult.result === 'lost') {
      startNight(currentNight);
    } else if (pendingGameResult && pendingGameResult.result === 'won' && currentNight < 3) {
      showStartNightModal(currentNight);
    } else {
      showStartNightModal(1);
    }
  });

  // Save score modal buttons
  document.getElementById('btn-save-score-submit')?.addEventListener('click', async () => {
    const nameInput = document.getElementById('input-player-name');
    const name = nameInput.value.trim();
    const errorEl = document.getElementById('save-score-error');
    if (!/^[A-Za-z0-9_]{3,12}$/.test(name)) {
      if (errorEl) errorEl.style.display = 'block';
      return;
    }
    if (errorEl) errorEl.style.display = 'none';
    localStorage.setItem('dao_den_long_last_player_name', name);

    const payload = {
      name,
      score: pendingGameResult ? pendingGameResult.score : 0,
      nights_won: pendingGameResult ? pendingGameResult.nightsWon : 0,
      seed: pendingGameResult ? pendingGameResult.seed : 0,
      achieved_at: new Date().toISOString()
    };

    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Offline fallback: save to localStorage
      try {
        const lb = JSON.parse(localStorage.getItem('dao_den_long_lb') || '[]');
        lb.push(payload);
        lb.sort((a, b) => b.score !== a.score ? b.score - a.score : new Date(a.achieved_at) - new Date(b.achieved_at));
        localStorage.setItem('dao_den_long_lb', JSON.stringify(lb.slice(0, 10)));
      } catch (e) {}
    }

    document.getElementById('modal-save-score').style.display = 'none';
    openLb();
  });

  document.getElementById('btn-save-score-skip')?.addEventListener('click', () => {
    document.getElementById('modal-save-score').style.display = 'none';
    if (pendingGameResult && pendingGameResult.result === 'lost') {
      startNight(currentNight);
    } else {
      showStartNightModal(1);
    }
  });

  document.getElementById('btn-settings-open')?.addEventListener('click', () => {
    document.getElementById('modal-settings').style.display = 'flex';
  });
  document.getElementById('btn-settings-close')?.addEventListener('click', () => {
    document.getElementById('modal-settings').style.display = 'none';
  });

  document.getElementById('setting-vol')?.addEventListener('input', e => {
    sounds.setVolume(parseFloat(e.target.value));
  });
  document.getElementById('setting-sens')?.addEventListener('input', e => {
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

  const rmToggle = document.getElementById('setting-reduce-motion');
  if (rmToggle) {
    rmToggle.checked = reduceMotion;
    rmToggle.addEventListener('change', e => {
      reduceMotion = e.target.checked;
      localStorage.setItem('dao_den_long_reduce_motion', reduceMotion.toString());
      if (reduceMotion) document.body.classList.add('reduce-motion');
      else document.body.classList.remove('reduce-motion');
    });
  }

  const lfToggle = document.getElementById('setting-large-font');
  if (lfToggle) {
    lfToggle.checked = largeFont;
    lfToggle.addEventListener('change', e => {
      largeFont = e.target.checked;
      localStorage.setItem('dao_den_long_large_font', largeFont.toString());
      if (largeFont) document.body.classList.add('large-font');
      else document.body.classList.remove('large-font');
    });
  }
}

function setupCheats() {
  const modalCheat = document.getElementById('modal-cheat');
  const toggleCheat = () => {
    if (!modalCheat) return;
    const isHidden = modalCheat.style.display === 'none' || !modalCheat.style.display;
    modalCheat.style.display = isHidden ? 'flex' : 'none';
  };

  document.getElementById('btn-toggle-cheat')?.addEventListener('click', toggleCheat);
  document.getElementById('btn-cheat-close')?.addEventListener('click', () => {
    if (modalCheat) modalCheat.style.display = 'none';
  });

  const doMaxMotes = () => {
    if (!sim) return;
    sim.player.carried = sim.getCapacity();
    showSubtitle('⚡ [CHEAT] Đã nạp đầy túi đom đóm!');
  };
  document.getElementById('cheat-max-motes')?.addEventListener('click', doMaxMotes);

  const doLightAll = () => {
    if (!sim) return;
    sim.lanterns.forEach(l => {
      l.lit = true;
      l.fuel_ticks = 6000;
      l.ever_lit = true;
    });
    showSubtitle('🏮 [CHEAT] Đã thắp sáng 100% & nạp đầy dầu mọi Đèn Lồng!');
  };
  document.getElementById('cheat-light-all')?.addEventListener('click', doLightAll);

  const doToggleGod = () => {
    cheatGodMode = !cheatGodMode;
    const statusEl = document.getElementById('cheat-god-status');
    if (statusEl) {
      statusEl.textContent = cheatGodMode ? '[Phím 3] ĐANG BẬT (Bất tử)' : '[Phím 3] Đang TẮT';
      statusEl.style.color = cheatGodMode ? '#f2c14e' : '#68d391';
    }
    if (cheatGodMode && sim) sim.player.flames = 3;
    showSubtitle(cheatGodMode ? '🛡️ [CHEAT] Bất tử (God Mode): BẬT' : '🛡️ [CHEAT] Bất tử: TẮT');
  };
  document.getElementById('cheat-god-mode')?.addEventListener('click', doToggleGod);

  const doToggleSpeed = () => {
    cheatSuperSpeed = !cheatSuperSpeed;
    const statusEl = document.getElementById('cheat-speed-status');
    if (statusEl) {
      statusEl.textContent = cheatSuperSpeed ? '[Phím 4] ĐANG BẬT (2x & 0s Dash)' : '[Phím 4] Đang TẮT';
      statusEl.style.color = cheatSuperSpeed ? '#f2c14e' : '#68d391';
    }
    showSubtitle(cheatSuperSpeed ? '🏃 [CHEAT] Tốc độ siêu tốc: BẬT' : '🏃 [CHEAT] Tốc độ: Bình thường');
  };
  document.getElementById('cheat-super-speed')?.addEventListener('click', doToggleSpeed);

  const doFreezeEnemies = () => {
    if (!sim) return;
    sim.shades.forEach(s => {
      s.state = 'stunned';
      s.state_ticks_left = 99999;
    });
    showSubtitle('❄️ [CHEAT] Đã đóng băng toàn bộ Bóng Mực!');
  };
  document.getElementById('cheat-freeze-enemies')?.addEventListener('click', doFreezeEnemies);

  const doClearEnemies = () => {
    if (!sim) return;
    sim.shades = [];
    sim.drifters = [];
    showSubtitle('🧹 [CHEAT] Đã dọn sạch quái vật trên đảo!');
  };
  document.getElementById('cheat-clear-enemies')?.addEventListener('click', doClearEnemies);

  const doSkipDawn = () => {
    if (!sim) return;
    const minLit = Math.ceil(0.6 * sim.lanterns.length);
    sim.lanterns.forEach((l, idx) => {
      if (idx < minLit || l.lit) {
        l.lit = true;
        l.fuel_ticks = 6000;
        l.ever_lit = true;
      }
    });
    sim.time_left_s = 2.0;
    if (modalCheat) modalCheat.style.display = 'none';
    showSubtitle('🌅 [CHEAT] Tua nhanh tới bình minh (2 giây)...');
  };
  document.getElementById('cheat-skip-dawn')?.addEventListener('click', doSkipDawn);

  const doPlayDawn = () => {
    if (modalCheat) modalCheat.style.display = 'none';
    showSubtitle('✨ [DEMO] Chiếu hoạt cảnh bình minh!');
    triggerDawnCinematic(() => {
      showSubtitle('🌅 [DEMO] Hoạt cảnh bình minh hoàn tất!');
    });
  };
  document.getElementById('cheat-play-dawn-anim')?.addEventListener('click', doPlayDawn);

  document.getElementById('cheat-night-1')?.addEventListener('click', () => {
    if (modalCheat) modalCheat.style.display = 'none';
    startNight(1);
    showSubtitle('🗺️ [DEMO] Chuyển tới Đêm 1 (Đảo Bến)!');
  });
  document.getElementById('cheat-night-2')?.addEventListener('click', () => {
    if (modalCheat) modalCheat.style.display = 'none';
    startNight(2);
    showSubtitle('🗺️ [DEMO] Chuyển tới Đêm 2 (Đảo Cau)!');
  });
  document.getElementById('cheat-night-3')?.addEventListener('click', () => {
    if (modalCheat) modalCheat.style.display = 'none';
    startNight(3);
    showSubtitle('🗺️ [DEMO] Chuyển tới Đêm 3 (Đảo Chuông)!');
  });

  window.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'F2' || e.code === 'Backquote') {
      e.preventDefault();
      toggleCheat();
      return;
    }
    if (e.code === 'Digit1') doMaxMotes();
    else if (e.code === 'Digit2') doLightAll();
    else if (e.code === 'Digit3') doToggleGod();
    else if (e.code === 'Digit4') doToggleSpeed();
    else if (e.code === 'Digit5') doFreezeEnemies();
    else if (e.code === 'Digit6') doClearEnemies();
    else if (e.code === 'Digit7') doSkipDawn();
    else if (e.code === 'Digit8') doPlayDawn();
  });
}

function togglePauseMenu() {
  const pModal = document.getElementById('modal-pause');
  const restartBtn = document.getElementById('btn-restart-night');
  if (restartBtn) restartBtn.textContent = `Chơi Lại Đêm ${currentNight}`;
  pModal.style.display = sim.paused ? 'flex' : 'none';
}

function updateCamera() {
  if (isBenchmark) return;

  const yawRad = (cameraYaw * Math.PI) / 180;
  const pitchRad = (cameraPitch * Math.PI) / 180;

  const camX = sim.player.pos[0] + cameraDistance * Math.sin(yawRad) * Math.cos(pitchRad);
  const camY = sim.player.pos[1] + 1.2 + cameraDistance * Math.sin(pitchRad);
  const camZ = sim.player.pos[2] + cameraDistance * Math.cos(yawRad) * Math.cos(pitchRad);

  camera.position.set(camX, camY, camZ);
  camera.lookAt(sim.player.pos[0], sim.player.pos[1] + 1.2, sim.player.pos[2]);

  const moveX = (keys[keybinds.right] ? 1 : 0) - (keys[keybinds.left] ? 1 : 0);
  const moveZ = (keys[keybinds.forward] ? 1 : 0) - (keys[keybinds.backward] ? 1 : 0);
  if (moveX !== 0 || moveZ !== 0) {
    const moveAngle = Math.atan2(moveX, moveZ);
    playerMesh.rotation.y = yawRad + moveAngle;
  }
}

function onWindowResize() {
  if (isBenchmark) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function startBenchmark() {
  currentNight = 1;
  sim = new Simulation({
    seed: benchSeed,
    night: 1,
    bench_mode: true,
    random_motes: false,
    random_shades: false,
    random_drifters: false
  });
  buildMapGeometry(1);

  // Setup 200 Shades in wander state
  const benchRng = new PRNG(benchSeed);
  sim.shades = [];
  for (let i = 0; i < 200; i++) {
    const r = benchRng.range(6, 38);
    const ang = benchRng.range(0, Math.PI * 2);
    sim.shades.push({
      id: `BS${i + 1}`,
      pos: [round3(Math.cos(ang) * r), 0, round3(Math.sin(ang) * r)],
      state: 'wander',
      state_ticks_left: 0,
      target_lantern_id: null,
      drain_ticks: 0,
      push_vec: [0, 0],
      push_ticks_left: 0,
      recoil_vec: [0, 0],
      recoil_ticks_left: 0
    });
  }

  // Setup 100 motes
  sim.motes = [];
  for (let i = 0; i < 100; i++) {
    const r = benchRng.range(4, 38);
    const ang = benchRng.range(0, Math.PI * 2);
    sim.motes.push({
      id: `BM${i + 1}`,
      pos: [round3(Math.cos(ang) * r), 0, round3(Math.sin(ang) * r)],
      kind: 'normal',
      ttl_ticks: null
    });
  }

  // Lanterns L1-L3 lit with fuel 100, L4-L5 unlit
  for (let i = 0; i < sim.lanterns.length; i++) {
    const l = sim.lanterns[i];
    if (i < 3) {
      l.lit = true;
      l.fuel_ticks = 6000;
    } else {
      l.lit = false;
      l.fuel_ticks = 0;
    }
  }

  const modalStart = document.getElementById('modal-start');
  if (modalStart) modalStart.style.display = 'none';

  benchStartTime = performance.now();
  console.log(`Benchmark started: 200 Shades, 100 motes, duration=${benchDuration}s`);
}

let lastTickTime = performance.now();
let lastFrameTime = performance.now();
let prevWindActive = false;
let notifiedTenSec = false;
const tickInterval = 1000 / 60;

function animate(now) {
  requestAnimationFrame(animate);

  if (!sim) {
    renderer.render(scene, camera);
    return;
  }

  if (isBenchmark) {
    if (benchFirstFrameTime === 0) {
      benchFirstFrameTime = now;
      benchLoadMs = Math.max(0, now - benchStartTime);
    }

    const elapsedS = (now - benchStartTime) / 1000.0;
    // Camera orbit: r=30m, y=15m, CCW looking from above, 15s per revolution
    const theta = (elapsedS / 15.0) * Math.PI * 2;
    camera.position.set(30 * Math.cos(theta), 15, -30 * Math.sin(theta));
    camera.lookAt(0, 0, 0);

    // Run simulation tick
    while (now - lastTickTime >= tickInterval) {
      sim.step();
      lastTickTime += tickInterval;
    }

    // Benchmark measurement (after 3s warmup)
    if (elapsedS >= 3.0 && elapsedS < 3.0 + benchDuration) {
      const dt = now - lastFrameTime;
      benchDtList.push(dt);
    }

    lastFrameTime = now;

    if (elapsedS >= 3.0 + benchDuration && !benchFinished) {
      benchFinished = true;
      const N = benchDtList.length;
      const totalDt = benchDtList.reduce((a, b) => a + b, 0);
      const avgFps = totalDt > 0 ? (1000 * N) / totalDt : 60;

      const sortedDesc = [...benchDtList].sort((a, b) => b - a);
      const k = Math.max(1, Math.ceil(0.01 * N));
      const topK = sortedDesc.slice(0, k);
      const avgK = topK.reduce((a, b) => a + b, 0) / k;
      const p1LowFps = avgK > 0 ? 1000 / avgK : avgFps;

      const sortedAsc = [...benchDtList].sort((a, b) => a - b);
      const p95Idx = Math.min(N - 1, Math.floor(0.95 * N));
      const frameMsP95 = sortedAsc[p95Idx] || (1000 / avgFps);

      const result = {
        contract_version: "1.3",
        avg_fps: Number(avgFps.toFixed(1)),
        p1_low_fps: Number(p1LowFps.toFixed(1)),
        frame_ms_p95: Number(frameMsP95.toFixed(1)),
        frames: N,
        load_ms: Math.round(benchLoadMs),
        peak_mem_mb: null,
        vsync_off: true,
        renderer: "Three.js r170 (WebGL)",
        os: navigator.platform || navigator.userAgent
      };

      window.__bench_done = true;
      window.__bench_result = result;
      console.log('Benchmark Result:', JSON.stringify(result, null, 2));

      fetch('/api/benchmark-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      }).catch(() => {});
    }

    updateVisualEntities();
    renderer.render(scene, camera);
    return;
  }

  // Normal Gameplay Loop
  while (now - lastTickTime >= tickInterval) {
    if (sim.state === 'playing' && !sim.paused) {
      // Cheat effects
      if (cheatGodMode) {
        sim.player.flames = 3;
      }
      if (cheatSuperSpeed) {
        sim.tuning.speed = 13.0;
        sim.tuning.dash_speed = 26.0;
        sim.player.dash_cd = 0;
      } else {
        sim.tuning.speed = 6.0;
        sim.tuning.dash_speed = 14.0;
      }

      let mx = (keys[keybinds.right] ? 1 : 0) - (keys[keybinds.left] ? 1 : 0);
      let mz = (keys[keybinds.forward] ? 1 : 0) - (keys[keybinds.backward] ? 1 : 0);
      sim.setInput({
        move: [mx, mz],
        cam_yaw_deg: cameraYaw
      });

      const events = sim.step();

      // Check Wind audio & visual alerts
      if (sim.wind.active && !prevWindActive) {
        showSubtitle('💨 Cơn gió mạnh đang thổi dữ dội!');
      }
      prevWindActive = sim.wind.active;

      // Check 10s countdown alert
      if (sim.time_left_s <= 10.0 && sim.time_left_s > 9.0 && !notifiedTenSec) {
        notifiedTenSec = true;
        showSubtitle('⏳ 10 giây cuối trước bình minh!');
      } else if (sim.time_left_s > 10.0) {
        notifiedTenSec = false;
      }

      for (const evt of events) {
        if (evt.name === 'mote_picked') sounds.playMotePickup();
        if (evt.name === 'deposit') sounds.playDeposit();
        if (evt.name === 'refuel') sounds.playDeposit();
        if (evt.name === 'lantern_lit') sounds.playLanternLit();
        if (evt.name === 'lantern_out') {
          sounds.playPlayerHit();
          showSubtitle(`⚠️ Đèn ${evt.data.lantern_id} đã tắt! Hãy châm thêm dầu.`);
        }
        if (evt.name === 'dash') sounds.playDash();
        if (evt.name === 'charm_picked') sounds.playCharm();
        if (evt.name === 'pulse') {
          sounds.playPulse();
          pulseTimer = 0.4;
        }
        if (evt.name === 'player_hit') sounds.playPlayerHit();
        if (evt.name === 'shade_spawned') {
          showSubtitle('⚠️ Bóng Mực vừa xuất hiện ở phía xa!');
          const s = sim.shades.find(sh => sh.id === evt.data.id);
          if (s) showEdgeAlert(s.pos);
        }
        if (evt.name === 'game_over') {
          if (evt.data.result === 'won') {
            cumulativeScore += sim.score;
            triggerDawnCinematic(() => {
              const banner = document.getElementById('dawn-banner');
              if (banner) banner.style.display = 'none';
              if (currentNight < 3) {
                currentNight++;
                showStartNightModal(currentNight);
              } else {
                showDawnVictoryModal();
                promptSaveScore('won', cumulativeScore, 3, sim.seed);
              }
            });
          } else {
            sounds.playDefeat();
            promptSaveScore('lost', cumulativeScore, currentNight - 1, sim.seed);
          }
        }
      }
    }
    lastTickTime += tickInterval;
  }

  updateVisualEntities();

  // Animate character walking (legs, arms, subtle bobbing)
  if (playerParts.legL && playerParts.legR && sim) {
    const isMoving = (Math.abs(sim.player.vel[0]) > 0.2 || Math.abs(sim.player.vel[2]) > 0.2) && sim.player.grounded;
    if (isMoving) {
      const walkCycle = now * 0.014;
      playerParts.legL.rotation.x = Math.sin(walkCycle) * 0.65;
      playerParts.legR.rotation.x = -Math.sin(walkCycle) * 0.65;
      if (playerParts.armL) playerParts.armL.rotation.x = -Math.sin(walkCycle) * 0.45;
      if (playerParts.armR) playerParts.armR.rotation.x = Math.sin(walkCycle) * 0.45;
      if (playerParts.body) playerParts.body.position.y = 0.65 + Math.abs(Math.sin(walkCycle)) * 0.06;
      if (playerParts.hat) playerParts.hat.rotation.z = Math.sin(walkCycle) * 0.04;
    } else if (!sim.player.grounded) {
      playerParts.legL.rotation.x = 0.25;
      playerParts.legR.rotation.x = -0.15;
      if (playerParts.armL) playerParts.armL.rotation.z = -0.4;
      if (playerParts.armR) playerParts.armR.rotation.z = 0.4;
    } else {
      const idle = Math.sin(now * 0.003) * 0.03;
      playerParts.legL.rotation.x = 0;
      playerParts.legR.rotation.x = 0;
      if (playerParts.armL) {
        playerParts.armL.rotation.x = 0;
        playerParts.armL.rotation.z = -0.15 + idle;
      }
      if (playerParts.armR) {
        playerParts.armR.rotation.x = 0;
        playerParts.armR.rotation.z = 0.15 - idle;
      }
      if (playerParts.body) playerParts.body.position.y = 0.65;
      if (playerParts.hat) playerParts.hat.rotation.z = 0;
    }
  }

  // Dawn Cinematic Update
  if (isDawnCinematic) {
    const elapsed = (now - dawnStartTime) / 1000.0;
    const progress = Math.min(1.0, elapsed / dawnDurationS);

    // 1. Sky color interpolation: 0x0e1430 -> 0xd85841 -> 0x6db0e8
    const nightSky = new THREE.Color(0x0e1430);
    const dawnTwilight = new THREE.Color(0xd85841);
    const morningSky = new THREE.Color(0x6db0e8);
    if (progress < 0.5) {
      scene.background.lerpColors(nightSky, dawnTwilight, progress * 2.0);
    } else {
      scene.background.lerpColors(dawnTwilight, morningSky, (progress - 0.5) * 2.0);
    }

    // 2. Fog interpolation: 0x1b2350 -> 0xe07a5f -> 0xffe2b8
    const nightFog = new THREE.Color(0x1b2350);
    const dawnFog = new THREE.Color(0xe07a5f);
    const morningFog = new THREE.Color(0xffe2b8);
    if (progress < 0.5) {
      scene.fog.color.lerpColors(nightFog, dawnFog, progress * 2.0);
    } else {
      scene.fog.color.lerpColors(dawnFog, morningFog, (progress - 0.5) * 2.0);
    }
    scene.fog.density = THREE.MathUtils.lerp(0.015, 0.007, progress);

    // 3. Ambient & Moon lights
    ambientLight.color.lerpColors(new THREE.Color(0x2f5d50), new THREE.Color(0xffedd4), progress);
    ambientLight.intensity = THREE.MathUtils.lerp(0.2, 0.95, progress);
    moonLight.intensity = THREE.MathUtils.lerp(0.5, 0.0, progress);

    // 4. Sun Light & Sun Mesh rise
    sunLight.intensity = THREE.MathUtils.lerp(0.0, 1.8, progress);
    const sunY = THREE.MathUtils.lerp(-35, 45, Math.sin(progress * Math.PI * 0.5));
    if (sunMesh) sunMesh.position.set(0, sunY, -140);
    sunLight.position.set(0, sunY, -100);

    // 5. Cloud plane color
    if (cloudsMesh) {
      cloudsMesh.material.color.lerpColors(new THREE.Color(0x12384a), new THREE.Color(0xffd1ba), progress);
    }

    // 6. Dissolve enemies in the light
    const enemyScale = Math.max(0, 1.0 - progress * 1.4);
    shadeMeshes.forEach(s => s.group && s.group.scale.setScalar(enemyScale));
    drifterMeshes.forEach(d => d.mesh && d.mesh.scale.setScalar(enemyScale));

    // 7. Cinematic camera orbit
    if (!reduceMotion) {
      cameraYaw += 0.22;
      cameraPitch = THREE.MathUtils.lerp(25, 14, progress);
      cameraDistance = THREE.MathUtils.lerp(11, 16, progress);
    }

    if (progress >= 1.0) {
      if (onDawnComplete) {
        const cb = onDawnComplete;
        onDawnComplete = null;
        setTimeout(() => cb(), 600);
      }
    }
  }

  updateCamera();
  updateHUD();

  renderer.render(scene, camera);
}

initThree();
playerMesh = buildPlayer();
setupInputs();
setupCheats();

if (isBenchmark) {
  startBenchmark();
} else {
  showStartNightModal(1);
}

requestAnimationFrame(animate);
