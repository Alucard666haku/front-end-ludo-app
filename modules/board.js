import * as THREE from 'three';
import { gameConfig } from './config.js';

export let boardSize = 0;
export let pathTiles = [];

export function createBoard(scene, numPlayers) {
  boardSize = 10 + numPlayers * 1.5 + gameConfig.pathLength * 0.8;
  
  // Sol
  createFloor(scene);
  createSquareBoard(scene, numPlayers);
  createCenterDecoration(scene);
}

function createFloor(scene) {
  const floorGeo = new THREE.PlaneGeometry(50, 50);
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

function createSquareBoard(scene, numPlayers) {
  const SIZE = 15;
  const TILE = 1;

  function toPos(col, row) {
    const x = (col - (SIZE + 1) / 2) * TILE;
    const z = (row - (SIZE + 1) / 2) * TILE;
    return { x, z };
  }

  // Base du plateau
  const boardBase = new THREE.Group();
  const baseGeo = new THREE.BoxGeometry(SIZE * TILE + 1, 0.8, SIZE * TILE + 1);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.3,
    roughness: 0.7
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -0.4;
  base.castShadow = true;
  base.receiveShadow = true;
  boardBase.add(base);

  // Bordure
  const borderGeo = new THREE.BoxGeometry(SIZE * TILE + 1.2, 0.3, SIZE * TILE + 1.2);
  const borderMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.8,
    roughness: 0.2
  });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.y = -0.05;
  border.castShadow = true;
  boardBase.add(border);
  scene.add(boardBase);

  // Tuiles de la grille
  const tileGroup = new THREE.Group();
  for (let r = 1; r <= SIZE; r++) {
    for (let c = 1; c <= SIZE; c++) {
      const { x, z } = toPos(c, r);
      const height = isSpecialTile(c, r) ? 0.18 : 0.12;
      const geom = new THREE.BoxGeometry(TILE * 0.96, height, TILE * 0.96);
      const color = determineTileColor(c, r, numPlayers, SIZE);
      const mat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.1,
        roughness: 0.6
      });
      const tile = new THREE.Mesh(geom, mat);
      tile.position.set(x, height / 2, z);
      tile.castShadow = true;
      tile.receiveShadow = true;
      tileGroup.add(tile);

      if (isStarTile(c, r)) {
        createStarMarker(scene, x, height + 0.01, z);
      }
    }
  }
  scene.add(tileGroup);

  createGameBases(scene, numPlayers, SIZE, TILE, toPos);
}

function determineTileColor(c, r, numPlayers, SIZE) {
  const colors = [
    0xef4444, // Rouge
    0xfbbf24, // Jaune
    0x22c55e, // Vert
    0x3b82f6, // Bleu
    0xa855f7, // Violet
    0xf97316, // Orange
    0xec4899, // Rose
    0x06b6d4  // Cyan
  ];

  if (numPlayers === 4) {
    // Configuration 4 joueurs
    if (c >= 1 && c <= 6 && r >= 1 && r <= 6) return colors[0];      // Rouge
    if (c >= 10 && c <= 15 && r >= 1 && r <= 6) return colors[1];    // Jaune
    if (c >= 1 && c <= 6 && r >= 10 && r <= 15) return colors[2];    // Vert
    if (c >= 10 && c <= 15 && r >= 10 && r <= 15) return colors[3];  // Bleu
    if (c >= 7 && c <= 9 && r >= 7 && r <= 9) return 0xffffff;

    if (r === 8 && c >= 2 && c <= 6) return 0xfecaca;
    if (r === 8 && c >= 10 && c <= 14) return 0xfef3c7;
    if (c === 8 && r >= 10 && r <= 14) return 0xd1fae5;
    if (c === 8 && r >= 2 && r <= 6) return 0xdbeafe;
  } else if (numPlayers === 3) {
    // Triangle - 3 coins
    const mid = 8;
    if (c >= 1 && c <= 5 && r >= 1 && r <= 5) return colors[0];      // Rouge
    if (c >= 11 && c <= 15 && r >= 1 && r <= 5) return colors[1];    // Jaune
    if (c >= 1 && c <= 15 && r >= 11 && r <= 15) return colors[2];   // Vert
    if (c >= 7 && c <= 9 && r >= 7 && r <= 9) return 0xffffff;
  } else if (numPlayers >= 5) {
    // 5-8 joueurs - utiliser les 4 coins + positions additionnelles
    if (c >= 1 && c <= 6 && r >= 1 && r <= 6) return colors[0];      // Rouge
    if (c >= 10 && c <= 15 && r >= 1 && r <= 6) return colors[1];    // Jaune
    if (c >= 1 && c <= 6 && r >= 10 && r <= 15) return colors[2];    // Vert
    if (c >= 10 && c <= 15 && r >= 10 && r <= 15) return colors[3];  // Bleu
    
    // Positions additionnelles
    if (numPlayers >= 5 && c >= 7 && c <= 9 && r >= 1 && r <= 3) return colors[4];    // Violet haut
    if (numPlayers >= 6 && c >= 13 && c <= 15 && r >= 7 && r <= 9) return colors[5];  // Orange droite
    if (numPlayers >= 7 && c >= 7 && c <= 9 && r >= 13 && r <= 15) return colors[6];  // Rose bas
    if (numPlayers >= 8 && c >= 1 && c <= 3 && r >= 7 && r <= 9) return colors[7];    // Cyan gauche
    
    if (c >= 7 && c <= 9 && r >= 7 && r <= 9) return 0xffffff;
  }
  
  return 0xf8fafc; // Gris clair par défaut
}

function isSpecialTile(c, r) {
  return (c === 7 && r === 2) || (c === 2 && r === 9) ||
         (c === 14 && r === 7) || (c === 9 && r === 14);
}

function isStarTile(c, r) {
  return (c === 7 && r === 3) || (c === 3 && r === 9) ||
         (c === 13 && r === 7) || (c === 9 && r === 13) ||
         (c === 2 && r === 7) || (c === 7 && r === 2) ||
         (c === 14 && r === 9) || (c === 9 && r === 14);
}

function createStarMarker(scene, x, y, z) {
  const starShape = new THREE.Shape();
  const outerRadius = 0.15;
  const innerRadius = 0.06;
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
    color: 0xfbbf24,
    metalness: 0.8,
    roughness: 0.2
  });
  const star = new THREE.Mesh(starGeo, starMat);
  star.rotation.x = -Math.PI / 2;
  star.position.set(x, y, z);
  scene.add(star);
}

function createGameBases(scene, numPlayers, SIZE, TILE, toPos) {
  const baseDefs = [];
  const colors = [
    { name: 'Rouge', hex: 0xef4444, cssClass: 'color-red' },
    { name: 'Jaune', hex: 0xfbbf24, cssClass: 'color-yellow' },
    { name: 'Vert', hex: 0x22c55e, cssClass: 'color-green' },
    { name: 'Bleu', hex: 0x3b82f6, cssClass: 'color-blue' },
    { name: 'Violet', hex: 0xa855f7, cssClass: 'color-violet' },
    { name: 'Orange', hex: 0xf97316, cssClass: 'color-orange' },
    { name: 'Rose', hex: 0xec4899, cssClass: 'color-pink' },
    { name: 'Cyan', hex: 0x06b6d4, cssClass: 'color-cyan' }
  ];
  
  // Configuration des bases
  baseDefs.push(
    { name: 'red', cols: [1, 6], rows: [1, 6], color: colors[0].hex },
    { name: 'yellow', cols: [10, 15], rows: [1, 6], color: colors[1].hex },
    { name: 'green', cols: [1, 6], rows: [10, 15], color: colors[2].hex },
    { name: 'blue', cols: [10, 15], rows: [10, 15], color: colors[3].hex }
  );
  
  if (numPlayers > 4) {
    baseDefs.push(
      { name: 'violet', cols: [7, 9], rows: [1, 3], color: colors[4].hex },
      { name: 'orange', cols: [13, 15], rows: [7, 9], color: colors[5].hex },
      { name: 'pink', cols: [7, 9], rows: [13, 15], color: colors[6].hex },
      { name: 'cyan', cols: [1, 3], rows: [7, 9], color: colors[7].hex }
    );
  }
  
  baseDefs.slice(0, numPlayers).forEach((def, baseIndex) => {
    const minC = def.cols[0], maxC = def.cols[1];
    const minR = def.rows[0], maxR = def.rows[1];
    const centerCol = (minC + maxC) / 2;
    const centerRow = (minR + maxR) / 2;
    const p = toPos(centerCol, centerRow);
    const bw = (maxC - minC + 1) * TILE;
    const bh = (maxR - minR + 1) * TILE;

    // Plateforme de base
    const geo = new THREE.BoxGeometry(bw * 0.92, 0.7, bh * 0.92);
    const mat = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: 0.4,
      metalness: 0.2
    });
    const platform = new THREE.Mesh(geo, mat);
    platform.position.set(p.x, 0.35, p.z);
    platform.castShadow = true;
    scene.add(platform);

    // Lumière
    const baseLight = new THREE.PointLight(def.color, 0.3, 8);
    baseLight.position.set(p.x, 1, p.z);
    scene.add(baseLight);

    // Spawns des pions
    const spawnOffsets = [
      [-1, -1], [1, -1], [-1, 1], [1, 1]
    ];
    
    const pawnsPerPlayer = Math.min(gameConfig.pawnsPerPlayer, 4);
    
    spawnOffsets.slice(0, pawnsPerPlayer).forEach((so, i) => {
      const sx = p.x + so[0] * 1.2;
      const sz = p.z + so[1] * 1.2;

      const circleGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 32);
      const circleMat = new THREE.MeshStandardMaterial({
        color: 0x347589,
        metalness: 0.5,
        roughness: 0.3
      });
      const mark = new THREE.Mesh(circleGeo, circleMat);
      mark.position.set(sx, 0.4, sz);
      mark.castShadow = true;
      scene.add(mark);

      const pawn = createPawn(def.color);
      pawn.position.set(sx, 0.75, sz);
      scene.add(pawn);
      
      // Pousser le pion dans le tableau global
      if (!window.pawnsGlobal) window.pawnsGlobal = [];
      window.pawnsGlobal.push({
        mesh: pawn,
        playerIndex: baseIndex,
        colorHex: def.color,
        colorName: colors[baseIndex].name,
        cssClass: colors[baseIndex].cssClass,
        home: { x: sx, z: sz },
        id: baseIndex * gameConfig.pawnsPerPlayer + i,
        inPlay: false
      });
    });
    
    // Créer les tuiles de chemin coloré pour ce joueur
    createPathTilesForPlayerSquare(scene, def, minC, maxC, minR, maxR, SIZE, TILE, toPos);
  });
}

function createPathTilesForPlayerSquare(scene, def, minC, maxC, minR, maxR, SIZE, TILE, toPos) {
  const gameColors = [
    0xef4444, // Rouge
    0xfbbf24, // Jaune
    0x22c55e, // Vert
    0x3b82f6, // Bleu
    0xa855f7, // Violet
    0xf97316, // Orange
    0xec4899, // Rose
    0x06b6d4  // Cyan
  ];
  const pathLength = gameConfig.pathLength;
  let pathTilesForThisPlayer = [];
  
  // Déterminer les tuiles de chemin basées sur la position
  if (minC === 1 && maxC === 6 && minR === 1 && maxR === 6) {
    // Rouge - chemin vertical
    for (let j = 1; j <= pathLength; j++) {
      const p = toPos(7, 8 - j);
      pathTilesForThisPlayer.push(p);
    }
  } else if (minC === 10 && maxC === 15 && minR === 1 && maxR === 6) {
    // Jaune - chemin horizontal
    for (let j = 1; j <= pathLength; j++) {
      const p = toPos(9 + j, 8);
      pathTilesForThisPlayer.push(p);
    }
  } else if (minC === 1 && maxC === 6 && minR === 10 && minR <= 15) {
    // Vert - chemin vers gauche
    for (let j = 1; j <= pathLength; j++) {
      const p = toPos(8 - j, 8);
      pathTilesForThisPlayer.push(p);
    }
  } else if (minC === 10 && maxC === 15 && minR === 10 && minR <= 15) {
    // Bleu - chemin vers bas
    for (let j = 1; j <= pathLength; j++) {
      const p = toPos(8, 9 + j);
      pathTilesForThisPlayer.push(p);
    }
  } else if (minC === 7 && maxC === 9 && minR === 1 && maxR === 3) {
    // Violet - chemin vers haut
    for (let j = 1; j <= pathLength; j++) {
      const p = toPos(8, 1 - j);
      pathTilesForThisPlayer.push(p);
    }
  } else if (minC === 13 && maxC === 15 && minR === 7 && maxR === 9) {
    // Orange - chemin vers droite
    for (let j = 1; j <= pathLength; j++) {
      const p = toPos(16 + j, 8);
      pathTilesForThisPlayer.push(p);
    }
  } else if (minC === 7 && maxC === 9 && minR === 13 && maxR <= 15) {
    // Rose - chemin vers bas
    for (let j = 1; j <= pathLength; j++) {
      const p = toPos(8, 16 + j);
      pathTilesForThisPlayer.push(p);
    }
  } else if (minC === 1 && maxC === 3 && minR === 7 && maxR === 9) {
    // Cyan - chemin vers gauche
    for (let j = 1; j <= pathLength; j++) {
      const p = toPos(0 - j, 8);
      pathTilesForThisPlayer.push(p);
    }
  }
  
  // Créer les tuiles physiques
  pathTilesForThisPlayer.forEach((pos, idx) => {
    const tileSize = 0.8;
    const tileGeo = new THREE.BoxGeometry(tileSize, 0.15, tileSize);
    const tileMat = new THREE.MeshStandardMaterial({
      color: def.color,
      metalness: 0.1,
      roughness: 0.6,
      opacity: 0.7,
      transparent: true
    });
    const tile = new THREE.Mesh(tileGeo, tileMat);
    tile.position.set(pos.x, 0.08, pos.z);
    tile.castShadow = true;
    tile.receiveShadow = true;
    scene.add(tile);
    
    pathTiles.push({
      mesh: tile,
      playerIndex: 0, // À adapter
      position: { x: pos.x, z: pos.z },
      order: idx + 1
    });
  });
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

function createCenterDecoration(scene) {
  const holeRadius = 1.2;
  
  const holeGeo = new THREE.CylinderGeometry(holeRadius, holeRadius * 0.9, 0.8, 32);
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    metalness: 0.1,
    roughness: 0.95
  });
  const hole = new THREE.Mesh(holeGeo, holeMat);
  hole.position.set(0, -0.38, 0);
  scene.add(hole);

  const rimLight = new THREE.PointLight(0x3b82f6, 0.2, 5);
  rimLight.position.set(0, 0.1, 0);
  scene.add(rimLight);
}

export function getPathTiles() {
  return pathTiles;
}

export function getBoardSize() {
  return boardSize;
}