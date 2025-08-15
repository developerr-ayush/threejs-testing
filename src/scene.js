import * as THREE from "three";

// Create scene, lights, and environment
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  // Ambient light to softly illuminate all objects
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  // Directional light to simulate sun
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(50, 100, 50);
  dirLight.castShadow = true;
  scene.add(dirLight);

  return scene;
}
