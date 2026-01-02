import * as THREE from 'three';
import { gameConfig } from './config.js';

export let boardSize = 0;
export let pathTiles = [];

export function createBoard(scene, numPlayers) {
  boardSize = 10 + numPlayers * 1.5 + gameConfig.pathLength * 0.8;
  
  // Sol
  createFloor(scene);
  createPolygonBoard(scene, numPlayers);
  createCenterDecoration(scene);
}

function createFloor(scene) {
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
}

function createPolygonBoard(scene, numPlayers) {
  const boardRadius = boardSize * 0.8;
  const angleStep = (Math.PI * 2) / numPlayers;
  
  // Base du plateau polygonal
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
  createBoardBorder(scene, boardRadius, angleStep, numPlayers);
  
  // Bases des joueurs et chemins
  createPlayerBases(scene, boardRadius, angleStep, numPlayers);
}

function createBoardBorder(scene, radius, angleStep, numPlayers) {
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
}

function createPlayerBases(scene, radius, angleStep, numPlayers) {
  pathTiles = [];
  const colors = getPlayerColors();
  
  for (let i = 0; i < numPlayers; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const baseRadius = 2.5;
    const baseDistance = radius * 0.6;
    const baseX = Math.cos(angle) * baseDistance;
    const baseZ = Math.sin(angle) * baseDistance;
    
    createBase(scene, baseX, baseZ, baseRadius, i, colors[i]);
    createPathTilesForPlayer(scene, i, baseX, baseZ, angle, colors[i]);
    createPawnsForPlayer(scene, i, baseX, baseZ, baseRadius, colors[i]);
  }
}

function createBase(scene, x, z, radius, playerIndex, playerColor) {
  const baseGeo = new THREE.CylinderGeometry(radius, radius, 0.6, 32);
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
}

function createPathTilesForPlayer(scene, playerIndex, baseX, baseZ, angle, playerColor) {
  const pathLength = gameConfig.pathLength;
  const tileSize = 0.9;
  const spacing = 1.2;
  
  // Chemin principal radiaire
  for (let j = 1; j <= pathLength; j++) {
    const distance = 3.5 + (j * spacing);
    const tileX = baseX + Math.cos(angle) * distance;
    const tileZ = baseZ + Math.sin(angle) * distance;
    
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
    
    pathTiles.push({
      mesh: tile,
      playerIndex: playerIndex,
      position: { x: tileX, z: tileZ },
      order: j
    });
    
    // Marqueurs spéciaux
    if (j === 1) createStartMarker(scene, tileX, 0.15, tileZ, playerColor.hex);
    if (j === pathLength) createEndMarker(scene, tileX, 0.15, tileZ, playerColor.hex);
  }
}

function createStartMarker(scene, x, y, z, color) {
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

function createEndMarker(scene, x, y, z, color) {
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

function createPawnsForPlayer(scene, playerIndex, baseX, baseZ, baseRadius, playerColor) {
  const pawnsPerPlayer = gameConfig.pawnsPerPlayer;
  const angleStep = (Math.PI * 2) / pawnsPerPlayer;
  
  for (let i = 0; i < pawnsPerPlayer; i++) {
    const angle = i * angleStep;
    const spawnRadius = baseRadius * 0.6;
    const sx = baseX + Math.cos(angle) * spawnRadius;
    const sz = baseZ + Math.sin(angle) * spawnRadius;
    
    // Marqueur sous le pion
    createSpawnMarker(scene, sx, sz);
    
    // Créer le pion
    const pawn = createPawnMesh(playerColor.hex);
    pawn.position.set(sx, 0.7, sz);
    scene.add(pawn);
    
    // Pousser le pion dans le tableau global
    if (!window.pawnsGlobal) window.pawnsGlobal = [];
    window.pawnsGlobal.push({
      mesh: pawn,
      playerIndex: playerIndex,
      colorHex: playerColor.hex,
      colorName: playerColor.name,
      cssClass: playerColor.cssClass,
      home: { x: sx, z: sz },
      id: playerIndex * pawnsPerPlayer + i,
      inPlay: false,
      currentTile: null,
      pathProgress: 0,
      animating: false
    });
  }
}

function createSpawnMarker(scene, x, z) {
  const circleGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 32);
  const circleMat = new THREE.MeshStandardMaterial({
    color: 0x347589,
    metalness: 0.5,
    roughness: 0.3
  });
  const mark = new THREE.Mesh(circleGeo, circleMat);
  mark.position.set(x, 0.35, z);
  mark.castShadow = true;
  scene.add(mark);
}

function createPawnMesh(color) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.65, 32);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: color,
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

function createCenterDecoration(scene) {
  const holeRadius = 1.5;
  
  // Trou central
  const holeGeo = new THREE.CylinderGeometry(holeRadius, holeRadius * 0.9, 0.8, 32);
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    metalness: 0.1,
    roughness: 0.95
  });
  const hole = new THREE.Mesh(holeGeo, holeMat);
  hole.position.set(0, -0.38, 0);
  scene.add(hole);

  // Lumière centrale
  const rimLight = new THREE.PointLight(0x3b82f6, 0.2, 5);
  rimLight.position.set(0, 0.1, 0);
  scene.add(rimLight);
}

function getPlayerColors() {
  return [
    { name: 'Rouge', hex: 0xef4444, cssClass: 'color-red' },
    { name: 'Jaune', hex: 0xfbbf24, cssClass: 'color-yellow' },
    { name: 'Vert', hex: 0x22c55e, cssClass: 'color-green' },
    { name: 'Bleu', hex: 0x3b82f6, cssClass: 'color-blue' },
    { name: 'Violet', hex: 0xa855f7, cssClass: 'color-violet' },
    { name: 'Orange', hex: 0xf97316, cssClass: 'color-orange' },
    { name: 'Rose', hex: 0xec4899, cssClass: 'color-pink' },
    { name: 'Cyan', hex: 0x06b6d4, cssClass: 'color-cyan' }
  ];
}

export function getPathTiles() {
  return pathTiles;
}

export function getBoardSize() {
  return boardSize;
}