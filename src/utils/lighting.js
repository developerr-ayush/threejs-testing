/**
 * Lighting utilities for Three.js
 */
import * as THREE from "three";
import CONFIG from "../config.js";

/**
 * Creates a complete lighting setup based on config
 * @param {Object} options - Override options for the lighting setup
 * @returns {Object} Object containing all created lights and references
 */
export function createLighting(options = {}) {
  const config = {
    ...CONFIG.lighting,
    ...options,
  };

  const lights = {
    ambient: null,
    directional: null,
    spotlights: [],
    hemisphere: null,
    config: { ...config },
  };

  // Create ambient light
  if (config.ambient.enabled) {
    lights.ambient = new THREE.AmbientLight(
      config.ambient.color,
      config.ambient.intensity
    );
  }

  // Create hemisphere light
  if (config.hemisphereLight.enabled) {
    lights.hemisphere = new THREE.HemisphereLight(
      config.hemisphereLight.skyColor,
      config.hemisphereLight.groundColor,
      config.hemisphereLight.intensity
    );
  }

  // Create directional light
  if (config.directional.enabled) {
    lights.directional = new THREE.DirectionalLight(
      config.directional.color,
      config.directional.intensity
    );

    lights.directional.position.set(
      config.directional.position.x,
      config.directional.position.y,
      config.directional.position.z
    );

    lights.directional.castShadow =
      config.directional.castShadow && config.shadowsEnabled;

    // Configure shadow properties
    if (lights.directional.castShadow) {
      const size = config.directional.shadowCameraSize;
      lights.directional.shadow.mapSize.width =
        config.directional.shadowMapSize;
      lights.directional.shadow.mapSize.height =
        config.directional.shadowMapSize;
      lights.directional.shadow.camera.left = -size;
      lights.directional.shadow.camera.right = size;
      lights.directional.shadow.camera.top = size;
      lights.directional.shadow.camera.bottom = -size;
      lights.directional.shadow.camera.near = 1;
      lights.directional.shadow.camera.far = 500;
      lights.directional.shadow.bias = config.directional.shadowBias;
    }
  }

  // Create spotlights
  config.spotlights.forEach((spotConfig) => {
    if (!spotConfig.enabled) return;

    const spotlight = new THREE.SpotLight(
      spotConfig.color,
      spotConfig.intensity,
      spotConfig.distance,
      spotConfig.angle,
      spotConfig.penumbra,
      spotConfig.decay
    );

    spotlight.position.set(
      spotConfig.position.x,
      spotConfig.position.y,
      spotConfig.position.z
    );

    // Set target position
    if (spotConfig.target) {
      const targetObj = new THREE.Object3D();
      targetObj.position.set(
        spotConfig.target.x,
        spotConfig.target.y,
        spotConfig.target.z
      );
      spotlight.target = targetObj;
    }

    spotlight.castShadow = spotConfig.castShadow && config.shadowsEnabled;

    if (spotlight.castShadow) {
      spotlight.shadow.mapSize.width = spotConfig.shadowMapSize;
      spotlight.shadow.mapSize.height = spotConfig.shadowMapSize;
      spotlight.shadow.camera.near = 1;
      spotlight.shadow.camera.far = spotConfig.distance;
    }

    lights.spotlights.push(spotlight);
  });

  return lights;
}

/**
 * Adds all lights from a lighting setup to a scene
 * @param {THREE.Scene} scene - The scene to add lights to
 * @param {Object} lights - The lighting setup from createLighting()
 */
export function addLightsToScene(scene, lights) {
  if (lights.ambient) scene.add(lights.ambient);
  if (lights.hemisphere) scene.add(lights.hemisphere);
  if (lights.directional) scene.add(lights.directional);

  lights.spotlights.forEach((spotlight) => {
    scene.add(spotlight);
    if (spotlight.target && spotlight.target !== scene) {
      scene.add(spotlight.target);
    }
  });
}

/**
 * Updates lighting settings at runtime
 * @param {Object} lights - The lighting setup from createLighting()
 * @param {Object} newSettings - New settings to apply
 */
export function updateLighting(lights, newSettings = {}) {
  const config = lights.config;

  // Update ambient light
  if (newSettings.ambient && lights.ambient) {
    Object.assign(config.ambient, newSettings.ambient);
    lights.ambient.color.set(config.ambient.color);
    lights.ambient.intensity = config.ambient.intensity;
    lights.ambient.visible = config.ambient.enabled;
  }

  // Update hemisphere light
  if (newSettings.hemisphereLight && lights.hemisphere) {
    Object.assign(config.hemisphereLight, newSettings.hemisphereLight);
    lights.hemisphere.skyColor.set(config.hemisphereLight.skyColor);
    lights.hemisphere.groundColor.set(config.hemisphereLight.groundColor);
    lights.hemisphere.intensity = config.hemisphereLight.intensity;
    lights.hemisphere.visible = config.hemisphereLight.enabled;
  }

  // Update directional light
  if (newSettings.directional && lights.directional) {
    Object.assign(config.directional, newSettings.directional);
    const dirLight = lights.directional;

    dirLight.color.set(config.directional.color);
    dirLight.intensity = config.directional.intensity;
    dirLight.visible = config.directional.enabled;

    if (newSettings.directional.position) {
      dirLight.position.set(
        config.directional.position.x,
        config.directional.position.y,
        config.directional.position.z
      );
    }

    dirLight.castShadow =
      config.directional.castShadow && config.shadowsEnabled;

    if (dirLight.castShadow && newSettings.directional.shadowMapSize) {
      dirLight.shadow.mapSize.width = config.directional.shadowMapSize;
      dirLight.shadow.mapSize.height = config.directional.shadowMapSize;
    }

    if (dirLight.castShadow && newSettings.directional.shadowCameraSize) {
      const size = config.directional.shadowCameraSize;
      dirLight.shadow.camera.left = -size;
      dirLight.shadow.camera.right = size;
      dirLight.shadow.camera.top = size;
      dirLight.shadow.camera.bottom = -size;
      dirLight.shadow.camera.updateProjectionMatrix();
    }

    if (
      dirLight.castShadow &&
      newSettings.directional.shadowBias !== undefined
    ) {
      dirLight.shadow.bias = config.directional.shadowBias;
    }
  }

  // Update spotlights
  if (newSettings.spotlights) {
    newSettings.spotlights.forEach((spotUpdate, index) => {
      if (
        index >= config.spotlights.length ||
        index >= lights.spotlights.length
      )
        return;

      Object.assign(config.spotlights[index], spotUpdate);
      const spotlight = lights.spotlights[index];
      const spotConfig = config.spotlights[index];

      if (!spotlight) return;

      spotlight.color.set(spotConfig.color);
      spotlight.intensity = spotConfig.intensity;
      spotlight.distance = spotConfig.distance;
      spotlight.angle = spotConfig.angle;
      spotlight.penumbra = spotConfig.penumbra;
      spotlight.decay = spotConfig.decay;
      spotlight.visible = spotConfig.enabled;

      if (spotUpdate.position) {
        spotlight.position.set(
          spotConfig.position.x,
          spotConfig.position.y,
          spotConfig.position.z
        );
      }

      if (spotUpdate.target && spotlight.target) {
        spotlight.target.position.set(
          spotConfig.target.x,
          spotConfig.target.y,
          spotConfig.target.z
        );
      }

      spotlight.castShadow = spotConfig.castShadow && config.shadowsEnabled;

      if (spotlight.castShadow && spotUpdate.shadowMapSize) {
        spotlight.shadow.mapSize.width = spotConfig.shadowMapSize;
        spotlight.shadow.mapSize.height = spotConfig.shadowMapSize;
      }
    });
  }

  // Global shadow toggle
  if (newSettings.shadowsEnabled !== undefined) {
    config.shadowsEnabled = newSettings.shadowsEnabled;

    // Update all lights' shadow casting based on global toggle
    if (lights.directional) {
      lights.directional.castShadow =
        config.directional.castShadow && config.shadowsEnabled;
    }

    lights.spotlights.forEach((spotlight, index) => {
      if (spotlight) {
        spotlight.castShadow =
          config.spotlights[index].castShadow && config.shadowsEnabled;
      }
    });
  }
}

/**
 * Creates a helper to visualize a directional light's shadow camera
 * @param {THREE.DirectionalLight} light - The directional light
 * @returns {THREE.CameraHelper} Camera helper for the light
 */
export function createDirectionalLightHelper(light) {
  return new THREE.CameraHelper(light.shadow.camera);
}

/**
 * Creates a helper to visualize a spotlight's cone and shadow camera
 * @param {THREE.SpotLight} light - The spotlight
 * @param {number} color - Optional color for the helper
 * @returns {THREE.SpotLightHelper} Spotlight helper
 */
export function createSpotlightHelper(light, color) {
  return new THREE.SpotLightHelper(light, color);
}
