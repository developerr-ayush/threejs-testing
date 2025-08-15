import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createScene } from './scene.js';
import { loadAllModels } from './loadModels.js';
import { createMainCamera, createChaseCamera, updateChaseCamera, setCameraAspect } from './cameras.js';
import { MODEL_PATHS, carPositions, movementLerp, cameraFollowLerp, chaseCameraOffset } from './config.js';

// Renderer setup
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
app.appendChild(renderer.domElement);

// Scene
const scene = createScene();

// Cameras
let mainCamera = createMainCamera(window.innerWidth, window.innerHeight / 2); // Top half
let chaseCameras = [0, 1, 2, 3].map(() => createChaseCamera(window.innerWidth / 2, window.innerHeight / 2));

// Orbit controls for main camera
const controls = new OrbitControls(mainCamera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

// State for cars
let carObjects = []; // Object3D for each car
let trackObject = null;

// For smooth motion, we store current positions separately and LERP toward targets
const carCurrentPositions = carPositions.map(p => new THREE.Vector3(p.x, p.y, p.z));

// Load models
(async function init() {
  const { track, cars } = await loadAllModels(MODEL_PATHS.track, MODEL_PATHS.cars);

  track.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  trackObject = track;
  scene.add(track);

  carObjects = cars.map((car, i) => {
    car.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    car.position.copy(carCurrentPositions[i] || new THREE.Vector3());
    scene.add(car);
    return car;
  });

  animate(0);
})();

// Resize handling: update camera aspects and renderer
function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Main camera is top half
  setCameraAspect(mainCamera, window.innerWidth / (window.innerHeight / 2));

  // Four chase cams tiled in bottom half: each quarter of bottom half
  const bottomHalfHeight = window.innerHeight / 2;
  const halfWidth = window.innerWidth / 2;
  chaseCameras.forEach((cam) => setCameraAspect(cam, halfWidth / (bottomHalfHeight / 2)));
}
window.addEventListener('resize', onWindowResize);

// Animation loop
let lastTime = 0;
function animate(time) {
  const delta = Math.min((time - lastTime) / 1000, 1 / 20);
  lastTime = time;

  // Smoothly move cars toward target positions from config
  for (let i = 0; i < carObjects.length; i++) {
    const car = carObjects[i];
    if (!car) continue;
    const target = carPositions[i] || carPositions[carPositions.length - 1];
    const targetVec = new THREE.Vector3(target.x, target.y, target.z);
    car.position.lerp(targetVec, movementLerp);

    // Optionally face forward if the model has a forward direction metadata; here we align toward target
    const direction = targetVec.clone().sub(car.position);
    if (direction.lengthSq() > 0.0001) {
      car.lookAt(car.position.clone().add(direction));
    }
  }

  // Update chase cams to follow their respective cars
  for (let i = 0; i < chaseCameras.length; i++) {
    const car = carObjects[i];
    const cam = chaseCameras[i];
    if (car && cam) {
      updateChaseCamera(cam, car, chaseCameraOffset, cameraFollowLerp);
    }
  }

  controls.update();

  // Multi-view rendering with scissor test
  renderer.setScissorTest(true);

  // Top half: main camera full width, half height
  const fullWidth = window.innerWidth;
  const halfHeight = Math.floor(window.innerHeight / 2);

  renderer.setViewport(0, halfHeight, fullWidth, window.innerHeight - halfHeight);
  renderer.setScissor(0, halfHeight, fullWidth, window.innerHeight - halfHeight);
  renderer.render(scene, mainCamera);

  // Bottom half: 4 small views in a 2x2 grid
  const viewWidth = Math.floor(fullWidth / 2);
  const viewHeight = halfHeight / 2;

  const bottomY = 0;
  const rows = [bottomY + viewHeight, bottomY];
  const cols = [0, viewWidth];

  let camIndex = 0;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const x = cols[c];
      const y = rows[r];
      const cam = chaseCameras[camIndex++];
      if (!cam) continue;
      renderer.setViewport(x, y, viewWidth, viewHeight);
      renderer.setScissor(x, y, viewWidth, viewHeight);
      renderer.render(scene, cam);
    }
  }

  renderer.setScissorTest(false);

  requestAnimationFrame(animate);
}
