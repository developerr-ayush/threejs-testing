/**
 * Reset lighting utility - creates a completely new lighting setup
 */
import * as THREE from "three";
import { lightRefs } from "./scene.js";

/**
 * Creates a completely new lighting setup, removing all existing lights
 * @param {THREE.Scene} scene - The scene to reset lighting for
 */
export function resetLighting(scene) {
  console.log("Resetting all lighting...");
  
  // Remove all existing lights from the scene
  if (lightRefs.ambient) {
    scene.remove(lightRefs.ambient);
  }
  
  if (lightRefs.hemisphere) {
    scene.remove(lightRefs.hemisphere);
  }
  
  if (lightRefs.directional) {
    scene.remove(lightRefs.directional);
  }
  
  lightRefs.spotlights.forEach(spotlight => {
    if (spotlight) {
      scene.remove(spotlight);
      if (spotlight.target && spotlight.target.parent) {
        scene.remove(spotlight.target);
      }
    }
  });
  
  // Clear spotlight references
  lightRefs.spotlights = [];
  
  // Create a new basic lighting setup
  
  // 1. Ambient light - provides overall illumination
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  lightRefs.ambient = ambient;
  
  // 2. Directional light - simulates sun
  const directional = new THREE.DirectionalLight(0xffffff, 1.0);
  directional.position.set(10, 100, 10);
  directional.castShadow = true;
  
  // Configure shadow properties
  directional.shadow.mapSize.width = 2048;
  directional.shadow.mapSize.height = 2048;
  directional.shadow.camera.near = 0.5;
  directional.shadow.camera.far = 500;
  directional.shadow.camera.left = -100;
  directional.shadow.camera.right = 100;
  directional.shadow.camera.top = 100;
  directional.shadow.camera.bottom = -100;
  directional.shadow.bias = -0.0003;
  
  scene.add(directional);
  lightRefs.directional = directional;
  
  // 3. Hemisphere light - for sky/ground gradient lighting
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x404040, 0.6);
  scene.add(hemiLight);
  lightRefs.hemisphere = hemiLight;
  
  // 4. Add a spotlight for additional illumination
  const spotlight = new THREE.SpotLight(0xffffff, 0.8, 200, Math.PI/4, 0.5);
  spotlight.position.set(0, 50, 0);
  
  // Create and position the spotlight target
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, 0, 0);
  scene.add(spotTarget);
  spotlight.target = spotTarget;
  
  spotlight.castShadow = true;
  spotlight.shadow.mapSize.width = 1024;
  spotlight.shadow.mapSize.height = 1024;
  
  scene.add(spotlight);
  lightRefs.spotlights.push(spotlight);
  
  // Update config to match new lights
  if (lightRefs.config) {
    // Ambient light config
    lightRefs.config.ambient.enabled = true;
    lightRefs.config.ambient.intensity = 0.7;
    lightRefs.config.ambient.color = 0xffffff;
    
    // Directional light config
    lightRefs.config.directional.enabled = true;
    lightRefs.config.directional.intensity = 1.0;
    lightRefs.config.directional.color = 0xffffff;
    lightRefs.config.directional.position = { x: 10, y: 100, z: 10 };
    lightRefs.config.directional.castShadow = true;
    lightRefs.config.directional.shadowMapSize = 2048;
    lightRefs.config.directional.shadowBias = -0.0003;
    lightRefs.config.directional.shadowCameraSize = 100;
    
    // Hemisphere light config
    lightRefs.config.hemisphereLight.enabled = true;
    lightRefs.config.hemisphereLight.intensity = 0.6;
    lightRefs.config.hemisphereLight.skyColor = 0x87ceeb;
    lightRefs.config.hemisphereLight.groundColor = 0x404040;
    
    // Global shadow toggle
    lightRefs.config.shadowsEnabled = true;
    
    // Spotlight config
    if (lightRefs.config.spotlights && lightRefs.config.spotlights.length > 0) {
      lightRefs.config.spotlights[0].enabled = true;
      lightRefs.config.spotlights[0].intensity = 0.8;
      lightRefs.config.spotlights[0].color = 0xffffff;
      lightRefs.config.spotlights[0].position = { x: 0, y: 50, z: 0 };
      lightRefs.config.spotlights[0].target = { x: 0, y: 0, z: 0 };
      lightRefs.config.spotlights[0].angle = Math.PI/4;
      lightRefs.config.spotlights[0].penumbra = 0.5;
      lightRefs.config.spotlights[0].distance = 200;
      lightRefs.config.spotlights[0].castShadow = true;
      lightRefs.config.spotlights[0].shadowMapSize = 1024;
    }
  }
  
  console.log("New lighting setup created");
  return true;
}

// Export a global reset function that can be called from the console
window.resetAllLighting = function() {
  if (window.scene) {
    resetLighting(window.scene);
    return "Lighting has been completely reset";
  } else {
    return "Scene not available globally";
  }
};
