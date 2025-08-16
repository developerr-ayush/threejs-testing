import * as THREE from "three";
import CONFIG from "./config.js";

const pathCreatorState = {
  points: [],
  line: null,
  spheres: [], // Visual markers for each point
};

let sceneRef = null;
let cameraRef = null;
let rendererDomElementRef = null;
let trackMeshRef = null;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const fallbackPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function onMouseDown(event) {
  // Only add a point if the Shift key is held down
  if (!event.shiftKey) return;

  // Update mouse coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);

  let intersectPoint = null;

  // First try to intersect with the track mesh
  if (trackMeshRef) {
    const intersects = raycaster.intersectObject(trackMeshRef, true);
    if (intersects.length > 0) {
      intersectPoint = intersects[0].point;
    }
  }

  // If no intersection with track, fall back to the plane
  if (!intersectPoint) {
    intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(fallbackPlane, intersectPoint);
  }

  if (intersectPoint) {
    addPoint(intersectPoint);
  }
}

function addPoint(position) {
  pathCreatorState.points.push(position);
  updatePathVisuals();
}

function updatePathVisuals() {
  if (!sceneRef) return;

  // Remove old visuals
  if (pathCreatorState.line) sceneRef.remove(pathCreatorState.line);
  pathCreatorState.spheres.forEach((s) => sceneRef.remove(s));
  pathCreatorState.spheres = [];

  // Create spheres for each point
  const sphereGeom = new THREE.SphereGeometry(
    CONFIG.path.editor.sphereSize,
    CONFIG.path.editor.sphereSegments,
    CONFIG.path.editor.sphereSegments
  );
  const sphereMat = new THREE.MeshBasicMaterial({
    color: CONFIG.path.editor.sphereColor,
  });

  pathCreatorState.points.forEach((point) => {
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    sphere.position.copy(point);
    sceneRef.add(sphere);
    pathCreatorState.spheres.push(sphere);
  });

  // Create line connecting the points
  if (pathCreatorState.points.length > 1) {
    const lineGeom = new THREE.BufferGeometry().setFromPoints(
      pathCreatorState.points
    );
    const lineMat = new THREE.LineBasicMaterial({
      color: CONFIG.path.editor.lineColor,
    });
    pathCreatorState.line = new THREE.Line(lineGeom, lineMat);
    sceneRef.add(pathCreatorState.line);
  }
}

export function initializePathEditor(
  scene,
  camera,
  rendererDomElement,
  trackMesh
) {
  sceneRef = scene;
  cameraRef = camera;
  rendererDomElementRef = rendererDomElement;
  trackMeshRef = trackMesh;

  rendererDomElement.addEventListener("mousedown", onMouseDown);
}

// Use the same storage key as createPath.js
const PATH_STORAGE_KEY = CONFIG.path.recorder.storageKey;

function savePathToLocalStorage(name, points) {
  try {
    // Read existing paths
    let savedPaths = {};
    const existingData = localStorage.getItem(PATH_STORAGE_KEY);
    if (existingData) {
      savedPaths = JSON.parse(existingData);
    }

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
        speed: CONFIG.path.recorder.defaultSpeed,
      },
      racePathPoints: points,
    };

    // Save to localStorage
    savedPaths[name] = pathData;
    localStorage.setItem(PATH_STORAGE_KEY, JSON.stringify(savedPaths));

    return pathData;
  } catch (e) {
    console.error("Failed to save path to localStorage:", e);
    return null;
  }
}

export function exportPathToJSON() {
  if (pathCreatorState.points.length === 0) {
    console.warn("No points to export.");
    return;
  }

  const pointArray = pathCreatorState.points.map((p) => [p.x, p.y, p.z]);
  const json = JSON.stringify({ racePathPoints: pointArray }, null, 2);
  console.log(json);

  // Save to localStorage with a timestamp-based name
  const name = `path_${Date.now()}`;
  const saved = savePathToLocalStorage(name, pointArray);
  if (saved) {
    console.log(`Path saved to localStorage as "${name}"`);
  }

  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(json)
      .then(() => console.log("Path copied to clipboard!"))
      .catch((err) => console.error("Failed to copy path:", err));
  }
}

export function clearPath() {
  pathCreatorState.points = [];
  updatePathVisuals();
}
