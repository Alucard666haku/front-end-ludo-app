import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.152.2/examples/jsm/controls/OrbitControls.js';

// Configuration
let gameConfig = {
  numPlayers: 4,
  pawnsPerPlayer: 4,
  pathLength: 5
};

const PLAYER_COLORS = [
  { name: 'Rouge', hex: 0xef4444, cssClass: 'color-red' },
  { name: 'Jaune', hex: 0xfbbf24, cssClass: 'color-yellow' },
  { name: 'Vert', hex: 0x22c55e, cssClass: 'color-green' },
  { name: 'Bleu', hex: 0x3b82f6, cssClass: 'color-blue' },
  { name: 'Violet', hex: 0xa855f7, cssClass: 'color-violet' },
  { name: 'Orange', hex: 0xf97316, cssClass: 'color-orange' },
  { name: 'Rose', hex: 0xec4899, cssClass: 'color-pink' },
  { name: 'Cyan', hex: 0x06b6d4, cssClass: 'color-cyan' }
];

// Variables globales
const container = document.getElementById('container');
let scene, camera, renderer, controls;
let pawns = [];
let currentPlayerIndex = 0;
let diceValue = 0;
let gameState = 'waiting';

// Configuration UI
const playerOptions = document.querySelectorAll('.player-option');
playerOptions.forEach(option => {
  option.addEventListener('click', () => {
    playerOptions.forEach(o => o.classList.remove('selected'));
    option.classList.add('selected');
    gameConfig.numPlayers = parseInt(option.dataset.players);
  });
});

document.getElementById('pawnsSlider').addEventListener('input', (e) => {
  gameConfig.pawnsPerPlayer = parseInt(e.target.value);
  document.getElementById('pawnsValue').textContent = e.target.value;
});

document.getElementById('pathSlider').addEventListener('input', (e) => {
  gameConfig.pathLength = parseInt(e.target.value);
  document.getElementById('pathValue').textContent = e.target.value;
});

document.getElementById('startGameBtn').addEventListener('click', () => {
  document.getElementById('configOverlay').classList.add('hidden');
  document.getElementById('container').classList.add('visible');
  initGame();
});

document.getElementById('reconfigBtn').addEventListener('click', () => {
  location.reload();
});

function initGame() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0f1724, 30, 100);
  
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  const cameraDistance = 15 + gameConfig.numPlayers * 2;
  camera.position.set(0, cameraDistance * 1.2, cameraDistance);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 0, 0);
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.minDistance = 10;
  controls.maxDistance = cameraDistance * 2;
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };

  setupLights();
  createBoard();
  setupEventListeners();
  animate();
  updatePlayerTurn();
}

function setupLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
  mainLight.position.set(10, 25, 10);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 50;
  mainLight.shadow.camera.left = -30;
  mainLight.shadow.camera.right = 30;
  mainLight.shadow.camera.top = 30;
  mainLight.shadow.camera.bottom = -30;
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
  fillLight.position.set(-10, 15, -10);
  scene.add(fillLight);
}

function createBoard() {
  const boardSize = 12 + gameConfig.pathLength * 2;
  
  const floorGeo = new THREE.PlaneGeometry(boardSize * 2.5, boardSize * 2.5);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0a1220,
    metalness: 0.2,
    roughness: 0.8
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.5;
  floor.receiveShadow = true;
  scene.add(floor);

  createPolygonBoard();
}

function createPolygonBoard() {
  const numPlayers = gameConfig.numPlayers;
  const radius = 8 + gameConfig.pathLength * 0.5;
  const angleStep = (Math.PI * 2) / numPlayers;
  
  const shape = new THREE.Shape();
  for (let i = 0; i < numPlayers; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }
  shape.closePath();

  const extrudeSettings = {
    depth: 0.8,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 3
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const material = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.3,
    roughness: 0.7
  });
  const board = new THREE.Mesh(geometry, material);
  board.rotation.x = -Math.PI / 2;
  board.position.y = -0.4;
  board.castShadow = true;
  board.receiveShadow = true;
  scene.add(board);

  const borderShape = new THREE.Shape();
  const borderRadius = radius + 0.3;
  for (let i = 0; i < numPlayers; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = Math.cos(angle) * borderRadius;
    const z = Math.sin(angle) * borderRadius;
    if (i === 0) borderShape.moveTo(x, z);
    else borderShape.lineTo(x, z);
  }
  borderShape.closePath();

  const borderGeo = new THREE.ExtrudeGeometry(borderShape, { depth: 0.3 });
  const borderMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.8,
    roughness: 0.2
  });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.rotation.x = -Math.PI / 2;
  border.position.y = -0.05;
  border.castShadow = true;
  scene.add(border);

  createPlayerBases(radius, angleStep);
  createCenterDecoration();
}

function createPlayerBases(radius, angleStep) {
  for (let i = 0; i < gameConfig.numPlayers; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const baseRadius = 2.5;
    const baseDistance = radius * 0.7;
    const x = Math.cos(angle) * baseDistance;
    const z = Math.sin(angle) * baseDistance;
    
    const playerColor = PLAYER_COLORS[i];
    
    const baseGeo = new THREE.CylinderGeometry(baseRadius, baseRadius, 0.6, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: playerColor.hex,
      roughness: 0.4,
      metalness: 0.2
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(x, 0.3, z);
    base.castShadow = true;
    scene.add(base);

    const baseLight = new THREE.PointLight(playerColor.hex, 0.3, 8);
    baseLight.position.set(x, 1, z);
    scene.add(baseLight);

    // Créer les tuiles de chemin coloré
    createPathTiles(x, z, angle, playerColor.hex, i);

    createPawnsForPlayer(i, x, z, baseRadius, playerColor);
  }
}

function createPathTiles(baseX, baseZ, baseAngle, color, playerIndex) {
  const pathLength = gameConfig.pathLength;
  const tileSize = 0.9;
  const tileHeight = 0.18;
  const spacing = 1.1;
  
  console.log(`Creating ${pathLength} tiles for player ${playerIndex}`);
  
  for (let j = 1; j <= pathLength; j++) {
    // Distance depuis la base
    const dist = 3.5 + j * spacing;
    
    // Position de la tuile
    const tileX = baseX + Math.cos(baseAngle) * dist;
    const tileZ = baseZ + Math.sin(baseAngle) * dist;
    
    // Créer la géométrie de la tuile avec des bords arrondis
    const tileGeo = new THREE.BoxGeometry(tileSize, tileHeight, tileSize);
    
    // Matériau avec la couleur du joueur
    const tileMat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.2,
      roughness: 0.5
    });
    
    const tile = new THREE.Mesh(tileGeo, tileMat);
    tile.position.set(tileX, tileHeight / 2, tileZ);
    tile.castShadow = true;
    tile.receiveShadow = true;
    scene.add(tile);
    
    // Ajouter un marqueur numérique sur la tuile
    if (j % 2 === 0) {
      const markerGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
      const markerMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.6,
        roughness: 0.3
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(tileX, tileHeight + 0.03, tileZ);
      marker.castShadow = true;
      scene.add(marker);
    }
  }
}

function createPawnsForPlayer(playerIndex, baseX, baseZ, baseRadius, playerColor) {
  const pawnsPerPlayer = gameConfig.pawnsPerPlayer;
  const angleStep = (Math.PI * 2) / pawnsPerPlayer;
  
  for (let i = 0; i < pawnsPerPlayer; i++) {
    const angle = i * angleStep;
    const spawnRadius = baseRadius * 0.6;
    const sx = baseX + Math.cos(angle) * spawnRadius;
    const sz = baseZ + Math.sin(angle) * spawnRadius;
    
    const circleGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 32);
    const circleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.5,
      roughness: 0.3
    });
    const mark = new THREE.Mesh(circleGeo, circleMat);
    mark.position.set(sx, 0.35, sz);
    mark.castShadow = true;
    scene.add(mark);

    const pawn = createPawn(playerColor.hex);
    pawn.position.set(sx, 0.7, sz);
    scene.add(pawn);
    
    pawns.push({
      mesh: pawn,
      playerIndex: playerIndex,
      colorHex: playerColor.hex,
      colorName: playerColor.name,
      cssClass: playerColor.cssClass,
      home: { x: sx, z: sz },
      id: playerIndex * pawnsPerPlayer + i,
      inPlay: false
    });
  }
}

function createPawn(color) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.65, 32);
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.3,
    roughness: 0.5
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  const headGeo = new THREE.SphereGeometry(0.22, 32, 32);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 0.5;
  head.castShadow = true;
  group.add(head);

  return group;
}

function createCenterDecoration() {
  const holeDepth = 0.8;
  const holeRadius = 1.2;
  
  const holeGeo = new THREE.CylinderGeometry(holeRadius, holeRadius * 0.9, holeDepth, 32);
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    metalness: 0.1,
    roughness: 0.95,
    emissive: 0x000000
  });
  const hole = new THREE.Mesh(holeGeo, holeMat);
  hole.position.set(0, -holeDepth / 2 + 0.02, 0);
  hole.receiveShadow = true;
  scene.add(hole);

  const shadowRingGeo = new THREE.CylinderGeometry(holeRadius + 0.1, holeRadius, 0.1, 32);
  const shadowRingMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.2,
    roughness: 0.9
  });
  const shadowRing = new THREE.Mesh(shadowRingGeo, shadowRingMat);
  shadowRing.position.set(0, 0.02, 0);
  scene.add(shadowRing);

  const rimLight = new THREE.PointLight(0x3b82f6, 0.2, 5);
  rimLight.position.set(0, 0.1, 0);
  scene.add(rimLight);
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = performance.now() * 0.001;

  pawns.forEach((p, i) => {
    if (!p.animating) {
      p.mesh.position.y = p.inPlay ? p.mesh.position.y : 0.7 + Math.sin(elapsed * 2 + i) * 0.03;
      p.mesh.rotation.y = elapsed * 0.5 + i;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}

function setupEventListeners() {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    const cameraDistance = 15 + gameConfig.numPlayers * 2;
    camera.position.set(0, cameraDistance * 1.2, cameraDistance);
    controls.target.set(0, 0, 0);
  });

  document.getElementById('diceBtn').addEventListener('click', () => {
    if (gameState !== 'waiting') return;
    
    const btn = document.getElementById('diceBtn');
    btn.disabled = true;
    
    let rolls = 0;
    const rollInterval = setInterval(() => {
      diceValue = Math.floor(Math.random() * 6) + 1;
      document.getElementById('diceValue').textContent = diceValue;
      rolls++;
      
      if (rolls >= 10) {
        clearInterval(rollInterval);
        gameState = 'rolled';
        btn.disabled = false;
        showPawnSelector();
      }
    }, 100);
  });
}

function showPawnSelector() {
  const selector = document.getElementById('pawnSelector');
  selector.innerHTML = '';
  
  const availablePawns = pawns.filter(p => p.playerIndex === currentPlayerIndex);
  
  availablePawns.forEach((pawn, index) => {
    const btn = document.createElement('button');
    btn.className = 'pawn-btn';
    btn.style.background = `linear-gradient(135deg, ${rgbToHex(pawn.colorHex)} 0%, ${darkenColor(pawn.colorHex)} 100%)`;
    btn.textContent = `P${index + 1}`;
    btn.addEventListener('click', () => movePawn(pawn));
    selector.appendChild(btn);
  });
}

function movePawn(pawn) {
  if (gameState !== 'rolled') return;
  
  gameState = 'moving';
  document.getElementById('pawnSelector').innerHTML = '';
  
  if (!pawn.inPlay && diceValue === 6) {
    const startPos = getStartPosition(pawn.playerIndex);
    animatePawnMovement(pawn, startPos.x, startPos.z, () => {
      pawn.inPlay = true;
      nextTurn();
    });
  } else if (pawn.inPlay) {
    const currentPos = pawn.mesh.position;
    const angle = getPlayerAngle(pawn.playerIndex);
    const moveDistance = diceValue * 1.1;
    const newX = currentPos.x + Math.cos(angle) * moveDistance;
    const newZ = currentPos.z + Math.sin(angle) * moveDistance;
    
    animatePawnMovement(pawn, newX, newZ, () => {
      nextTurn();
    });
  } else {
    const diceDisplay = document.getElementById('diceValue');
    diceDisplay.classList.add('shake');
    setTimeout(() => diceDisplay.classList.remove('shake'), 300);
    nextTurn();
  }
}

function getPlayerAngle(playerIndex) {
  const angleStep = (Math.PI * 2) / gameConfig.numPlayers;
  return playerIndex * angleStep - Math.PI / 2;
}

function getStartPosition(playerIndex) {
  const angle = getPlayerAngle(playerIndex);
  const radius = 8 + gameConfig.pathLength * 0.5;
  const baseDistance = radius * 0.7;
  const startDist = 3.5;
  
  const baseX = Math.cos(angle) * baseDistance;
  const baseZ = Math.sin(angle) * baseDistance;
  
  return {
    x: baseX + Math.cos(angle) * startDist,
    z: baseZ + Math.sin(angle) * startDist
  };
}

function animatePawnMovement(pawn, targetX, targetZ, callback) {
  pawn.animating = true;
  const startX = pawn.mesh.position.x;
  const startZ = pawn.mesh.position.z;
  const startY = pawn.mesh.position.y;
  const jumpHeight = 2;
  const duration = 800;
  const startTime = Date.now();

  function move() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    pawn.mesh.position.x = startX + (targetX - startX) * easeProgress;
    pawn.mesh.position.z = startZ + (targetZ - startZ) * easeProgress;
    pawn.mesh.position.y = startY + Math.sin(easeProgress * Math.PI) * jumpHeight;

    if (progress < 1) {
      requestAnimationFrame(move);
    } else {
      pawn.mesh.position.y = startY;
      pawn.animating = false;
      if (callback) callback();
    }
  }
  move();
}

function nextTurn() {
  if (diceValue !== 6) {
    currentPlayerIndex = (currentPlayerIndex + 1) % gameConfig.numPlayers;
  }
  
  updatePlayerTurn();
  
  diceValue = 0;
  document.getElementById('diceValue').textContent = '-';
  gameState = 'waiting';
}

function updatePlayerTurn() {
  const currentPlayer = PLAYER_COLORS[currentPlayerIndex];
  const playerSpan = document.getElementById('currentPlayer');
  playerSpan.textContent = currentPlayer.name;
  playerSpan.className = currentPlayer.cssClass;
}

function rgbToHex(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}

function darkenColor(hex) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return '#' + ((r * 0.7) << 16 | (g * 0.7) << 8 | (b * 0.7)).toString(16).padStart(6, '0');
}