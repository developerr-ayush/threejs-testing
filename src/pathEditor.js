import * as THREE from "three";

const pathCreatorState = {
  points: [],
  line: null,
  spheres: [], // Visual markers for each point
};

let sceneRef = null;
let cameraRef = null;
let rendererDomElementRef = null;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function onMouseDown(event) {
  // Only add a point if the Shift key is held down
  if (!event.shiftKey) return;

  // Update mouse coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);

  const intersectPoint = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersectPoint);

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
  const sphereGeom = new THREE.SphereGeometry(0.5, 16, 16);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

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
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    pathCreatorState.line = new THREE.Line(lineGeom, lineMat);
    sceneRef.add(pathCreatorState.line);
  }
}

export function initializePathEditor(scene, camera, rendererDomElement) {
  sceneRef = scene;
  cameraRef = camera;
  rendererDomElementRef = rendererDomElement;

  rendererDomElement.addEventListener("mousedown", onMouseDown);
}

export function exportPathToJSON() {
  if (pathCreatorState.points.length === 0) {
    console.warn("No points to export.");
    return;
  }
  const pointArray = pathCreatorState.points.map((p) => [p.x, p.y, p.z]);
  const json = JSON.stringify({ racePathPoints: pointArray }, null, 2);
  console.log(json);
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
