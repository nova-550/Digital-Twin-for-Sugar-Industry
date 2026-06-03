// SugarTech SCADA Digital Twin — Interactive 3D Spatial Plant Mimic (Three.js)

let scene, camera, renderer, controls;
let conveyorMesh, conveyorCaneLoads = [];
let millRollers = [];
let clarifierLiquidMesh;
let evaporatorSteamParticles = [];
let crystallizerCoreMesh;
let centrifugalBasketMesh;
let pipePaths = [];

// Shared telemetry speeds
let millSpeedRpm = 4.2;
let centrifugeSpeedRpm = 1080;
let caneFeedTph = 210;
let estimatedPh = 7.2;

window.initThreeDModel = function() {
  const container = document.getElementById('three-spatial-canvas-box');
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  // 1. Scene & Render Engine Setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8fafc); // Clean Slate White matching Fluent light theme

  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  camera.position.set(0, 22, 28); // Oblique isometric bird's-eye perspective

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // 2. High-Tech Navigation OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.1; // Limit panning below blueprint floor
  controls.minDistance = 10;
  controls.maxDistance = 60;

  // 3. Lighting Architecture (Premium Soft Spotlights)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
  mainLight.position.set(20, 40, 20);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  scene.add(mainLight);

  const neonSpotlight = new THREE.SpotLight(0x0f62fe, 1.2, 50, Math.PI / 4, 0.5, 1);
  neonSpotlight.position.set(-15, 20, 5);
  scene.add(neonSpotlight);

  // High-tech blueprint grid helper floor
  const gridHelper = new THREE.GridHelper(40, 40, 0x0f62fe, 0xe2e8f0);
  gridHelper.position.y = -0.5;
  scene.add(gridHelper);

  // 4. Mesh Architectures (Refinery Stages)
  buildCaneReceptionStage();
  buildExtractionMillStage();
  buildClarifierStage();
  buildEvaporationStage();
  buildCrystallizerStage();
  buildCentrifugalsStage();
  buildConnectingPipelineFlows();

  // 5. Start Animation Tick
  animateThreeDLoop();

  // Window resize handler
  window.addEventListener('resize', onThreeDWindowResize);
};

// --- STAGE 1: Conveyor & Ramps ---
function buildCaneReceptionStage() {
  const conveyorGroup = new THREE.Group();
  conveyorGroup.position.set(-14, 0, 0);

  //Slanted conveyor ramp structure
  const rampGeo = new THREE.BoxGeometry(2, 0.4, 8);
  const rampMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 });
  const ramp = new THREE.Mesh(rampGeo, rampMat);
  ramp.rotation.x = -Math.PI / 8; // Slanted uphill slope
  ramp.position.y = 1.2;
  ramp.receiveShadow = true;
  conveyorGroup.add(ramp);

  // Anchor pulleys
  const pulleyGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.2, 16);
  const pulleyMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
  const p1 = new THREE.Mesh(pulleyGeo, pulleyMat);
  p1.rotation.z = Math.PI / 2;
  p1.position.set(0, 0.2, 3.4);
  conveyorGroup.add(p1);

  const p2 = new THREE.Mesh(pulleyGeo, pulleyMat);
  p2.rotation.z = Math.PI / 2;
  p2.position.set(0, 2.4, -3.4);
  conveyorGroup.add(p2);

  // Cane loads representation (small green floating boxes)
  const caneGeo = new THREE.BoxGeometry(0.6, 0.4, 0.8);
  const caneMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.7 }); // Emerald green fresh cane

  for (let i = 0; i < 4; i++) {
    const caneLoad = new THREE.Mesh(caneGeo, caneMat);
    caneLoad.position.set(0, 1.2, 3.4 - (i * 2.2));
    conveyorGroup.add(caneLoad);
    conveyorCaneLoads.push(caneLoad);
  }

  scene.add(conveyorGroup);
}

// --- STAGE 2: Three-Roller Extraction Gear ---
function buildExtractionMillStage() {
  const millGroup = new THREE.Group();
  millGroup.position.set(-8.5, 0, 0);

  // Heavy support housings
  const frameGeo = new THREE.BoxGeometry(3, 3.4, 0.5);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });
  const frameL = new THREE.Mesh(frameGeo, frameMat);
  frameL.position.set(0, 1.2, 1.2);
  millGroup.add(frameL);

  const frameR = frameL.clone();
  frameR.position.z = -1.2;
  millGroup.add(frameR);

  // Roller Cylinders
  const rollerGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.0, 16);
  const rollerMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });

  // 3-roller triangular configuration
  const r1 = new THREE.Mesh(rollerGeo, rollerMat);
  r1.rotation.x = Math.PI / 2;
  r1.position.set(0, 1.8, 0);
  millGroup.add(r1);
  millRollers.push(r1);

  const r2 = new THREE.Mesh(rollerGeo, rollerMat);
  r2.rotation.x = Math.PI / 2;
  r2.position.set(-0.9, 0.8, 0);
  millGroup.add(r2);
  millRollers.push(r2);

  const r3 = new THREE.Mesh(rollerGeo, rollerMat);
  r3.rotation.x = Math.PI / 2;
  r3.position.set(0.9, 0.8, 0);
  millGroup.add(r3);
  millRollers.push(r3);

  scene.add(millGroup);
}

// --- STAGE 3: Semi-Transparent Clarifier Tank ---
function buildClarifierStage() {
  const clarGroup = new THREE.Group();
  clarGroup.position.set(-3, 0, 0);

  // Outer glass tank
  const tankGeo = new THREE.CylinderGeometry(1.6, 1.6, 4.0, 24);
  const tankMat = new THREE.MeshPhysicalMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.25,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 0.5
  });
  const tank = new THREE.Mesh(tankGeo, tankMat);
  tank.position.y = 1.5;
  clarGroup.add(tank);

  // Glowing settling liquid cylinder inside
  const liqGeo = new THREE.CylinderGeometry(1.5, 1.5, 3.2, 24);
  const liqMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, // Healthy chemical green default
    transparent: true,
    opacity: 0.75,
    roughness: 0.3
  });
  clarifierLiquidMesh = new THREE.Mesh(liqGeo, liqMat);
  clarifierLiquidMesh.position.y = 1.1;
  clarGroup.add(clarifierLiquidMesh);

  // Settler support pillars
  const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.0, 8);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
  
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(pillarGeo, pillarMat);
    const angle = (i * Math.PI) / 2;
    p.position.set(Math.cos(angle) * 1.4, -0.2, Math.sin(angle) * 1.4);
    clarGroup.add(p);
  }

  scene.add(clarGroup);
}

// --- STAGE 4: Multi-Column Evaporation effects ---
function buildEvaporationStage() {
  const evapGroup = new THREE.Group();
  evapGroup.position.set(3, 0, 0);

  // 3 sequential boiling column effects
  const colGeo = new THREE.CylinderGeometry(0.8, 0.8, 3.8, 16);
  const colMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 });

  for (let i = 0; i < 3; i++) {
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.set(i * 2.2 - 2.2, 1.4, 0);
    col.castShadow = true;
    evapGroup.add(col);

    // Steam dome caps
    const capGeo = new THREE.SphereGeometry(0.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, colMat);
    cap.position.set(i * 2.2 - 2.2, 3.3, 0);
    evapGroup.add(cap);
  }

  // Steam vapors float particle point geometry representation
  const particleCount = 24;
  const particleGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });

  for (let i = 0; i < particleCount; i++) {
    const p = new THREE.Mesh(particleGeo, particleMat);
    // Random position around the evaporator effects columns
    resetSteamParticle(p);
    evapGroup.add(p);
    evaporatorSteamParticles.push(p);
  }

  scene.add(evapGroup);
}

function resetSteamParticle(p) {
  p.position.set(
    (Math.random() * 5) - 2.5,
    3.3 + (Math.random() * 1.5),
    (Math.random() * 1.6) - 0.8
  );
  p.userData = { speed: 0.02 + Math.random() * 0.02, life: 1.0 };
}

// --- STAGE 5: Dome-Capped Crystallization Boiler ---
function buildCrystallizerStage() {
  const crystGroup = new THREE.Group();
  crystGroup.position.set(9.5, 0, 0);

  // Large vacuum pan boiling vessel base
  const panGeo = new THREE.CylinderGeometry(1.6, 1.6, 2.6, 24);
  const panMat = new THREE.MeshStandardMaterial({ color: 0x0f62fe, metalness: 0.7, roughness: 0.3 }); // Brilliant high-tech Cobalt Blue
  const pan = new THREE.Mesh(panGeo, panMat);
  pan.position.y = 1.0;
  pan.castShadow = true;
  crystGroup.add(pan);

  // High-vacuum pan dome cone cap
  const domeGeo = new THREE.ConeGeometry(1.6, 1.8, 24);
  const dome = new THREE.Mesh(domeGeo, panMat);
  dome.position.y = 3.2;
  crystGroup.add(dome);

  // Glass observation window viewport
  const glassGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, roughness: 0.1, transparent: true, opacity: 0.8, transmission: 0.8 });
  const viewport = new THREE.Mesh(glassGeo, glassMat);
  viewport.rotation.x = Math.PI / 2;
  viewport.position.set(0, 1.4, 1.5);
  crystGroup.add(viewport);

  // Golden amber core syrup lattice rotating inside
  const coreGeo = new THREE.SphereGeometry(1.1, 16, 16);
  const coreMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: true });
  crystallizerCoreMesh = new THREE.Mesh(coreGeo, coreMat);
  crystallizerCoreMesh.position.y = 1.0;
  crystGroup.add(crystallizerCoreMesh);

  scene.add(crystGroup);
}

// --- STAGE 6: Decanter Centrifugals ---
function buildCentrifugalsStage() {
  const centGroup = new THREE.Group();
  centGroup.position.set(15, 0, 0);

  // Stationary outer steel housing
  const housingGeo = new THREE.CylinderGeometry(1.5, 1.5, 3.0, 24);
  const housingMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 });
  const housing = new THREE.Mesh(housingGeo, housingMat);
  housing.position.y = 1.0;
  centGroup.add(housing);

  // Glass front cutout screen
  const screenGeo = new THREE.CylinderGeometry(1.48, 1.48, 1.2, 16, 1, true, 0, Math.PI);
  const screenMat = new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.4 });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 1.4, 0.02);
  centGroup.add(screen);

  // High-speed spinning inner decanter basket basket
  const basketGeo = new THREE.CylinderGeometry(1.1, 1.1, 1.8, 16);
  const basketMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, wireframe: true });
  centrifugalBasketMesh = new THREE.Mesh(basketGeo, basketMat);
  centrifugalBasketMesh.position.y = 1.0;
  centGroup.add(centrifugalBasketMesh);

  scene.add(centGroup);
}

// --- PIPELINE FLOW PIPES (Glowing Tubes) ---
function buildConnectingPipelineFlows() {
  // Coordinates representing continuous stage transfer pipelines
  const pipelineCoords = [
    [-12, 1.2, 0, -8.5, 1.2, 0, 0x10b981], // Stage 1 -> 2 (Raw Juice cane flow)
    [-8.5, 0.5, 0, -3, 0.8, 0, 0x0ea5e9],  // Stage 2 -> 3 (Green/blue diluted extraction juice)
    [-3, 2.2, 0, 0.8, 2.2, 0, 0x10b981],   // Stage 3 -> 4 (Clear hot settled juice)
    [5.2, 2.0, 0, 9.5, 1.4, 0, 0xf59e0b],  // Stage 4 -> 5 (Amber thick syrup flow)
    [9.5, 0.5, 0, 15, 0.8, 0, 0xd946ef]    // Stage 5 -> 6 (Purple sugar massecuite crystals)
  ];

  pipelineCoords.forEach(c => {
    // Generate curved line paths
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(c[0], c[1], c[2]),
      new THREE.Vector3(c[3], c[4], c[5])
    );
    const pipeGeo = new THREE.TubeGeometry(curve, 20, 0.12, 8, false);
    const pipeMat = new THREE.MeshStandardMaterial({
      color: c[6],
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85
    });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    scene.add(pipe);
    pipePaths.push(pipe);
  });
}

// --- 6. Telemetry WebSocket Synchronization Hook ---
window.updateThreeJsModels = function(state) {
  if (!state) return;

  // Extract variables
  caneFeedTph = state.cane_handling?.cane_feed_rate_tph || 210;
  millSpeedRpm = state.milling?.mill_speed_rpm || 4.2;
  estimatedPh = state.clarification?.estimated_ph || 7.2;
  centrifugeSpeedRpm = state.centrifugation?.centrifuge_speed_rpm || 1080;

  // 1. Settler tank liquid color changes dynamically depending on pH balance
  if (clarifierLiquidMesh) {
    let color = 0x10b981; // Vibrant healthy Emerald for 7.2 pH
    
    if (estimatedPh < 6.4) {
      color = 0xef4444; // High-risk Acid Hydrolysis Alert Red
    } else if (estimatedPh < 6.8) {
      color = 0xf59e0b; // Sub-optimal pH Amber warning
    } else if (estimatedPh > 8.0) {
      color = 0xd946ef; // Alkaline Scaling Purple alert
    }
    
    clarifierLiquidMesh.material.color.setHex(color);
  }
};

// --- 7. Main Rendering Loop & Animations ---
function animateThreeDLoop() {
  requestAnimationFrame(animateThreeDLoop);

  // 1. Conveyor sliding green cane box animation speed tied to feed rate
  const caneVelocity = (caneFeedTph / 210) * 0.02;
  conveyorCaneLoads.forEach(c => {
    c.position.z += caneVelocity;
    // Slanted upward movement loop
    c.position.y -= (caneVelocity * Math.sin(Math.PI / 8));
    if (c.position.z > 3.4) {
      c.position.z = -3.4;
      c.position.y = 2.4;
    }
  });

  // 2. Heavy rollers rotation tied to motor RPM
  const millRot = (millSpeedRpm / 4.2) * 0.025;
  millRollers.forEach((r, idx) => {
    // Alternate gear directions for realistic tooth mesh
    r.rotation.y += (idx === 0 ? millRot : -millRot);
  });

  // 3. Evaporator boiling steam particle float physics
  evaporatorSteamParticles.forEach(p => {
    p.position.y += p.userData.speed;
    p.userData.life -= 0.01;
    p.material.opacity = p.userData.life * 0.6;

    if (p.userData.life <= 0) {
      resetSteamParticle(p);
      p.material.opacity = 0.6;
    }
  });

  // 4. Pan crystallizer lattice rotation
  if (crystallizerCoreMesh) {
    crystallizerCoreMesh.rotation.y += 0.015;
    crystallizerCoreMesh.rotation.x += 0.005;
  }

  // 5. Decanter high-speed spin basket tied to centrifuge speed
  if (centrifugalBasketMesh) {
    centrifugalBasketMesh.rotation.y += (centrifugeSpeedRpm / 1080) * 0.08;
  }

  // OrbitControls update
  if (controls) controls.update();

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Window resize safety handler
function onThreeDWindowResize() {
  const container = document.getElementById('three-spatial-canvas-box');
  if (!container || !renderer || !camera) return;

  const w = container.clientWidth;
  const h = container.clientHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
