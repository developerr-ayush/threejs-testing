import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import * as CANNON from "cannon-es";
import { createScene, updateLighting, lightRefs } from "./scene.js";
import {
  createLightHelpers,
  updateLightHelpers,
  debugLights,
  fixLightingIssues,
} from "./lightDebug.js";
import { resetLighting } from "./resetLighting.js";
import { fixModelMaterials, fixAllSceneMaterials } from "./fixMaterials.js";
import {
  createDebugOverlay,
  createDebugGrid,
  createDebugAxes,
  createPerformanceMonitor,
} from "./debugUtils.js";
import { loadAllModels, createLoadingScreen } from "./loadModels.js";
import {
  createMainCamera,
  setCameraAspect,
  createHelperCamera,
} from "./cameras.js";
import { CameraManager, getPageCameraList } from "./cameraManager.js";
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
import { updateCarAI } from "./carAI.js";
import {
  initializePathEditor,
  exportPathToJSON,
  clearPath,
} from "./pathEditor.js";
import {
  initializeCreatePath,
  setOverlayLineForRecording,
  startCreatePathRecording,
  stopCreatePathRecording,
  updateCreatePath,
  getSavedPathNames,
  getSavedPath,
  deleteSavedPath,
  createLineFromSavedPath,
} from "./createPath.js";

// App mode: 'index' | 'simulation' | 'path'
const APP_MODE = window.APP_MODE || "index";

// GUI
const gui = new GUI();

// App state
const controlState = {
  // Default: cars follow path on index page
  raceMode: APP_MODE === "index",
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
racePath.closed = false;

// For interactive control from the browser console
window.carTargets = carPositions;

// Renderer setup
const app = document.getElementById("app");
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Use legacy lighting mode for better compatibility
renderer.useLegacyLights = false;
renderer.physicallyCorrectLights = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
app.appendChild(renderer.domElement);

// Scene
const scene = createScene();

// Make scene and lightRefs available globally for debugging
window.scene = scene;
window.lightRefs = lightRefs;
window.renderer = renderer;

// Debug lighting
console.log("Initial lighting configuration:");
debugLights(lightRefs);

// Initialize debug overlay and tools
const debugOverlay = createDebugOverlay({ enabled: false });
const debugGrid = createDebugGrid(scene, { enabled: false });
const debugAxes = createDebugAxes(scene, { enabled: false });
const performanceMonitor = createPerformanceMonitor({ enabled: false });

// Initialize global debug controller
window.debugController.init(scene, renderer, null, lightRefs);

// Physics (optional)
const world = gameplayConfig.physicsEnabled ? createPhysicsWorld() : null;

// Cameras
const mainCamera = createMainCamera(window.innerWidth, window.innerHeight); // used as follow camera
const helperCamera = createHelperCamera(window.innerWidth, window.innerHeight);
let cameraManager = null;

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
let racePathLine = null; // Visualizer for the race path
let perCarPaths = []; // Optional per-car overrides built from saved paths
const raycaster = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0);

// Path recorder for manual driving
const pathRecorder = {
  recording: false,
  points: [],
  minSampleDistance: 0.75, // meters between samples
};

function getGroundYAt(x, z) {
  if (!trackObject) return 0;
  raycaster.set(new THREE.Vector3(x, 1000, z), down);
  const hits = raycaster.intersectObject(trackObject, true);
  if (hits && hits.length > 0) return hits[0].point.y;
  return 0;
}

function snapCarToTrack(car, yOffset = physicsConfig.suspensionOffset) {
  const gy = getGroundYAt(car.position.x, car.position.z);
  car.position.y = gy + yOffset;
}

// For smooth motion, we store current positions separately and LERP toward targets
const carCurrentPositions = carPositions.map(
  (p) => new THREE.Vector3(p.x, p.y, p.z)
);

// Load models
(async function init() {
  // Create loading screen
  const loadingScreen = createLoadingScreen();
  loadingScreen.updateText("Loading models...");

  try {
    // Load all models with improved options
    const { track, cars } = await loadAllModels(
      MODEL_PATHS.track,
      MODEL_PATHS.cars,
      {
        debug: true, // Enable debug logging for model loading
      }
    );

    // Track is already set up with proper materials and shadows from the loadAllModels function
    trackObject = track;
    scene.add(track);

    // Create a visual representation of the race path for debugging
    const pathPoints = racePath.getPoints(500);
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    racePathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(racePathLine);

    // Create track physics body if physics enabled
    if (world) {
      const trackBody = createTrackBody(trackObject);
      world.addBody(trackBody);
    }

    carObjects = cars.map((car, i) => {
      // Cars are already set up with proper materials and shadows from the loadAllModels function

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
      snapCarToTrack(car);
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

    // Hide loading screen when done
    loadingScreen.updateText("Loading complete!");
    setTimeout(() => {
      loadingScreen.hide();
    }, 500);
  } catch (error) {
    console.error("Error during initialization:", error);
    loadingScreen.updateText("Error loading models. Please refresh the page.");
  }

  // Create GUI controls
  gui.add(controlState, "raceMode").name("Enable Race Mode");

  // Camera manager setup (keyboard: 1..n to switch, C to cycle cars on index, H to toggle helper)
  const pageCameras = getPageCameraList(APP_MODE);
  cameraManager = new CameraManager({
    pageId: APP_MODE,
    availableCameras: pageCameras,
    followCamera: mainCamera,
    helperCamera,
    orbitControls: helperControls,
    getCarCount: () => carObjects.length,
    getCarPose: (idx) => {
      const i = Math.max(0, Math.min(idx ?? 0, carObjects.length - 1));
      if (carBodies[i]) {
        return {
          position: carBodies[i].position,
          quaternion: carBodies[i].quaternion,
        };
      }
      const obj = carObjects[i];
      return obj
        ? { position: obj.position, quaternion: obj.quaternion }
        : null;
    },
    smoothing: 0.2,
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

  // GUI controls for the race path overlay
  const pathFolder = gui.addFolder("Race Path Overlay");
  const pathState = {
    visible: true,
    color: 0xff0000,
    yOffset: 0.2,
    scale: 1,
    rotationY: 0,
    rotationX: 0,
    xOffset: 0,
    zOffset: 0,
  };
  // Initialize line with state values
  if (racePathLine) {
    racePathLine.visible = pathState.visible;
    racePathLine.material.color.set(pathState.color);
    racePathLine.position.y = pathState.yOffset;
    racePathLine.scale.setScalar(pathState.scale);
    racePathLine.rotation.y = pathState.rotationY;
    racePathLine.position.x = pathState.xOffset;
    racePathLine.position.z = pathState.zOffset;
    racePathLine.rotation.x = pathState.rotationX;
  }
  pathFolder
    .add(pathState, "visible")
    .name("Visible")
    .onChange((v) => {
      if (racePathLine) racePathLine.visible = v;
    });
  pathFolder
    .addColor(pathState, "color")
    .name("Color")
    .onChange((c) => {
      if (racePathLine) racePathLine.material.color.set(c);
    });
  pathFolder
    .add(pathState, "yOffset", 0, 10, 0.1)
    .name("Y Offset")
    .onChange((y) => {
      if (racePathLine) racePathLine.position.y = y;
    });
  pathFolder
    .add(pathState, "scale", 0.1, 5, 0.01)
    .name("Scale")
    .onChange((s) => {
      if (racePathLine) racePathLine.scale.setScalar(s);
    });
  pathFolder
    .add(pathState, "rotationY", -Math.PI, Math.PI, 0.01)
    .name("Rotation Y")
    .onChange((r) => {
      if (racePathLine) racePathLine.rotation.y = r;
    });
  pathFolder
    .add(pathState, "xOffset", -100, 100, 0.1)
    .name("X Offset")
    .onChange((x) => {
      if (racePathLine) racePathLine.position.x = x;
    });
  pathFolder
    .add(pathState, "zOffset", -100, 100, 0.1)
    .name("Z Offset")
    .onChange((z) => {
      if (racePathLine) racePathLine.position.z = z;
    });
  pathFolder
    .add(pathState, "rotationX", -Math.PI, Math.PI, 0.01)
    .name("Rotation X")
    .onChange((r) => {
      if (racePathLine) racePathLine.rotation.x = r;
    });
  pathFolder.open();

  // Path creator UI
  const creatorFolder = gui.addFolder("Path Creator");
  const creatorState = {
    export: exportPathToJSON,
    clear: clearPath,
  };
  creatorFolder.add(creatorState, "export").name("Export to Console/Clipboard");
  creatorFolder.add(creatorState, "clear").name("Clear Path");
  if (APP_MODE === "path") creatorFolder.open();
  else creatorFolder.close();

  // Recording while driving UI
  const recordFolder = gui.addFolder("Drive-to-Create Path");
  const recordState = {
    name: "car-1-path",
    isRecording: false,
    closeLoop: true,
    resampleCount: 800,
    speed: controlState.cars[0]?.speed ?? 0.01,
    start: () => {
      const ok = startCreatePathRecording({
        name: recordState.name,
        speed: recordState.speed,
        kinematicSnapshot: { ...kinematicMovement },
      });
      if (ok) {
        recordState.isRecording = true;
        console.log("Recording started for", recordState.name);
      }
    },
    stop: () => {
      const saved = stopCreatePathRecording({
        closeLoop: recordState.closeLoop,
        resampleCount: recordState.resampleCount,
      });
      recordState.isRecording = false;
      if (saved) {
        console.log("Saved path:", saved);
      }
      refreshSavedList();
    },
  };
  recordFolder.add(recordState, "name").name("Path Name");
  recordFolder.add(recordState, "speed", 0, 0.1, 0.001).name("Default Speed");
  recordFolder.add(recordState, "closeLoop").name("Close Loop");
  recordFolder.add(recordState, "resampleCount", 50, 2000, 1).name("Samples");
  recordFolder.add(recordState, "start").name("Start Recording");
  recordFolder.add(recordState, "stop").name("Stop & Save");
  if (APP_MODE === "simulation") recordFolder.open();
  else recordFolder.close();

  // Saved paths UI per car
  const savedPathsFolder = gui.addFolder("Assign Saved Paths");
  const savedState = {
    assigned: [null, null, null, null],
    options: ["(none)", ...getSavedPathNames()],
  };
  const savedControllers = [];

  function buildSavedControllers() {
    // Remove existing controllers from folder
    while (savedPathsFolder.controllers.length) {
      savedPathsFolder.remove(savedPathsFolder.controllers[0]);
    }
    savedControllers.length = 0;

    for (let i = 0; i < controlState.cars.length; i++) {
      const label = `Car ${i + 1}`;
      const proxy = { choice: savedState.assigned[i] || "(none)" };
      const ctrl = savedPathsFolder
        .add(proxy, "choice", savedState.options)
        .name(label)
        .onChange((val) => {
          savedState.assigned[i] = val === "(none)" ? null : val;
          rebuildPerCarPaths();
        });
      savedControllers.push({ ctrl, proxyIndex: i });
    }

    savedPathsFolder
      .add({ refresh: refreshSavedList }, "refresh")
      .name("Refresh List");
  }

  function refreshSavedList() {
    savedState.options = ["(none)", ...getSavedPathNames()];
    // Update options on existing controllers if present
    if (savedControllers.length) {
      for (const { ctrl } of savedControllers) {
        if (typeof ctrl.options === "function")
          ctrl.options(savedState.options);
      }
    } else {
      buildSavedControllers();
    }
  }

  let perCarPaths = [];
  function rebuildPerCarPaths() {
    // Remove any prior lines from scene
    perCarPaths.forEach((p) => {
      if (p && p.line) scene.remove(p.line);
    });
    perCarPaths = [];

    for (let i = 0; i < controlState.cars.length; i++) {
      const name = savedState.assigned[i];
      if (!name) {
        perCarPaths[i] = null;
        continue;
      }
      const saved = getSavedPath(name);
      if (!saved) {
        console.warn("Saved path not found:", name);
        perCarPaths[i] = null;
        continue;
      }
      const created = createLineFromSavedPath(saved);
      if (created && created.line) {
        scene.add(created.line);
        perCarPaths[i] = created;
        // Sync speed with saved params if present
        if (saved.params && typeof saved.params.speed === "number") {
          if (controlState.cars[i])
            controlState.cars[i].speed = saved.params.speed;
        }
      } else {
        perCarPaths[i] = null;
      }
    }
  }

  buildSavedControllers();
  refreshSavedList();
  if (APP_MODE === "index") savedPathsFolder.open();

  // Add lighting controls
  const lightingFolder = gui.addFolder("Lighting & Shadows");

  // Add debug options
  const debugFolder = lightingFolder.addFolder("Debug");
  const debugState = {
    showHelpers: false,
    fixLighting: () => {
      fixLightingIssues(scene, lightRefs);
      console.log("Applied lighting fixes");
      debugLights(lightRefs);
    },
    printDebug: () => {
      debugLights(lightRefs);
    },
    increaseLights: () => {
      // Increase ambient light
      if (lightRefs.ambient) {
        lightRefs.ambient.intensity = 1.0;
        lightRefs.ambient.visible = true;
        lightRefs.config.ambient.intensity = 1.0;
        lightRefs.config.ambient.enabled = true;
      }

      // Increase directional light
      if (lightRefs.directional) {
        lightRefs.directional.intensity = 1.5;
        lightRefs.directional.visible = true;
        lightRefs.config.directional.intensity = 1.5;
        lightRefs.config.directional.enabled = true;
      }

      console.log("Increased light intensity");
      debugLights(lightRefs);
    },
    emergencyLight: () => {
      // Add a bright point light at the camera position
      if (!window.emergencyLight) {
        const light = new THREE.PointLight(0xffffff, 1.0, 100);
        light.position.copy(cameraManager.getActiveCamera().position);
        scene.add(light);
        window.emergencyLight = light;
        console.log("Emergency light added");
      } else {
        // Toggle the light
        window.emergencyLight.visible = !window.emergencyLight.visible;
        console.log(
          `Emergency light ${
            window.emergencyLight.visible ? "enabled" : "disabled"
          }`
        );
      }
    },
    fixAllMaterials: () => {
      // Fix all materials in the scene to properly respond to lighting
      fixAllSceneMaterials(scene, {
        debug: true,
        metalness: 0.5,
        roughness: 0.5,
      });
    },
    resetAllLighting: () => {
      // Reset all lighting in the scene
      resetLighting(scene);
      console.log("All lighting has been reset");
      debugLights(lightRefs);
    },
  };

  debugFolder
    .add(debugState, "showHelpers")
    .name("Show Light Helpers")
    .onChange((value) => {
      if (value && !window.lightHelpers) {
        window.lightHelpers = createLightHelpers(scene, lightRefs);
      } else if (!value && window.lightHelpers) {
        // Remove helpers from scene
        if (window.lightHelpers.directional) {
          scene.remove(window.lightHelpers.directional);
        }
        if (window.lightHelpers.directionalShadow) {
          scene.remove(window.lightHelpers.directionalShadow);
        }
        window.lightHelpers.spotlights.forEach((helper) => {
          if (helper) scene.remove(helper);
        });
        window.lightHelpers = null;
      }
    });

  debugFolder.add(debugState, "fixLighting").name("Fix Lighting Issues");
  debugFolder.add(debugState, "resetAllLighting").name("Reset All Lighting");
  debugFolder.add(debugState, "increaseLights").name("Boost Light Intensity");
  debugFolder.add(debugState, "emergencyLight").name("Toggle Emergency Light");
  debugFolder.add(debugState, "fixAllMaterials").name("Fix Model Materials");
  debugFolder.add(debugState, "printDebug").name("Print Debug Info");

  // Advanced debugging tools
  const advancedDebugFolder = debugFolder.addFolder("Advanced Debug Tools");
  const advancedDebugState = {
    toggleOverlay: () => window.debugController.toggleOverlay(),
    toggleGrid: () => window.debugController.toggleGrid(),
    toggleAxes: () => window.debugController.toggleAxes(),
    togglePerformance: () => window.debugController.togglePerformance(),
    inspectMaterials: () =>
      window.inspectMaterials && window.inspectMaterials(),
  };

  advancedDebugFolder
    .add(advancedDebugState, "toggleOverlay")
    .name("Toggle Debug Overlay (Ctrl+D)");
  advancedDebugFolder.add(advancedDebugState, "toggleGrid").name("Toggle Grid");
  advancedDebugFolder.add(advancedDebugState, "toggleAxes").name("Toggle Axes");
  advancedDebugFolder
    .add(advancedDebugState, "togglePerformance")
    .name("Toggle FPS Monitor");
  advancedDebugFolder
    .add(advancedDebugState, "inspectMaterials")
    .name("Inspect All Materials");

  // Shadows global toggle
  lightingFolder
    .add(lightRefs.config, "shadowsEnabled")
    .name("Enable Shadows")
    .onChange((value) => {
      updateLighting({ shadowsEnabled: value });
    });

  // Ambient Light
  const ambientFolder = lightingFolder.addFolder("Ambient Light");
  ambientFolder
    .add(lightRefs.config.ambient, "enabled")
    .name("Enabled")
    .onChange((value) => {
      updateLighting({ ambient: { enabled: value } });
    });
  ambientFolder
    .add(lightRefs.config.ambient, "intensity", 0, 2, 0.05)
    .name("Intensity")
    .onChange((value) => {
      updateLighting({ ambient: { intensity: value } });
    });
  ambientFolder
    .addColor(lightRefs.config.ambient, "color")
    .name("Color")
    .onChange((value) => {
      updateLighting({ ambient: { color: value } });
    });

  // Hemisphere Light
  const hemiFolder = lightingFolder.addFolder("Hemisphere Light");
  hemiFolder
    .add(lightRefs.config.hemisphereLight, "enabled")
    .name("Enabled")
    .onChange((value) => {
      updateLighting({ hemisphereLight: { enabled: value } });
    });
  hemiFolder
    .add(lightRefs.config.hemisphereLight, "intensity", 0, 2, 0.05)
    .name("Intensity")
    .onChange((value) => {
      updateLighting({ hemisphereLight: { intensity: value } });
    });
  hemiFolder
    .addColor(lightRefs.config.hemisphereLight, "skyColor")
    .name("Sky Color")
    .onChange((value) => {
      updateLighting({ hemisphereLight: { skyColor: value } });
    });
  hemiFolder
    .addColor(lightRefs.config.hemisphereLight, "groundColor")
    .name("Ground Color")
    .onChange((value) => {
      updateLighting({ hemisphereLight: { groundColor: value } });
    });

  // Directional Light (Sun)
  const dirFolder = lightingFolder.addFolder("Directional Light (Sun)");
  dirFolder
    .add(lightRefs.config.directional, "enabled")
    .name("Enabled")
    .onChange((value) => {
      updateLighting({ directional: { enabled: value } });
    });
  dirFolder
    .add(lightRefs.config.directional, "intensity", 0, 2, 0.05)
    .name("Intensity")
    .onChange((value) => {
      updateLighting({ directional: { intensity: value } });
    });
  dirFolder
    .addColor(lightRefs.config.directional, "color")
    .name("Color")
    .onChange((value) => {
      updateLighting({ directional: { color: value } });
    });
  dirFolder
    .add(lightRefs.config.directional, "castShadow")
    .name("Cast Shadows")
    .onChange((value) => {
      updateLighting({ directional: { castShadow: value } });
    });

  // Position controls for directional light
  const dirPosFolder = dirFolder.addFolder("Position");
  dirPosFolder
    .add(lightRefs.config.directional.position, "x", -200, 200, 1)
    .name("X")
    .onChange((value) => {
      updateLighting({
        directional: { position: { x: value } },
      });
    });
  dirPosFolder
    .add(lightRefs.config.directional.position, "y", 0, 200, 1)
    .name("Y")
    .onChange((value) => {
      updateLighting({
        directional: { position: { y: value } },
      });
    });
  dirPosFolder
    .add(lightRefs.config.directional.position, "z", -200, 200, 1)
    .name("Z")
    .onChange((value) => {
      updateLighting({
        directional: { position: { z: value } },
      });
    });

  // Shadow quality
  dirFolder
    .add(lightRefs.config.directional, "shadowMapSize", [512, 1024, 2048, 4096])
    .name("Shadow Quality")
    .onChange((value) => {
      updateLighting({ directional: { shadowMapSize: value } });
    });

  // Shadow bias
  dirFolder
    .add(lightRefs.config.directional, "shadowBias", -0.001, 0.001, 0.0001)
    .name("Shadow Bias")
    .onChange((value) => {
      updateLighting({ directional: { shadowBias: value } });
    });

  // Spotlight controls
  lightRefs.config.spotlights.forEach((spotlight, index) => {
    const spotFolder = lightingFolder.addFolder(`Spotlight ${index + 1}`);

    spotFolder
      .add(spotlight, "enabled")
      .name("Enabled")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { enabled: value };
        updateLighting(update);
      });

    spotFolder
      .add(spotlight, "intensity", 0, 2, 0.05)
      .name("Intensity")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { intensity: value };
        updateLighting(update);
      });

    spotFolder
      .addColor(spotlight, "color")
      .name("Color")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { color: value };
        updateLighting(update);
      });

    spotFolder
      .add(spotlight, "castShadow")
      .name("Cast Shadows")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { castShadow: value };
        updateLighting(update);
      });

    spotFolder
      .add(spotlight, "angle", 0, Math.PI / 2, 0.01)
      .name("Angle")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { angle: value };
        updateLighting(update);
      });

    spotFolder
      .add(spotlight, "penumbra", 0, 1, 0.01)
      .name("Penumbra")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { penumbra: value };
        updateLighting(update);
      });

    spotFolder
      .add(spotlight, "distance", 10, 1000, 10)
      .name("Distance")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { distance: value };
        updateLighting(update);
      });

    const spotPosFolder = spotFolder.addFolder("Position");
    spotPosFolder
      .add(spotlight.position, "x", -200, 200, 1)
      .name("X")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { position: { x: value } };
        updateLighting(update);
      });
    spotPosFolder
      .add(spotlight.position, "y", 0, 200, 1)
      .name("Y")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { position: { y: value } };
        updateLighting(update);
      });
    spotPosFolder
      .add(spotlight.position, "z", -200, 200, 1)
      .name("Z")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { position: { z: value } };
        updateLighting(update);
      });

    const spotTargetFolder = spotFolder.addFolder("Target");
    spotTargetFolder
      .add(spotlight.target, "x", -200, 200, 1)
      .name("X")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { target: { x: value } };
        updateLighting(update);
      });
    spotTargetFolder
      .add(spotlight.target, "y", 0, 200, 1)
      .name("Y")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { target: { y: value } };
        updateLighting(update);
      });
    spotTargetFolder
      .add(spotlight.target, "z", -200, 200, 1)
      .name("Z")
      .onChange((value) => {
        const update = { spotlights: [] };
        update.spotlights[index] = { target: { z: value } };
        updateLighting(update);
      });
  });

  // Copy light settings to clipboard
  lightingFolder
    .add(
      {
        copySettings: () => {
          const settings = JSON.stringify(lightRefs.config, null, 2);
          if (navigator.clipboard) {
            navigator.clipboard
              .writeText(settings)
              .then(() => console.log("Lighting settings copied to clipboard"))
              .catch((err) => console.error("Failed to copy settings:", err));
          }
          console.log("Lighting settings:", settings);
        },
      },
      "copySettings"
    )
    .name("Copy Settings to Clipboard");

  // Console helpers for saved paths
  window.savedPaths = {
    list: () => getSavedPathNames(),
    get: (name) => getSavedPath(name),
    delete: (name) => deleteSavedPath(name),
  };

  // Path recorder helpers in console
  window.exportRecordedPathJSON = () => {
    const arr = pathRecorder.points.map((p) => [p.x, p.y, p.z]);
    const json = JSON.stringify({ racePathPoints: arr }, null, 2);
    console.log(json);

    // Also save to localStorage
    try {
      const name = `recorded_path_${Date.now()}`;
      const savedPaths = readAllSaved();

      // Create path data
      const pathData = {
        name,
        createdAt: Date.now(),
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        params: {
          speed: 0.01,
        },
        racePathPoints: arr,
      };

      // Save to localStorage
      savedPaths[name] = pathData;
      writeAllSaved(savedPaths);
      console.log(`Path saved to localStorage as "${name}"`);

      // Refresh the saved paths list in the UI
      refreshSavedList();
    } catch (e) {
      console.error("Failed to save path to localStorage:", e);
    }

    return json;
  };
  window.clearRecordedPath = () => {
    pathRecorder.points.length = 0;
    console.log("Recorder cleared");
  };
  window.buildClosedPathFromRecording = (sampleCount = 800) => {
    if (pathRecorder.points.length < 4) {
      console.warn("Not enough points recorded.");
      return null;
    }
    // Close the loop by connecting end to start
    const pts = pathRecorder.points.slice();
    pts.push(pts[0].clone());
    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom");
    const spaced = curve.getSpacedPoints(sampleCount - 1);
    const spacedPoints = spaced.map((p) => [p.x, p.y, p.z]);
    const json = JSON.stringify({ racePathPoints: spacedPoints }, null, 2);
    console.log(json);

    // Also save to localStorage
    try {
      const name = `closed_path_${Date.now()}`;
      const savedPaths = readAllSaved();

      // Create path data
      const pathData = {
        name,
        createdAt: Date.now(),
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        params: {
          speed: 0.01,
        },
        racePathPoints: spacedPoints,
      };

      // Save to localStorage
      savedPaths[name] = pathData;
      writeAllSaved(savedPaths);
      console.log(`Closed path saved to localStorage as "${name}"`);

      // Refresh the saved paths list in the UI
      refreshSavedList();
    } catch (e) {
      console.error("Failed to save closed path to localStorage:", e);
    }

    return json;
  };

  initializePathEditor(scene, helperCamera, renderer.domElement, trackObject);
  initializeCreatePath(() => carObjects[0]?.position?.clone());
  setOverlayLineForRecording(racePathLine);

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
    try {
      updateCarAI(
        carObjects,
        carBodies,
        controlState.cars,
        racePath,
        racePathLine,
        delta,
        perCarPaths
      );
      // Snap cars to the track surface after AI update
      for (const car of carObjects) {
        if (car) snapCarToTrack(car);
      }
    } catch (error) {
      console.error("An error occurred during car AI update:", error);
      controlState.raceMode = false;
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
          snapCarToTrack(car);

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
          snapCarToTrack(car);
        }
      }
    }
  }

  // Update path recording each frame (world mode)
  updateCreatePath(delta);

  // Update active camera (follow/helper) every frame
  cameraManager.update();

  helperControls.update();

  // Update light helpers if they exist
  if (window.lightHelpers) {
    updateLightHelpers(window.lightHelpers);
  }

  // Update emergency light position to follow camera
  if (window.emergencyLight && window.emergencyLight.visible) {
    const camera = cameraManager.getActiveCamera();
    window.emergencyLight.position.copy(camera.position);
  }

  // Update debug controller with current camera
  if (window.debugController) {
    window.debugController.camera = cameraManager.getActiveCamera();
  }

  // Render main scene with active camera
  renderer.render(scene, cameraManager.getActiveCamera());

  // Render HUD if enabled
  if (showHUD && cameraManager.getActiveCamera() !== helperCamera) {
    // Don't clear the depth buffer so HUD renders on top
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(hudScene, hudCamera);
    renderer.autoClear = true;
  }

  // Record path while driving Car 1 (non-race mode)
  if (!controlState.raceMode && pathRecorder.recording && carObjects[0]) {
    const p = carObjects[0].position;
    const last = pathRecorder.points[pathRecorder.points.length - 1];
    if (
      !last ||
      p.distanceToSquared(last) > pathRecorder.minSampleDistance ** 2
    ) {
      pathRecorder.points.push(p.clone());
    }
  }

  requestAnimationFrame(animate);
}

// Keyboard: path recording toggle with 'r'
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") {
    pathRecorder.recording = !pathRecorder.recording;
    console.log(
      `Recorder: ${pathRecorder.recording ? "started" : "stopped"} | points=${
        pathRecorder.points.length
      }`
    );
  }
});
