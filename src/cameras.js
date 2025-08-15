import * as THREE from "three";
import { cameraConfig } from "./config.js";

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
