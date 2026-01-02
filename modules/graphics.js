import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.152.2/examples/jsm/controls/OrbitControls.js';
import { gameConfig } from './config.js';
import { animatePawns } from './pawns.js';

let scene, camera, renderer, controls;
let boardSize = 15; // Valeur par défaut

export function initGraphics(container) {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0f1724, 30, 100);
  
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  const cameraDistance = boardSize * 1.8;
  camera.position.set(0, cameraDistance * 1.2, cameraDistance);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  setupControls();
  setupLights();
  
  return { scene, camera, renderer, controls };
}

function setupControls() {
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

export function animateGraphics(graphics) {
  function animate() {
    requestAnimationFrame(animate);
    const elapsed = performance.now() * 0.001;
    
    // Animation des pions
    animatePawns(elapsed);
    
    graphics.controls.update();
    graphics.renderer.render(graphics.scene, graphics.camera);
  }
  animate();
}

export function handleResize(graphics) {
  graphics.camera.aspect = window.innerWidth / window.innerHeight;
  graphics.camera.updateProjectionMatrix();
  graphics.renderer.setSize(window.innerWidth, window.innerHeight);
}

export function resetCameraView(graphics) {
  const g = graphics || { camera, controls };
  const cameraDistance = boardSize * 1.8;
  if (g.camera) g.camera.position.set(0, cameraDistance * 1.2, cameraDistance);
  if (g.controls) g.controls.target.set(0, 0, 0);
}