/**
 * Debug utilities for lighting
 */
import * as THREE from "three";

/**
 * Creates visual helpers for all lights in the scene
 * @param {THREE.Scene} scene - The scene to add helpers to
 * @param {Object} lightRefs - References to lights from scene.js
 * @returns {Object} Object containing all created helpers
 */
export function createLightHelpers(scene, lightRefs) {
  const helpers = {
    directional: null,
    spotlights: [],
  };

  // Create helper for directional light
  if (lightRefs.directional) {
    // Create directional light helper
    const dirHelper = new THREE.DirectionalLightHelper(
      lightRefs.directional,
      10
    );
    scene.add(dirHelper);
    helpers.directional = dirHelper;

    // Create shadow camera helper if shadow is enabled
    if (lightRefs.directional.castShadow) {
      const shadowHelper = new THREE.CameraHelper(
        lightRefs.directional.shadow.camera
      );
      scene.add(shadowHelper);
      helpers.directionalShadow = shadowHelper;
    }
  }

  // Create helpers for spotlights
  lightRefs.spotlights.forEach((spotlight, index) => {
    if (spotlight) {
      // Create spotlight helper
      const spotHelper = new THREE.SpotLightHelper(spotlight);
      scene.add(spotHelper);
      helpers.spotlights.push(spotHelper);
    }
  });

  return helpers;
}

/**
 * Updates all light helpers
 * @param {Object} helpers - The helpers created by createLightHelpers
 */
export function updateLightHelpers(helpers) {
  // Update directional light helper
  if (helpers.directional) {
    helpers.directional.update();
  }

  // Update directional shadow camera helper
  if (helpers.directionalShadow) {
    helpers.directionalShadow.update();
  }

  // Update spotlight helpers
  helpers.spotlights.forEach((helper) => {
    if (helper) {
      helper.update();
    }
  });
}

/**
 * Prints debug info about all lights in the scene
 * @param {Object} lightRefs - References to lights from scene.js
 */
export function debugLights(lightRefs) {
  console.log("=== LIGHT DEBUG INFO ===");

  // Debug ambient light
  if (lightRefs.ambient) {
    console.log("Ambient Light:", {
      enabled: lightRefs.ambient.visible,
      intensity: lightRefs.ambient.intensity,
      color: lightRefs.ambient.color.getHexString(),
    });
  } else {
    console.log("Ambient Light: Not created");
  }

  // Debug hemisphere light
  if (lightRefs.hemisphere) {
    // In Three.js, HemisphereLight uses .color for skyColor and .groundColor for groundColor
    console.log("Hemisphere Light:", {
      enabled: lightRefs.hemisphere.visible,
      intensity: lightRefs.hemisphere.intensity,
      skyColor: lightRefs.hemisphere.color
        ? lightRefs.hemisphere.color.getHexString()
        : "(unavailable)",
      groundColor: lightRefs.hemisphere.groundColor
        ? lightRefs.hemisphere.groundColor.getHexString()
        : "(unavailable)",
    });
  } else {
    console.log("Hemisphere Light: Not created");
  }

  // Debug directional light
  if (lightRefs.directional) {
    console.log("Directional Light:", {
      enabled: lightRefs.directional.visible,
      intensity: lightRefs.directional.intensity,
      color: lightRefs.directional.color.getHexString(),
      position: {
        x: lightRefs.directional.position.x,
        y: lightRefs.directional.position.y,
        z: lightRefs.directional.position.z,
      },
      castShadow: lightRefs.directional.castShadow,
    });

    if (lightRefs.directional.castShadow) {
      console.log("Directional Shadow:", {
        mapSize: {
          width: lightRefs.directional.shadow.mapSize.width,
          height: lightRefs.directional.shadow.mapSize.height,
        },
        camera: {
          left: lightRefs.directional.shadow.camera.left,
          right: lightRefs.directional.shadow.camera.right,
          top: lightRefs.directional.shadow.camera.top,
          bottom: lightRefs.directional.shadow.camera.bottom,
          near: lightRefs.directional.shadow.camera.near,
          far: lightRefs.directional.shadow.camera.far,
        },
        bias: lightRefs.directional.shadow.bias,
      });
    }
  } else {
    console.log("Directional Light: Not created");
  }

  // Debug spotlights
  console.log(`Spotlights (${lightRefs.spotlights.length}):`);
  lightRefs.spotlights.forEach((spotlight, index) => {
    if (spotlight) {
      console.log(`Spotlight ${index + 1}:`, {
        enabled: spotlight.visible,
        intensity: spotlight.intensity,
        color: spotlight.color.getHexString(),
        position: {
          x: spotlight.position.x,
          y: spotlight.position.y,
          z: spotlight.position.z,
        },
        target: spotlight.target
          ? {
              x: spotlight.target.position.x,
              y: spotlight.target.position.y,
              z: spotlight.target.position.z,
            }
          : "default",
        angle: spotlight.angle,
        penumbra: spotlight.penumbra,
        distance: spotlight.distance,
        castShadow: spotlight.castShadow,
      });
    } else {
      console.log(`Spotlight ${index + 1}: Not created`);
    }
  });

  console.log("=== END LIGHT DEBUG INFO ===");
}

/**
 * Fixes common lighting issues
 * @param {THREE.Scene} scene - The scene to fix lights in
 * @param {Object} lightRefs - References to lights from scene.js
 */
export function fixLightingIssues(scene, lightRefs) {
  // Fix 1: Make sure directional light is properly positioned and visible
  if (lightRefs.directional) {
    // Make sure light is visible
    lightRefs.directional.visible = true;

    // Increase intensity if it's too low
    if (lightRefs.directional.intensity < 0.5) {
      lightRefs.directional.intensity = 1.0;
    }

    // Make sure position is reasonable
    if (lightRefs.directional.position.y < 10) {
      lightRefs.directional.position.set(50, 100, 50);
    }

    // Fix shadow camera if needed
    if (lightRefs.directional.castShadow) {
      const camera = lightRefs.directional.shadow.camera;
      if (
        camera.left === 0 ||
        camera.right === 0 ||
        camera.top === 0 ||
        camera.bottom === 0
      ) {
        const size = 100;
        camera.left = -size;
        camera.right = size;
        camera.top = size;
        camera.bottom = -size;
        camera.updateProjectionMatrix();
      }
    }
  }

  // Fix 2: Make sure spotlights have their targets added to the scene
  lightRefs.spotlights.forEach((spotlight) => {
    if (spotlight && spotlight.target && spotlight.target !== scene) {
      if (!scene.children.includes(spotlight.target)) {
        scene.add(spotlight.target);
      }
    }
  });

  // Fix 3: Ensure ambient light exists with reasonable intensity
  if (!lightRefs.ambient) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    lightRefs.ambient = ambient;
  }

  // Fix 4: Add a basic light if no lights exist
  if (
    !lightRefs.ambient &&
    !lightRefs.directional &&
    lightRefs.spotlights.length === 0
  ) {
    console.log("No lights found, adding emergency lighting");

    // Add ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    lightRefs.ambient = ambient;

    // Add directional light
    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(50, 100, 50);
    directional.castShadow = true;

    // Configure shadow properties
    const size = 100;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.left = -size;
    directional.shadow.camera.right = size;
    directional.shadow.camera.top = size;
    directional.shadow.camera.bottom = -size;
    directional.shadow.camera.near = 1;
    directional.shadow.camera.far = 500;
    directional.shadow.bias = -0.0001;

    scene.add(directional);
    lightRefs.directional = directional;
  }
}

// Export a global debug function that can be called from the console
window.debugLighting = function () {
  // This function will be available in the browser console
  if (window.scene && window.lightRefs) {
    debugLights(window.lightRefs);
    return "Lighting debug info printed to console";
  } else {
    return "Scene or lightRefs not available globally";
  }
};

// Export a global fix function that can be called from the console
window.fixLighting = function () {
  // This function will be available in the browser console
  if (window.scene && window.lightRefs) {
    fixLightingIssues(window.scene, window.lightRefs);
    return "Applied lighting fixes";
  } else {
    return "Scene or lightRefs not available globally";
  }
};
