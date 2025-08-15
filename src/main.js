import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import * as CANNON from "cannon-es";
import { createScene } from "./scene.js";
import { loadAllModels } from "./loadModels.js";
import {
  createMainCamera,
  setCameraAspect,
  getFollowCameraTransform,
  createHelperCamera,
} from "./cameras.js";
import { createHUD, updateHUD, resizeHUD } from "./hud.js";
import {
  MODEL_PATHS,
  carPositions,
  movementLerp,
  orbitControlsConfig,
  racePathPoints,
  car1Spawn,
  physicsConfig,
  gameplayConfig,
  kinematicMovement,
  keyboardControls,
  f1CarSpecs,
} from "./config.js";
import {
  createPhysicsWorld,
  createTrackBody,
  createCarBody,
} from "./physics.js";
import {
  initializeKeyboardControls,
  updateCarControls,
  keyState,
} from "./controls.js";

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
const racePath = new THREE.CatmullRomCurve3(
  racePathPoints.map((p) => new THREE.Vector3(p.x, p.y, p.z))
);
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

// Physics (optional)
const world = gameplayConfig.physicsEnabled ? createPhysicsWorld() : null;

// Cameras
const mainCamera = createMainCamera(window.innerWidth, window.innerHeight);
const helperCamera = createHelperCamera(window.innerWidth, window.innerHeight);
let activeCamera = mainCamera; // switchable between follow and helper
let followMode = "top"; // "top" | "chase" | "bottom" | "t_cam" | "front_wing"

// HUD
const { hudScene, hudCamera, elements: hudElements } = createHUD();
let showHUD = true;

// Helper camera controls (free navigation)
const helperControls = new OrbitControls(helperCamera, renderer.domElement);
helperControls.enableDamping = true;
helperControls.enablePan = true;
helperControls.minDistance = 1;
helperControls.maxDistance = 5000;
helperControls.target.set(0, 0, 0);
helperControls.update();

// Initialize keyboard controls
initializeKeyboardControls();

// State for cars
let carObjects = []; // Object3D for each car
let carBodies = []; // Physics bodies for each car
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

  // Create track physics body if physics enabled
  if (world) {
    const trackBody = createTrackBody(trackObject);
    world.addBody(trackBody);
  }

  carObjects = cars.map((car, i) => {
    car.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    // Place cars. Car 1 uses precise spawn, others use defaults
    if (i === 0) {
      car.position.set(
        car1Spawn.position.x,
        car1Spawn.position.y + physicsConfig.suspensionOffset,
        car1Spawn.position.z
      );
      car.rotation.y = car1Spawn.yaw; // align yaw to track
    } else {
      car.position.copy(carCurrentPositions[i] || new THREE.Vector3());
      // Ensure cars face along +Z (down the straight)
      car.rotation.y = Math.PI / 2;
    }
    scene.add(car);

    // Create a physics body for the car if physics enabled
    if (world) {
      const carBody = createCarBody(
        i === 0
          ? {
              x: car1Spawn.position.x,
              y: car1Spawn.position.y,
              z: car1Spawn.position.z,
            }
          : carPositions[i]
      );
      // Match body orientation with visual car
      const q = new CANNON.Quaternion();
      q.setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        i === 0 ? car1Spawn.yaw : Math.PI / 2
      );
      carBody.quaternion.copy(q);
      world.addBody(carBody);
      carBodies.push(carBody);
    } else {
      carBodies.push(null);
    }

    return car;
  });

  // Create GUI controls
  gui.add(controlState, "raceMode").name("Enable Race Mode");

  // Camera controls
  const camFolder = gui.addFolder("Camera");
  const camState = {
    active: "Follow Car 1",
    followMode: "Top",
    axesHelper: false,
    gridHelper: false,
  };
  camFolder
    .add(camState, "active", ["Follow Car 1", "Helper Camera"])
    .name("Active Camera")
    .onChange((v) => {
      activeCamera = v === "Helper Camera" ? helperCamera : mainCamera;
    });
  camFolder
    .add(camState, "followMode", [
      "Top",
      "Chase",
      "Bottom",
      "T-Cam",
      "Front Wing",
    ])
    .name("Follow Mode")
    .onChange((v) => {
      // Convert UI labels to config keys
      const modeMap = {
        Top: "top",
        Chase: "chase",
        Bottom: "bottom",
        "T-Cam": "t_cam",
        "Front Wing": "front_wing",
      };
      followMode = modeMap[v] || "top";
    });
  let axesHelper = null;
  let gridHelper = null;
  camFolder
    .add(camState, "axesHelper")
    .name("Axes Helper")
    .onChange((v) => {
      if (v) {
        axesHelper = new THREE.AxesHelper(50);
        scene.add(axesHelper);
      } else if (axesHelper) {
        scene.remove(axesHelper);
        axesHelper = null;
      }
    });
  camFolder
    .add(camState, "gridHelper")
    .name("Grid Helper")
    .onChange((v) => {
      if (v) {
        gridHelper = new THREE.GridHelper(500, 50);
        scene.add(gridHelper);
      } else if (gridHelper) {
        scene.remove(gridHelper);
        gridHelper = null;
      }
    });

  // Capture coordinate buttons
  const captureFolder = gui.addFolder("Capture");
  const capture = {
    copyCar1: () => {
      const pos = carBodies[0]?.position || carObjects[0].position;
      const q = carBodies[0]?.quaternion || carObjects[0].quaternion;
      const yaw = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion(q.x, q.y, q.z, q.w),
        "YXZ"
      ).y;
      const data = { position: { x: pos.x, y: pos.y, z: pos.z }, yaw };
      const text = JSON.stringify(data, null, 2);
      if (navigator.clipboard)
        navigator.clipboard.writeText(text).catch(() => {});
      console.log("Captured Car1:", text);
    },
    copyHelperCam: () => {
      const p = helperCamera.position;
      const t = helperControls.target;
      const data = {
        camera: { x: p.x, y: p.y, z: p.z },
        target: { x: t.x, y: t.y, z: t.z },
      };
      const text = JSON.stringify(data, null, 2);
      if (navigator.clipboard)
        navigator.clipboard.writeText(text).catch(() => {});
      console.log("Captured Helper Camera:", text);
    },
  };
  captureFolder.add(capture, "copyCar1").name("Copy Car1 Coords");
  captureFolder.add(capture, "copyHelperCam").name("Copy Helper Cam");

  // Car 1 utilities
  const car1Folder = gui.addFolder("Car 1 Utils");
  const car1Utils = {
    resetToSpawn: () => {
      if (!carObjects[0]) return;
      if (carBodies[0]) {
        const body = carBodies[0];
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.position.set(
          car1Spawn.position.x,
          car1Spawn.position.y,
          car1Spawn.position.z
        );
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), car1Spawn.yaw);
        body.quaternion.copy(q);
        carObjects[0].position.set(
          car1Spawn.position.x,
          car1Spawn.position.y,
          car1Spawn.position.z
        );
        carObjects[0].quaternion.set(q.x, q.y, q.z, q.w);
      } else {
        carObjects[0].position.set(
          car1Spawn.position.x,
          car1Spawn.position.y + physicsConfig.suspensionOffset,
          car1Spawn.position.z
        );
        carObjects[0].rotation.set(0, car1Spawn.yaw, 0);
      }
      console.log("Car1 reset to spawn", car1Spawn);
    },
  };
  car1Folder.add(car1Utils, "resetToSpawn").name("Reset to Spawn");

  // Expose a helper to set car 1 transform from console
  window.setCar1Transform = (data) => {
    try {
      if (!data) return;
      const p = data.position || data.pos || data;
      const yaw = data.yaw ?? car1Spawn.yaw;
      if (carBodies[0]) {
        carBodies[0].velocity.set(0, 0, 0);
        carBodies[0].angularVelocity.set(0, 0, 0);
        if (p && typeof p.x === "number") {
          carBodies[0].position.set(p.x, p.y ?? 2, p.z);
          carObjects[0].position.set(p.x, p.y ?? 2, p.z);
        }
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), yaw);
        carBodies[0].quaternion.copy(q);
        carObjects[0].quaternion.set(q.x, q.y, q.z, q.w);
      } else {
        if (p && typeof p.x === "number") {
          carObjects[0].position.set(p.x, p.y ?? 2, p.z);
        }
        carObjects[0].rotation.set(0, yaw, 0);
      }
      console.log("Car1 set to", { position: p, yaw });
    } catch (e) {
      console.error("Failed to set Car1 transform", e);
    }
  };

  const manualFolder = gui.addFolder("Manual Controls");
  manualFolder.open();
  carPositions.forEach((pos, i) => {
    const folder = manualFolder.addFolder(`Car ${i + 1}`);
    folder.add(pos, "x", -100, 100, 0.1).name("Position X");
    folder.add(pos, "z", -100, 100, 0.1).name("Position Z");
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
  setCameraAspect(helperCamera, window.innerWidth / window.innerHeight);
  resizeHUD(hudCamera, hudElements);
}
window.addEventListener("resize", onWindowResize);

// Animation loop
let lastTime = 0;
function animate(time) {
  const delta = Math.min((time - lastTime) / 1000, 1 / 20);
  lastTime = time;

  // Step the physics world
  if (world) {
    world.step(1 / 60, delta, 3);
  }

  // Animate cars based on the current mode
  if (controlState.raceMode) {
    // RACE MODE: Cars follow the racePath
    for (let i = 0; i < carObjects.length; i++) {
      const car = carObjects[i];
      const body = carBodies[i];
      const state = controlState.cars[i];
      if (!car || !state || !body) continue;

      // Update progress and loop around the track
      state.progress = (state.progress + state.speed * delta) % 1;

      // Set position from the curve
      const newPos = racePath.getPointAt(state.progress);
      car.position.copy(newPos);
      body.position.copy(newPos);

      // Set orientation from the curve tangent
      const tangent = racePath.getTangentAt(state.progress).normalize();
      const lookAtPosition = new THREE.Vector3().copy(newPos).add(tangent);
      car.lookAt(lookAtPosition);
      body.quaternion.copy(car.quaternion);
    }
  } else {
    // PHYSICS-DRIVEN MODE
    for (let i = 0; i < carObjects.length; i++) {
      const car = carObjects[i];
      const body = carBodies[i];
      if (!car) continue;

      // Sync visual object if physics enabled
      if (world && body) {
        car.position.copy(body.position);
        car.quaternion.copy(body.quaternion);
      }

      // Apply keyboard controls to the first car
      if (i === 0) {
        if (world && body) {
          updateCarControls(body, delta, (pos, vel) => {
            console.log(
              `Car1 position: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(
                2
              )}, z=${pos.z.toFixed(2)} | velocity: x=${vel.x.toFixed(
                2
              )}, y=${vel.y.toFixed(2)}, z=${vel.z.toFixed(2)}`
            );
          });
        } else {
          // Kinematic controller with acceleration, drag, and optional strafing (hold Shift)
          if (!car.userData.velocity)
            car.userData.velocity = new THREE.Vector3();
          const vel = car.userData.velocity;

          const isForward = !!keyState[keyboardControls.forward];
          const isBackward = !!keyState[keyboardControls.backward];
          const isLeft = !!keyState[keyboardControls.left];
          const isRight = !!keyState[keyboardControls.right];
          const yawLeft = !!keyState[keyboardControls.yawLeft];
          const yawRight = !!keyState[keyboardControls.yawRight];
          const isStrafe = !!keyState[keyboardControls.modifierStrafe];

          // Steering with A/D (unless strafing)
          if (!isStrafe) {
            const steer = (yawLeft ? 1 : 0) - (yawRight ? 1 : 0);
            car.rotation.y += steer * kinematicMovement.yawSpeed * delta;
          }

          const quat = new THREE.Quaternion().setFromEuler(car.rotation);
          const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
          const rightV = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
          const accel = new THREE.Vector3();
          if (isForward)
            accel.addScaledVector(fwd, kinematicMovement.accelForward);
          if (isBackward)
            accel.addScaledVector(fwd, -kinematicMovement.accelForward * 0.7);
          if (isStrafe) {
            if (isRight)
              accel.addScaledVector(rightV, kinematicMovement.accelStrafe);
            if (isLeft)
              accel.addScaledVector(rightV, -kinematicMovement.accelStrafe);
          }
          vel.addScaledVector(accel, delta);

          // Drag / braking
          const drag =
            isBackward && !isForward
              ? kinematicMovement.brakeDrag
              : kinematicMovement.drag;
          vel.addScaledVector(vel, -drag * delta);

          // Clamp speed
          const speed = vel.length();
          if (speed > kinematicMovement.maxSpeed) {
            vel.multiplyScalar(kinematicMovement.maxSpeed / speed);
          }

          // Integrate
          car.position.addScaledVector(vel, delta);

          // Calculate F1 car data for HUD
          const speedKph = speed * 3.6; // Convert units/sec to km/h
          const maxSpeedRatio = speedKph / f1CarSpecs.maxSpeedKph;

          // Simulate RPM based on speed
          const rpm =
            f1CarSpecs.idleRPM +
            (f1CarSpecs.maxRPM - f1CarSpecs.idleRPM) *
              Math.min(1, maxSpeedRatio * 1.2);

          // Simulate gear based on RPM and speed
          let gear = 0; // Neutral
          if (speedKph > 0) {
            gear =
              1 +
              Math.min(
                f1CarSpecs.gears - 1,
                Math.floor(maxSpeedRatio * f1CarSpecs.gears)
              );
          }

          // Update HUD
          if (showHUD) {
            updateHUD(hudElements, { speed: speedKph, rpm, gear });
          }

          // Debug log while moving (10 Hz)
          if (speed > 0.5) {
            car.userData._logT = (car.userData._logT || 0) + delta;
            if (car.userData._logT > 0.1) {
              car.userData._logT = 0;
              console.log(
                `Car1 pos: x=${car.position.x.toFixed(
                  2
                )}, y=${car.position.y.toFixed(2)}, z=${car.position.z.toFixed(
                  2
                )}, yaw=${car.rotation.y.toFixed(2)}, speed=${speedKph.toFixed(
                  1
                )} km/h, gear=${gear}`
              );
            }
          }
        }
      } else {
        // Lerp other cars to target positions from GUI
        const target = carPositions[i];
        const targetVec = new CANNON.Vec3(target.x, target.y, target.z);
        if (world && body) {
          body.position.lerp(targetVec, movementLerp, body.position);
          body.velocity.set(0, 0, 0); // Reset velocity
        } else {
          car.position.lerp(
            new THREE.Vector3(target.x, target.y, target.z),
            movementLerp
          );
        }
      }
    }
  }

  // Follow camera for car 1 in non-race mode
  if (!controlState.raceMode) {
    const { cameraPos, lookAt } = getFollowCameraTransform(
      carBodies[0]?.position || carObjects[0].position,
      carBodies[0]?.quaternion || carObjects[0].quaternion,
      followMode
    );
    mainCamera.position.lerp(cameraPos, 0.2);
    mainCamera.lookAt(lookAt);
  }

  helperControls.update();

  // Render main scene with active camera
  renderer.render(scene, activeCamera);

  // Render HUD if enabled
  if (showHUD && activeCamera !== helperCamera) {
    // Don't clear the depth buffer so HUD renders on top
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(hudScene, hudCamera);
    renderer.autoClear = true;
  }

  requestAnimationFrame(animate);
}

// Keyboard controls for camera and HUD
window.addEventListener("keydown", (e) => {
  // Toggle follow camera mode with key 'c'
  if (e.key.toLowerCase() === "c") {
    // Cycle through camera modes
    const modes = ["top", "chase", "bottom", "t_cam", "front_wing"];
    const currentIndex = modes.indexOf(followMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    followMode = modes[nextIndex];
    console.log(`Camera mode: ${followMode}`);
  }

  // Toggle HUD with 'h' key
  if (e.key.toLowerCase() === "h") {
    showHUD = !showHUD;
    console.log(`HUD: ${showHUD ? "visible" : "hidden"}`);
  }
});
