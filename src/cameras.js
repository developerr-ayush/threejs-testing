import * as THREE from "three";
import { cameraConfig, followCameraConfig } from "./config.js";

// Create the overhead (main) camera
export function createMainCamera(width, height) {
  const aspect = width / height;
  const camera = new THREE.PerspectiveCamera(
    cameraConfig.fov,
    aspect,
    cameraConfig.near,
    cameraConfig.far
  );
  camera.position.set(
    cameraConfig.position.x,
    cameraConfig.position.y,
    cameraConfig.position.z
  );
  camera.lookAt(
    cameraConfig.lookAt.x,
    cameraConfig.lookAt.y,
    cameraConfig.lookAt.z
  );
  return camera;
}

export function setCameraAspect(camera, aspect) {
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
}

// Computes a camera position that follows a physics body with an offset
export function getFollowCameraTransform(
  targetPosition,
  targetQuaternion,
  mode = "top"
) {
  const config =
    mode === "chase" ? followCameraConfig.chase : followCameraConfig.top;
  const offset = new THREE.Vector3(
    config.offset.x,
    config.offset.y,
    config.offset.z
  );

  // Rotate the offset by the target's orientation (so chase sticks behind the car)
  const threeQuat = new THREE.Quaternion(
    targetQuaternion.x,
    targetQuaternion.y,
    targetQuaternion.z,
    targetQuaternion.w
  );
  offset.applyQuaternion(threeQuat);

  const cameraPos = new THREE.Vector3(
    targetPosition.x + offset.x,
    targetPosition.y + offset.y,
    targetPosition.z + offset.z
  );

  const lookOffset = new THREE.Vector3(
    config.lookOffset.x,
    config.lookOffset.y,
    config.lookOffset.z
  ).applyQuaternion(threeQuat);
  const lookAt = new THREE.Vector3(
    targetPosition.x + lookOffset.x,
    targetPosition.y + lookOffset.y,
    targetPosition.z + lookOffset.z
  );

  return { cameraPos, lookAt };
}

// Helper camera with a neutral setup that can roam anywhere
export function createHelperCamera(width, height) {
  const aspect = width / height;
  const camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 10000);
  camera.position.set(0, 60, 120);
  camera.lookAt(0, 0, 0);
  return camera;
}
