import * as THREE from "three";
import CONFIG from "./config.js";

const STORAGE_KEY = CONFIG.path.recorder.storageKey;

const recorderState = {
  isRecording: false,
  name: "",
  pointsWorld: [],
  minSampleDistance: 0.75,
  overlayLineRef: null,
  overlayInverseMatrix: new THREE.Matrix4(),
  lastSampled: null,
  params: {
    speed: 0.01, // default AI speed along curve (0..?)
    kinematic: null, // optional snapshot of kinematic config
  },
  getCarPositionFn: null,
};

function readAllSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch (e) {
    console.error("Failed to read saved paths:", e);
    return {};
  }
}

function writeAllSaved(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save paths:", e);
  }
}

export function getSavedPathNames() {
  return Object.keys(readAllSaved());
}

export function getSavedPath(name) {
  const all = readAllSaved();
  return all[name] || null;
}

export function deleteSavedPath(name) {
  const all = readAllSaved();
  if (all[name]) {
    delete all[name];
    writeAllSaved(all);
  }
}

export function initializeCreatePath(getCarPositionFn) {
  recorderState.getCarPositionFn = getCarPositionFn;
}

export function setOverlayLineForRecording(overlayLine) {
  recorderState.overlayLineRef = overlayLine;
}

export function startCreatePathRecording({
  name,
  minSampleDistance = 0.75,
  speed = 0.01,
  kinematicSnapshot = null,
} = {}) {
  if (!recorderState.getCarPositionFn) {
    console.error(
      "initializeCreatePath was not called with a car position provider"
    );
    return false;
  }
  if (!name || typeof name !== "string") {
    console.error("startCreatePathRecording: name is required (string)");
    return false;
  }

  recorderState.isRecording = true;
  recorderState.name = name;
  recorderState.pointsWorld = [];
  recorderState.minSampleDistance = Math.max(0.01, minSampleDistance);
  recorderState.params.speed = speed;
  recorderState.params.kinematic = kinematicSnapshot || null;
  recorderState.lastSampled = null;

  // Cache inverse transform from overlay to convert to overlay-local when saving
  if (recorderState.overlayLineRef) {
    recorderState.overlayLineRef.updateMatrixWorld();
    recorderState.overlayInverseMatrix
      .copy(recorderState.overlayLineRef.matrixWorld)
      .invert();
  } else {
    recorderState.overlayInverseMatrix.identity();
  }
  return true;
}

export function stopCreatePathRecording({
  closeLoop = true,
  resampleCount = 800,
} = {}) {
  if (!recorderState.isRecording) return null;
  recorderState.isRecording = false;

  try {
    // Convert world points to overlay-local space
    const localPoints = recorderState.pointsWorld.map((p) =>
      p.clone().applyMatrix4(recorderState.overlayInverseMatrix)
    );

    // Optionally close the loop
    const pts = localPoints.slice();
    if (closeLoop && pts.length > 1) pts.push(pts[0].clone());

    // Resample to evenly spaced points along a CatmullRom curve
    let sampled = pts;
    if (resampleCount && pts.length >= 4) {
      const curve = new THREE.CatmullRomCurve3(pts, closeLoop, "catmullrom");
      sampled = curve.getSpacedPoints(Math.max(2, resampleCount) - 1);
    }

    // Build payload
    const overlay = recorderState.overlayLineRef;
    const transform = overlay
      ? {
          position: overlay.position.clone(),
          rotation: {
            x: overlay.rotation.x,
            y: overlay.rotation.y,
            z: overlay.rotation.z,
          },
          scale: overlay.scale.clone(),
        }
      : {
          position: new THREE.Vector3(),
          rotation: { x: 0, y: 0, z: 0 },
          scale: new THREE.Vector3(1, 1, 1),
        };

    const data = {
      name: recorderState.name,
      createdAt: Date.now(),
      transform,
      params: { ...recorderState.params },
      racePathPoints: sampled.map((p) => [p.x, p.y, p.z]),
    };

    // Save to localStorage
    const all = readAllSaved();
    all[data.name] = data;
    writeAllSaved(all);

    return data;
  } catch (e) {
    console.error("Failed to finalize and save recorded path:", e);
    return null;
  } finally {
    recorderState.pointsWorld = [];
    recorderState.lastSampled = null;
  }
}

export function updateCreatePath(delta) {
  if (!recorderState.isRecording || !recorderState.getCarPositionFn) return;
  try {
    const p = recorderState.getCarPositionFn();
    if (!p) return;
    if (
      !recorderState.lastSampled ||
      p.distanceToSquared(recorderState.lastSampled) >
        recorderState.minSampleDistance ** 2
    ) {
      recorderState.pointsWorld.push(p.clone());
      recorderState.lastSampled = p.clone();
    }
  } catch (e) {
    console.error("updateCreatePath failed:", e);
  }
}

export function buildCurveFromSavedPath(saved) {
  if (!saved || !Array.isArray(saved.racePathPoints)) return null;
  const pts = saved.racePathPoints.map(
    ([x, y, z]) => new THREE.Vector3(x, y, z)
  );
  const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom");
  return curve;
}

export function createLineFromSavedPath(saved) {
  if (!saved) return null;
  const curve = buildCurveFromSavedPath(saved);
  if (!curve) return null;
  const points = curve.getSpacedPoints(500);
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const line = new THREE.Line(geom, mat);
  // Apply saved transform so the path aligns in world
  if (saved.transform) {
    line.position.copy(saved.transform.position || new THREE.Vector3());
    if (saved.transform.rotation) {
      line.rotation.set(
        saved.transform.rotation.x || 0,
        saved.transform.rotation.y || 0,
        saved.transform.rotation.z || 0
      );
    }
    if (saved.transform.scale) {
      if (typeof saved.transform.scale.x === "number") {
        line.scale.copy(saved.transform.scale);
      } else if (typeof saved.transform.scale === "number") {
        line.scale.setScalar(saved.transform.scale);
      }
    }
  }
  return { line, curve };
}
