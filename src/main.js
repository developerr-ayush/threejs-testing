import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { createScene } from "./scene.js";
import { loadAllModels } from "./loadModels.js";
import { createMainCamera, setCameraAspect } from "./cameras.js";
import {
  MODEL_PATHS,
  carPositions,
  movementLerp,
  orbitControlsConfig,
} from "./config.js";

// GUI
const gui = new GUI();

// App state
const controlState = {
  raceMode: false,
  cars: [
    { speed: 0.01, progress: 0 },
    { speed: 0.011, progress: 0.25 },
    { speed: 0.012, progress: 0.5 },
    { speed: 0.009, progress: 0.75 },
  ],
};

// Create a closed-loop path for the race track
const racePath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 2, 80),
  new THREE.Vector3(90, 2, 0),
  new THREE.Vector3(0, 2, -80),
  new THREE.Vector3(-90, 2, 0),
]);
racePath.curveType = "catmullrom";
racePath.closed = true;

// For interactive control from the browser console
window.carTargets = carPositions;

// Renderer setup
const app = document.getElementById("app");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
app.appendChild(renderer.domElement);

// Scene
const scene = createScene();

// Cameras
const mainCamera = createMainCamera(window.innerWidth, window.innerHeight);

// Orbit controls for main camera
const controls = new OrbitControls(mainCamera, renderer.domElement);
controls.enableDamping = orbitControlsConfig.enableDamping;
controls.enablePan = orbitControlsConfig.enablePan;
controls.minDistance = orbitControlsConfig.minDistance;
controls.maxDistance = orbitControlsConfig.maxDistance;
controls.target.set(
  orbitControlsConfig.target.x,
  orbitControlsConfig.target.y,
  orbitControlsConfig.target.z
);
controls.update();

// State for cars
let carObjects = []; // Object3D for each car
let trackObject = null;

// For smooth motion, we store current positions separately and LERP toward targets
const carCurrentPositions = carPositions.map(
  (p) => new THREE.Vector3(p.x, p.y, p.z)
);

// Load models
(async function init() {
  const { track, cars } = await loadAllModels(
    MODEL_PATHS.track,
    MODEL_PATHS.cars
  );

  track.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  trackObject = track;
  scene.add(track);

  carObjects = cars.map((car, i) => {
    car.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    car.position.copy(carCurrentPositions[i] || new THREE.Vector3());
    scene.add(car);
    return car;
  });

  // Create GUI controls
  gui.add(controlState, "raceMode").name("Enable Race Mode");

  const manualFolder = gui.addFolder("Manual Controls");
  carPositions.forEach((pos, i) => {
    const folder = manualFolder.addFolder(`Car ${i + 1}`);
    folder.add(pos, "x", -100, 100, 0.1).name("Position X");
    folder.add(pos, "z", -100, 100, 0.1).name("Position Z");
    folder.open();
  });

  const raceFolder = gui.addFolder("Race Controls");
  controlState.cars.forEach((state, i) => {
    raceFolder.add(state, "speed", 0, 0.05, 0.001).name(`Car ${i + 1} Speed`);
  });
  raceFolder.open();

  animate(0);
})();

// Resize handling: update camera aspects and renderer
function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  setCameraAspect(mainCamera, window.innerWidth / window.innerHeight);
}
window.addEventListener("resize", onWindowResize);

// Animation loop
let lastTime = 0;
function animate(time) {
  const delta = Math.min((time - lastTime) / 1000, 1 / 20);
  lastTime = time;

  // Animate cars based on the current mode
  if (controlState.raceMode) {
    // RACE MODE: Cars follow the racePath
    for (let i = 0; i < carObjects.length; i++) {
      const car = carObjects[i];
      const state = controlState.cars[i];
      if (!car || !state) continue;

      // Update progress and loop around the track
      state.progress = (state.progress + state.speed * delta) % 1;

      // Set position from the curve
      const newPos = racePath.getPointAt(state.progress);
      car.position.copy(newPos);

      // Set orientation from the curve tangent
      const tangent = racePath.getTangentAt(state.progress).normalize();
      const lookAtPosition = new THREE.Vector3().copy(newPos).add(tangent);
      car.lookAt(lookAtPosition);
    }
  } else {
    // MANUAL MODE: Cars move toward slider positions
    for (let i = 0; i < carObjects.length; i++) {
      const car = carObjects[i];
      if (!car) continue;
      const target = carPositions[i] || carPositions[carPositions.length - 1];
      const targetVec = new THREE.Vector3(target.x, target.y, target.z);

      // Smoothly move car to target
      car.position.lerp(targetVec, movementLerp);

      // **FIXED**: Orient the car horizontally towards its target
      const lookAtTarget = new THREE.Vector3().copy(targetVec);
      lookAtTarget.y = car.position.y; // Keep the car level

      // Avoid looking at self if already at target
      if (lookAtTarget.distanceToSquared(car.position) > 0.01) {
        car.lookAt(lookAtTarget);
      }
    }
  }

  controls.update();

  renderer.render(scene, mainCamera);

  requestAnimationFrame(animate);
}
