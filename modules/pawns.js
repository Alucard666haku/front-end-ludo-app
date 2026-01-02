import * as THREE from 'three';
import { gameConfig, PLAYER_COLORS } from './config.js';

export let pawns = [];

export function createPawnsForPlayer(scene, playerIndex, baseX, baseZ, baseRadius) {
  const pawnsPerPlayer = gameConfig.pawnsPerPlayer;
  const angleStep = (Math.PI * 2) / pawnsPerPlayer;
  const playerColor = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  
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

  // Corps
  const bodyGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.65, 32);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.3,
    roughness: 0.5
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  // Tête
  const headGeo = new THREE.SphereGeometry(0.22, 32, 32);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 0.5;
  head.castShadow = true;
  group.add(head);

  // Détail
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

export function animatePawns(elapsed) {
  pawns.forEach((p, i) => {
    if (!p.animating) {
      if (!p.inPlay) {
        p.mesh.position.y = 0.7 + Math.sin(elapsed * 2 + i) * 0.03;
      }
      p.mesh.rotation.y = elapsed * 0.5 + i;
    }
  });
}

export function getPawns() {
  return pawns;
}

export function getPlayerPawns(playerIndex) {
  return pawns.filter(p => p.playerIndex === playerIndex);
}

export function updatePawnPosition(pawnId, x, z, tile = null) {
  const pawn = pawns.find(p => p.id === pawnId);
  if (pawn) {
    pawn.mesh.position.x = x;
    pawn.mesh.position.z = z;
    if (tile) {
      pawn.currentTile = tile;
    }
  }
}

export function setPawnAnimation(pawnId, animating) {
  const pawn = pawns.find(p => p.id === pawnId);
  if (pawn) {
    pawn.animating = animating;
  }
}