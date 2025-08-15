import * as THREE from 'three';

// Create the overhead (main) camera
export function createMainCamera(width, height) {
  const aspect = width / height;
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 5000);
  camera.position.set(0, 120, 120);
  camera.lookAt(0, 0, 0);
  return camera;
}

// Create a chase camera that will follow a target Object3D
export function createChaseCamera(width, height) {
  const aspect = width / height;
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
  return camera;
}

export function updateChaseCamera(camera, target, offset, lerpAmount = 0.08) {
  if (!target) return;

  // Desired camera position is target position + offset in target's local space
  const desiredPosition = target.localToWorld(new THREE.Vector3(offset.x, offset.y, offset.z));
  camera.position.lerp(desiredPosition, lerpAmount);

  // Look slightly ahead of the car in its forward direction
  const lookAtPointLocal = new THREE.Vector3(0, 1.0, 5);
  const lookAtPointWorld = target.localToWorld(lookAtPointLocal);
  camera.lookAt(lookAtPointWorld);
}

export function setCameraAspect(camera, aspect) {
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
}
