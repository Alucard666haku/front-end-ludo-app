// configurable-ludo-game.js
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
let pathTiles = [];
let boardSize = 0;

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
  // Nettoyer la scène si elle existe déjà
  if (scene) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }
  
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0f1724, 30, 100);
  
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // Calculer la taille du plateau basée sur le nombre de joueurs
  boardSize = 10 + gameConfig.numPlayers * 1.5 + gameConfig.pathLength * 0.8;
  const cameraDistance = boardSize * 1.8;
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
  controls.minDistance = boardSize * 0.8;
  controls.maxDistance = boardSize * 3;
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
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
  mainLight.position.set(boardSize / 2, boardSize, boardSize / 2);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = boardSize * 2;
  mainLight.shadow.camera.left = -boardSize;
  mainLight.shadow.camera.right = boardSize;
  mainLight.shadow.camera.top = boardSize;
  mainLight.shadow.camera.bottom = -boardSize;
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
  fillLight.position.set(-boardSize / 2, boardSize / 2, -boardSize / 2);
  scene.add(fillLight);
}

function createBoard() {
  // Sol
  const floorGeo = new THREE.PlaneGeometry(boardSize * 3, boardSize * 3);
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
  createCenterDecoration();
}

function createPolygonBoard() {
  const numPlayers = gameConfig.numPlayers;
  const boardRadius = boardSize * 0.8;
  const angleStep = (Math.PI * 2) / numPlayers;
  
  // Base du plateau en forme de polygone
  const shape = new THREE.Shape();
  for (let i = 0; i < numPlayers; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = Math.cos(angle) * boardRadius;
    const z = Math.sin(angle) * boardRadius;
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

  // Bordure
  const borderShape = new THREE.Shape();
  const borderRadius = boardRadius + 0.3;
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

  // Créer les bases et les chemins
  createPlayerBases(boardRadius, angleStep);
}

function createPlayerBases(radius, angleStep) {
  pathTiles = []; // Réinitialiser les tuiles de chemin
  
  for (let i = 0; i < gameConfig.numPlayers; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const playerColor = PLAYER_COLORS[i];
    
    // Position de la base
    const baseRadius = 2.5;
    const baseDistance = radius * 0.6;
    const baseX = Math.cos(angle) * baseDistance;
    const baseZ = Math.sin(angle) * baseDistance;
    
    // Créer la base
    createBase(baseX, baseZ, baseRadius, playerColor.hex);
    
    // Créer les tuiles de chemin
    createPathTilesForPlayer(i, baseX, baseZ, angle, playerColor);
    
    // Créer les pions
    createPawnsForPlayer(i, baseX, baseZ, baseRadius, playerColor);
  }
}

function createBase(x, z, radius, color) {
  const baseGeo = new THREE.CylinderGeometry(radius, radius, 0.6, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.4,
    metalness: 0.2
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(x, 0.3, z);
  base.castShadow = true;
  scene.add(base);

  const baseLight = new THREE.PointLight(color, 0.3, 8);
  baseLight.position.set(x, 1, z);
  scene.add(baseLight);
}

function createPathTilesForPlayer(playerIndex, baseX, baseZ, angle, playerColor) {
  const pathLength = gameConfig.pathLength;
  const tileSize = 0.9;
  const spacing = 1.2;
  
  // Créer le chemin depuis la base vers l'extérieur
  for (let j = 1; j <= pathLength; j++) {
    const distance = 3.5 + (j * spacing);
    const tileX = baseX + Math.cos(angle) * distance;
    const tileZ = baseZ + Math.sin(angle) * distance;
    
    // Tuile principale
    const tileGeo = new THREE.BoxGeometry(tileSize, 0.15, tileSize);
    const tileMat = new THREE.MeshStandardMaterial({
      color: playerColor.hex,
      metalness: 0.2,
      roughness: 0.5,
      emissive: playerColor.hex,
      emissiveIntensity: 0.1
    });
    const tile = new THREE.Mesh(tileGeo, tileMat);
    tile.position.set(tileX, 0.08, tileZ);
    tile.castShadow = true;
    tile.receiveShadow = true;
    scene.add(tile);
    
    // Bordure de la tuile
    const borderGeo = new THREE.BoxGeometry(tileSize + 0.05, 0.05, tileSize + 0.05);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.3
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.set(0, -0.1, 0);
    tile.add(border);
    
    // Numéro sur la tuile
    const numberGeo = new THREE.PlaneGeometry(0.3, 0.3);
    const numberMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const number = new THREE.Mesh(numberGeo, numberMat);
    number.position.set(0, 0.09, 0);
    number.rotation.x = -Math.PI / 2;
    tile.add(number);
    
    // Stocker la tuile pour référence
    pathTiles.push({
      mesh: tile,
      playerIndex: playerIndex,
      position: { x: tileX, z: tileZ },
      order: j
    });
    
    // Ajouter un marqueur spécial pour la première tuile
    if (j === 1) {
      createStartMarker(tileX, 0.15, tileZ, playerColor.hex);
    }
    
    // Ajouter un marqueur spécial pour la dernière tuile
    if (j === pathLength) {
      createEndMarker(tileX, 0.15, tileZ, playerColor.hex);
    }
  }
  
  // Créer les tuiles de connexion vers les autres bases
  if (gameConfig.numPlayers >= 4) {
    createConnectionTiles(baseX, baseZ, angle, playerColor.hex);
  }
}

function createStartMarker(x, y, z, color) {
  const markerGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8);
  const markerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: color,
    emissiveIntensity: 0.3
  });
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.position.set(x, y, z);
  scene.add(marker);
}

function createEndMarker(x, y, z, color) {
  const starShape = new THREE.Shape();
  const outerRadius = 0.2;
  const innerRadius = 0.1;
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / 10) * Math.PI * 2;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) starShape.moveTo(px, py);
    else starShape.lineTo(px, py);
  }
  starShape.closePath();

  const starGeo = new THREE.ShapeGeometry(starShape);
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: color,
    emissiveIntensity: 0.5
  });
  const star = new THREE.Mesh(starGeo, starMat);
  star.position.set(x, y, z);
  star.rotation.x = -Math.PI / 2;
  scene.add(star);
}

function createConnectionTiles(baseX, baseZ, angle, color) {
  // Créer des tuiles de connexion pour former un chemin continu
  const tileSize = 0.8;
  const connectionLength = Math.floor(gameConfig.pathLength / 2);
  
  // Tuiles tournantes à mi-chemin
  for (let k = 1; k <= connectionLength; k++) {
    const offsetAngle = angle + (Math.PI / gameConfig.numPlayers) * (k / connectionLength);
    const distance = 5 + k * 1.5;
    const tileX = baseX + Math.cos(offsetAngle) * distance;
    const tileZ = baseZ + Math.sin(offsetAngle) * distance;
    
    const tileGeo = new THREE.BoxGeometry(tileSize, 0.1, tileSize);
    const tileMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.1,
      roughness: 0.6
    });
    const tile = new THREE.Mesh(tileGeo, tileMat);
    tile.position.set(tileX, 0.06, tileZ);
    tile.castShadow = true;
    tile.receiveShadow = true;
    scene.add(tile);
    
    // Bordure spéciale pour les tuiles de connexion
    const borderGeo = new THREE.BoxGeometry(tileSize + 0.1, 0.03, tileSize + 0.1);
    const borderMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.2
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.set(0, -0.065, 0);
    tile.add(border);
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
    
    // Marqueur sous le pion
    const circleGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 32);
    const circleMat = new THREE.MeshStandardMaterial({
      color: 0x347589,
      metalness: 0.5,
      roughness: 0.3
    });
    const mark = new THREE.Mesh(circleGeo, circleMat);
    mark.position.set(sx, 0.35, sz);
    mark.castShadow = true;
    scene.add(mark);

    // Créer le pion
    const pawn = createPawn(playerColor.hex);
    pawn.position.set(sx, 0.7, sz);
    scene.add(pawn);
    
    // Stocker les informations du pion
    pawns.push({
      mesh: pawn,
      playerIndex: playerIndex,
      colorHex: playerColor.hex,
      colorName: playerColor.name,
      cssClass: playerColor.cssClass,
      home: { x: sx, z: sz },
      id: playerIndex * pawnsPerPlayer + i,
      inPlay: false,
      currentTile: null,
      pathProgress: 0
    });
  }
}

function createPawn(color) {
  const group = new THREE.Group();

  // Corps du pion
  const bodyGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.65, 32);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.3,
    roughness: 0.5
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  // Tête du pion
  const headGeo = new THREE.SphereGeometry(0.22, 32, 32);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 0.5;
  head.castShadow = true;
  group.add(head);

  // Détail sur la tête
  const detailGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
  const detailMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.8,
    roughness: 0.2
  });
  const detail = new THREE.Mesh(detailGeo, detailMat);
  detail.position.y = 0.55;
  group.add(detail);

  return group;
}

function createCenterDecoration() {
  const holeDepth = 0.8;
  const holeRadius = 1.5;
  
  // Trou central
  const holeGeo = new THREE.CylinderGeometry(holeRadius, holeRadius * 0.9, holeDepth, 32);
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    metalness: 0.1,
    roughness: 0.95
  });
  const hole = new THREE.Mesh(holeGeo, holeMat);
  hole.position.set(0, -holeDepth / 2 + 0.02, 0);
  hole.receiveShadow = true;
  scene.add(hole);

  // Anneau autour du trou
  const shadowRingGeo = new THREE.CylinderGeometry(holeRadius + 0.1, holeRadius, 0.1, 32);
  const shadowRingMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.2,
    roughness: 0.9
  });
  const shadowRing = new THREE.Mesh(shadowRingGeo, shadowRingMat);
  shadowRing.position.set(0, 0.02, 0);
  scene.add(shadowRing);

  // Triangles colorés autour du centre
  const numTriangles = gameConfig.numPlayers;
  const triAngleStep = (Math.PI * 2) / numTriangles;
  const triSize = 1.2;
  
  for (let i = 0; i < numTriangles; i++) {
    const angle = i * triAngleStep;
    const triX = Math.cos(angle) * (holeRadius + 0.8);
    const triZ = Math.sin(angle) * (holeRadius + 0.8);
    const playerColor = PLAYER_COLORS[i % PLAYER_COLORS.length];
    
    const triGeo = new THREE.CylinderGeometry(0, triSize, 0.12, 3);
    const triMat = new THREE.MeshStandardMaterial({
      color: playerColor.hex,
      metalness: 0.4,
      roughness: 0.6
    });
    const tri = new THREE.Mesh(triGeo, triMat);
    tri.position.set(triX, 0.08, triZ);
    tri.rotation.y = angle + Math.PI;
    tri.castShadow = true;
    scene.add(tri);
  }

  // Lumière centrale
  const rimLight = new THREE.PointLight(0x3b82f6, 0.2, 5);
  rimLight.position.set(0, 0.1, 0);
  scene.add(rimLight);
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = performance.now() * 0.001;

  // Animation des pions
  pawns.forEach((p, i) => {
    if (!p.animating) {
      // Pions à la maison oscillent légèrement
      if (!p.inPlay) {
        p.mesh.position.y = 0.7 + Math.sin(elapsed * 2 + i) * 0.03;
      }
      // Rotation continue
      p.mesh.rotation.y = elapsed * 0.5 + i;
    }
  });

  // Animation des tuiles de chemin
  pathTiles.forEach((tile, i) => {
    const time = elapsed * 2 + i * 0.1;
    tile.mesh.children[0].position.y = -0.1 + Math.sin(time) * 0.02;
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
    const cameraDistance = boardSize * 1.8;
    camera.position.set(0, cameraDistance * 1.2, cameraDistance);
    controls.target.set(0, 0, 0);
  });

  document.getElementById('diceBtn').addEventListener('click', () => {
    if (gameState !== 'waiting') return;
    
    const btn = document.getElementById('diceBtn');
    btn.disabled = true;
    
    // Animation de lancer de dé
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
    // Sortir le pion de la maison
    const playerTiles = pathTiles.filter(t => t.playerIndex === pawn.playerIndex);
    if (playerTiles.length > 0) {
      const firstTile = playerTiles[0];
      animatePawnMovement(pawn, firstTile.position.x, firstTile.position.z, () => {
        pawn.inPlay = true;
        pawn.currentTile = firstTile;
        pawn.pathProgress = 1;
        nextTurn();
      });
    } else {
      nextTurn();
    }
  } else if (pawn.inPlay) {
    // Avancer sur le chemin
    const playerTiles = pathTiles.filter(t => t.playerIndex === pawn.playerIndex);
    if (playerTiles.length > 0) {
      const currentIndex = pawn.currentTile ? 
        playerTiles.findIndex(t => t === pawn.currentTile) : 0;
      const newIndex = Math.min(currentIndex + diceValue, playerTiles.length - 1);
      const targetTile = playerTiles[newIndex];
      
      animatePawnMovement(pawn, targetTile.position.x, targetTile.position.z, () => {
        pawn.currentTile = targetTile;
        pawn.pathProgress = newIndex + 1;
        
        // Vérifier si le pion est arrivé à la fin
        if (newIndex === playerTiles.length - 1) {
          // Le pion est arrivé !
          celebratePawnArrival(pawn);
        }
        
        nextTurn();
      });
    } else {
      nextTurn();
    }
  } else {
    // Ne peut pas bouger
    const diceDisplay = document.getElementById('diceValue');
    diceDisplay.classList.add('shake');
    setTimeout(() => diceDisplay.classList.remove('shake'), 300);
    nextTurn();
  }
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

function celebratePawnArrival(pawn) {
  // Effet visuel quand un pion arrive à destination
  const light = new THREE.PointLight(pawn.colorHex, 1, 5);
  light.position.set(pawn.mesh.position.x, 2, pawn.mesh.position.z);
  scene.add(light);
  
  // Animation de saut
  const startY = pawn.mesh.position.y;
  const jumpDuration = 1000;
  const startTime = Date.now();
  
  function jump() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / jumpDuration, 1);
    const jumpProgress = Math.sin(progress * Math.PI * 4) * 0.5;
    
    pawn.mesh.position.y = startY + jumpProgress;
    pawn.mesh.rotation.y += 0.1;
    
    if (progress < 1) {
      requestAnimationFrame(jump);
    } else {
      pawn.mesh.position.y = startY;
      scene.remove(light);
    }
  }
  jump();
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

// Fonctions utilitaires
function rgbToHex(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}

function darkenColor(hex) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return '#' + ((r * 0.7) << 16 | (g * 0.7) << 8 | (b * 0.7)).toString(16).padStart(6, '0');
}

// Exporter pour utilisation
export {
  initGame,
  gameConfig,
  PLAYER_COLORS
};