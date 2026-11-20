import * as THREE from '/three';
import { Simulation } from '../core/simulation.js';
import { sounds } from './audio.js';

let sim = null;
let scene, camera, renderer;
let playerMesh, hatLanternLight;
let lanternMeshes = [];
let moteMeshes = [];
let shadeMeshes = [];
let pulseMesh = null;
let pulseTimer = 0;

// Camera control
let cameraYaw = 0; // degrees
let cameraPitch = 25; // degrees
let cameraDistance = 10;
let isPointerLocked = false;

// Input tracking
const keys = {};
let mouseLook = false;

function initThree() {
  const canvas = document.getElementById('game-canvas');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060814);
  scene.fog = new THREE.FogExp2(0x080b18, 0.018);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Ambient & Moon Light
  const ambientLight = new THREE.AmbientLight(0x2a3352, 0.8);
  scene.add(ambientLight);

  const moonLight = new THREE.DirectionalLight(0x7f9cf5, 0.6);
  moonLight.position.set(30, 60, 20);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 1024;
  moonLight.shadow.mapSize.height = 1024;
  scene.add(moonLight);

  // Sea of Clouds underneath island
  const cloudGeo = new THREE.PlaneGeometry(300, 300, 32, 32);
  const cloudMat = new THREE.MeshBasicMaterial({
    color: 0x131a33,
    transparent: true,
    opacity: 0.7
  });
  const clouds = new THREE.Mesh(cloudGeo, cloudMat);
  clouds.rotation.x = -Math.PI / 2;
  clouds.position.y = -6;
  scene.add(clouds);

  buildIsland();
  buildStars();
  buildPulseSphere();

  window.addEventListener('resize', onWindowResize);
}

function buildStars() {
  const count = 600;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const r = 200;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.2,
    transparent: true,
    opacity: 0.8
  });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
}

function buildIsland() {
  const islandRadius = 35.0;
  // Island Top (lush dark grassy knoll)
  const topGeo = new THREE.CylinderGeometry(islandRadius, islandRadius + 2, 4, 48);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x1c3127,
    roughness: 0.9,
    metalness: 0.1
  });
  const island = new THREE.Mesh(topGeo, topMat);
  island.position.y = -2;
  island.receiveShadow = true;
  scene.add(island);

  // Decorative stone ring at island edge
  const ringGeo = new THREE.TorusGeometry(islandRadius, 0.4, 8, 64);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.8 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  scene.add(ring);

  // Circular stone path around the center
  const pathGeo = new THREE.RingGeometry(12, 14, 48);
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.9 });
  const path = new THREE.Mesh(pathGeo, pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.y = 0.02;
  scene.add(path);
}

function buildPlayer() {
  const group = new THREE.Group();

  // Robe / Body
  const bodyGeo = new THREE.ConeGeometry(0.5, 1.2, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.6 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfbd38d, roughness: 0.5 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.2;
  head.castShadow = true;
  group.add(head);

  // Nón Lá (Traditional Vietnamese Conical Hat)
  const hatGeo = new THREE.ConeGeometry(0.85, 0.4, 24);
  const hatMat = new THREE.MeshStandardMaterial({
    color: 0xd69e2e,
    roughness: 0.8,
    metalness: 0.1
  });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.y = 1.45;
  hat.castShadow = true;
  group.add(hat);

  // Small Glowing Lantern hanging from the hat rim
  const miniLanternGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.16, 8);
  const miniLanternMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xff9900,
    emissiveIntensity: 1.5
  });
  const miniLantern = new THREE.Mesh(miniLanternGeo, miniLanternMat);
  miniLantern.position.set(0.65, 1.25, 0.2);
  group.add(miniLantern);

  hatLanternLight = new THREE.PointLight(0xffb347, 1.2, 7);
  hatLanternLight.position.set(0.65, 1.25, 0.2);
  group.add(hatLanternLight);

  scene.add(group);
  return group;
}

function buildGrandLantern(lanternData) {
  const group = new THREE.Group();
  group.position.set(lanternData.pos[0], lanternData.pos[1], lanternData.pos[2]);

  // Stone Pedestal
  const baseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.6, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.9 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.3;
  base.castShadow = true;
  group.add(base);

  // Timber Post
  const postGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.2, 8);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x744210, roughness: 0.7 });
  const post = new THREE.Mesh(postGeo, postMat);
  post.position.y = 1.7;
  post.castShadow = true;
  group.add(post);

  // Lantern Chamber (Paper & Frame)
  const chamberGeo = new THREE.CylinderGeometry(0.7, 0.5, 1.1, 8);
  const chamberMat = new THREE.MeshStandardMaterial({
    color: lanternData.lit ? 0xffe066 : 0x4a321a,
    emissive: lanternData.lit ? 0xffaa00 : 0x110800,
    emissiveIntensity: lanternData.lit ? 2.5 : 0.2,
    transparent: true,
    opacity: 0.9
  });
  const chamber = new THREE.Mesh(chamberGeo, chamberMat);
  chamber.position.y = 2.8;
  group.add(chamber);

  // Lantern Pagoda Roof
  const roofGeo = new THREE.ConeGeometry(1.1, 0.5, 8);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x9b2c2c, roughness: 0.5 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 3.5;
  group.add(roof);

  // Point Light
  const light = new THREE.PointLight(
    0xff9900,
    lanternData.lit ? 3.5 : 0.2,
    lanternData.lit ? 24 : 3
  );
  light.position.y = 2.8;
  group.add(light);

  scene.add(group);
  return { id: lanternData.id, group, chamber, light, data: lanternData };
}

function buildPulseSphere() {
  const geo = new THREE.SphereGeometry(1, 24, 24);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.4,
    wireframe: true
  });
  pulseMesh = new THREE.Mesh(geo, mat);
  pulseMesh.visible = false;
  scene.add(pulseMesh);
}

function updateVisualEntities() {
  // 1. Lanterns
  for (const lData of sim.lanterns) {
    let lMesh = lanternMeshes.find(m => m.id === lData.id);
    if (!lMesh) {
      lMesh = buildGrandLantern(lData);
      lanternMeshes.push(lMesh);
    }
    // Update lighting state if lit status changed
    if (lData.lit) {
      lMesh.chamber.material.color.setHex(0xffe066);
      lMesh.chamber.material.emissive.setHex(0xffaa00);
      lMesh.chamber.material.emissiveIntensity = 3.0;
      lMesh.light.intensity = 4.0;
      lMesh.light.distance = 26;
    }
  }

  // 2. Motes (Fireflies)
  while (moteMeshes.length < sim.motes.length) {
    const geo = new THREE.SphereGeometry(0.18, 12, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffeb3b,
      emissive: 0xffd700,
      emissiveIntensity: 2.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    const pLight = new THREE.PointLight(0xffea00, 0.8, 4);
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
    // Gentle floating bob
    const bob = Math.sin(Date.now() * 0.004 + i) * 0.2 + 0.4;
    mMesh.mesh.position.set(mData.pos[0], mData.pos[1] + bob, mData.pos[2]);
  }

  // 3. Shades (Bóng Mực)
  while (shadeMeshes.length < sim.shades.length) {
    const group = new THREE.Group();
    // Shadow blob
    const blobGeo = new THREE.DodecahedronGeometry(0.7, 1);
    const blobMat = new THREE.MeshStandardMaterial({
      color: 0x120826,
      emissive: 0x24083d,
      roughness: 0.9,
      transparent: true,
      opacity: 0.88
    });
    const blob = new THREE.Mesh(blobGeo, blobMat);
    blob.position.y = 0.8;
    group.add(blob);

    // Glowing Purple Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd53f8c });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.25, 0.9, 0.55);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(-0.25, 0.9, 0.55);
    group.add(eyeL);
    group.add(eyeR);

    scene.add(group);
    shadeMeshes.push({ group, blob, id: null });
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
    // If stunned, rotate erratically or bob
    if (sData.state === 'stunned') {
      sMesh.blob.material.color.setHex(0x3182ce);
      sMesh.group.rotation.y += 0.15;
    } else {
      sMesh.blob.material.color.setHex(0x120826);
      sMesh.group.rotation.y = 0;
    }
  }

  // 4. Update Player
  playerMesh.position.set(sim.player.pos[0], sim.player.pos[1], sim.player.pos[2]);

  // Flash player if invulnerable
  if (sim.player.invuln_timer > 0) {
    playerMesh.visible = Math.floor(Date.now() / 100) % 2 === 0;
  } else {
    playerMesh.visible = true;
  }

  // 5. Pulse Wave animation
  if (pulseTimer > 0) {
    pulseTimer -= 0.016;
    const progress = 1.0 - pulseTimer / 0.4;
    const r = progress * sim.tuning.pulse_radius;
    pulseMesh.scale.set(r, r, r);
    pulseMesh.position.set(sim.player.pos[0], 0.5, sim.player.pos[2]);
    pulseMesh.material.opacity = (1.0 - progress) * 0.6;
    pulseMesh.visible = true;
  } else {
    pulseMesh.visible = false;
  }
}

function updateHUD() {
  // Flames
  const flamesEl = document.getElementById('hud-flames');
  let flamesHtml = '';
  for (let i = 0; i < sim.player.flames; i++) {
    flamesHtml += '<span class="flame-icon">🔥</span>';
  }
  if (sim.player.flames <= 0) flamesHtml = '<span style="color:#e53e3e;">Đã tắt</span>';
  flamesEl.innerHTML = flamesHtml;

  // Motes carried
  document.getElementById('hud-motes').textContent = `${sim.player.carried} / ${sim.tuning.carry_capacity}`;

  // Lanterns lit
  const litCount = sim.lanterns.filter(l => l.lit).length;
  document.getElementById('hud-lanterns').textContent = `${litCount} / ${sim.lanterns.length}`;

  // Time Left
  document.getElementById('hud-time').textContent = `${Math.ceil(sim.time_left_s)}s`;

  // Score
  document.getElementById('hud-score').textContent = sim.score;

  // Interact prompt if near unlit lantern
  const promptEl = document.getElementById('interact-prompt');
  let nearLantern = false;
  for (const l of sim.lanterns) {
    const dx = sim.player.pos[0] - l.pos[0];
    const dz = sim.player.pos[2] - l.pos[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= sim.tuning.interact_radius && !l.lit) {
      nearLantern = true;
      promptEl.textContent = `[E] Thắp Đèn ${l.id} (${l.deposited}/${sim.tuning.lantern_cost} Đom Đóm)`;
      break;
    }
  }
  promptEl.style.display = nearLantern ? 'block' : 'none';

  // Render Minimap
  renderMinimap();
}

function renderMinimap() {
  const canvas = document.getElementById('minimap');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const scale = (w / 2 - 8) / sim.islandRadius;

  ctx.clearRect(0, 0, w, h);

  // Island circular ground
  ctx.beginPath();
  ctx.arc(cx, cy, sim.islandRadius * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#1c3127';
  ctx.fill();
  ctx.strokeStyle = '#4a5568';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Lanterns
  for (const l of sim.lanterns) {
    const lx = cx + l.pos[0] * scale;
    const lz = cy + l.pos[2] * scale;
    ctx.beginPath();
    ctx.arc(lx, lz, 5, 0, Math.PI * 2);
    ctx.fillStyle = l.lit ? '#f6e05e' : '#718096';
    ctx.fill();
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Fireflies
  ctx.fillStyle = '#faf089';
  for (const m of sim.motes) {
    const mx = cx + m.pos[0] * scale;
    const mz = cy + m.pos[2] * scale;
    ctx.beginPath();
    ctx.arc(mx, mz, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shades
  ctx.fillStyle = '#b794f4';
  for (const s of sim.shades) {
    const sx = cx + s.pos[0] * scale;
    const sz = cy + s.pos[2] * scale;
    ctx.beginPath();
    ctx.arc(sx, sz, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player
  const px = cx + sim.player.pos[0] * scale;
  const pz = cy + sim.player.pos[2] * scale;
  ctx.beginPath();
  ctx.arc(px, pz, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#4299e1';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function showGameOverModal(isWin, reason) {
  const modal = document.getElementById('modal');
  const title = document.getElementById('modal-title');
  const desc = document.getElementById('modal-desc');
  const stats = document.getElementById('modal-stats');
  const btn = document.getElementById('btn-start');

  modal.style.display = 'flex';
  stats.style.display = 'block';
  btn.textContent = 'Chơi Lại';

  if (isWin) {
    title.textContent = 'CHIẾN THẮNG!';
    title.style.background = 'linear-gradient(135deg, #68d391, #38a169)';
    title.style.webkitBackgroundClip = 'text';
    desc.textContent = 'Mây đã thắp sáng tất cả 5 Đèn Lồng Lớn! Ánh sáng ấm áp đã xua tan sương đen và bảo vệ Đảo Bến an lành!';
    sounds.playVictory();
  } else {
    title.textContent = 'THẤT BẠI!';
    title.style.background = 'linear-gradient(135deg, #fc8181, #e53e3e)';
    title.style.webkitBackgroundClip = 'text';
    if (reason === 'no_flames') {
      desc.textContent = 'Mây đã bị Bóng Mực tấn công và tắt hết ngọn lửa hộ mệnh trong đêm!';
    } else {
      desc.textContent = 'Rạng đông đã đến nhưng các ngọn đèn vẫn chưa được thắp sáng kịp thời!';
    }
    sounds.playDefeat();
  }

  stats.innerHTML = `
    <div class="score-row"><span>Đèn Lớn thắp sáng:</span> <b>${sim.lanterns.filter(l => l.lit).length} / 5</b></div>
    <div class="score-row"><span>Thời gian còn lại:</span> <b>${Math.ceil(sim.time_left_s)} giây</b></div>
    <div class="score-row"><span>Ngọn lửa (HP) còn lại:</span> <b>${sim.player.flames}</b></div>
    <div class="score-row" style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 6px; margin-top: 6px;">
      <span style="color:#ecc94b; font-weight:bold;">TỔNG ĐIỂM ĐẠT ĐƯỢC:</span>
      <b style="color:#faf089; font-size:18px;">${sim.score}</b>
    </div>
  `;
}

function setupInputs() {
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyE') {
      sim.setInput({ interact: true });
    }
    if (e.code === 'KeyQ') {
      sim.setInput({ pulse: true });
    }
  });

  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'KeyE') {
      sim.setInput({ interact: false });
    }
    if (e.code === 'KeyQ') {
      sim.setInput({ pulse: false });
    }
  });

  window.addEventListener('mousedown', e => {
    if (e.button === 2) {
      // Right click for pulse
      sim.setInput({ pulse: true });
    } else if (e.button === 0) {
      mouseLook = true;
    }
  });

  window.addEventListener('mouseup', e => {
    if (e.button === 2) {
      sim.setInput({ pulse: false });
    } else if (e.button === 0) {
      mouseLook = false;
    }
  });

  window.addEventListener('contextmenu', e => e.preventDefault());

  window.addEventListener('mousemove', e => {
    if (mouseLook || isPointerLocked) {
      cameraYaw -= e.movementX * 0.25;
      cameraPitch = Math.max(5, Math.min(65, cameraPitch + e.movementY * 0.25));
    }
  });

  document.getElementById('btn-start').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
    sounds.init();
    startGame();
  });
}

function startGame() {
  sim = new Simulation({ seed: Date.now() });
  lanternMeshes.forEach(l => scene.remove(l.group));
  lanternMeshes = [];
  moteMeshes.forEach(m => scene.remove(m.mesh));
  moteMeshes = [];
  shadeMeshes.forEach(s => scene.remove(s.group));
  shadeMeshes = [];
}

function updateCamera() {
  const yawRad = (cameraYaw * Math.PI) / 180;
  const pitchRad = (cameraPitch * Math.PI) / 180;

  const camX = sim.player.pos[0] + cameraDistance * Math.sin(yawRad) * Math.cos(pitchRad);
  const camY = sim.player.pos[1] + 1.2 + cameraDistance * Math.sin(pitchRad);
  const camZ = sim.player.pos[2] + cameraDistance * Math.cos(yawRad) * Math.cos(pitchRad);

  camera.position.set(camX, camY, camZ);
  camera.lookAt(sim.player.pos[0], sim.player.pos[1] + 1.2, sim.player.pos[2]);

  // Turn player mesh to face movement direction
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
const tickInterval = 1000 / 60; // 60 ticks per sec

function animate(now) {
  requestAnimationFrame(animate);

  if (!sim) {
    renderer.render(scene, camera);
    return;
  }

  // Run simulation at 60Hz
  while (now - lastTickTime >= tickInterval) {
    if (sim.state === 'playing') {
      let mx = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
      let mz = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
      sim.setInput({
        move: [mx, mz],
        cam_yaw_deg: cameraYaw,
        jump: !!keys['Space']
      });

      const events = sim.step();
      for (const evt of events) {
        if (evt.name === 'mote_picked') sounds.playMotePickup();
        if (evt.name === 'deposit') sounds.playDeposit();
        if (evt.name === 'lantern_lit') sounds.playLanternLit();
        if (evt.name === 'pulse') {
          sounds.playPulse();
          pulseTimer = 0.4;
        }
        if (evt.name === 'player_hit') sounds.playPlayerHit();
        if (evt.name === 'game_over') {
          showGameOverModal(evt.data.result === 'won', evt.data.reason);
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

// Initialization
initThree();
playerMesh = buildPlayer();
setupInputs();
startGame();
requestAnimationFrame(animate);
