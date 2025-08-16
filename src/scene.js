import * as THREE from "three";

// Default lighting configuration
const defaultLightingConfig = {
  ambient: {
    color: 0xffffff,
    intensity: 0.5,
    enabled: true,
  },
  directional: {
    color: 0xffffff,
    intensity: 1.0,
    position: { x: 50, y: 100, z: 50 },
    castShadow: true,
    shadowMapSize: 2048,
    shadowBias: -0.0001,
    shadowCameraSize: 100,
    enabled: true,
  },
  spotlights: [
    {
      color: 0xffffff,
      intensity: 0.8,
      position: { x: -50, y: 50, z: -50 },
      target: { x: 0, y: 0, z: 0 },
      angle: Math.PI / 6,
      penumbra: 0.2,
      decay: 1.5,
      distance: 500,
      castShadow: true,
      shadowMapSize: 1024,
      enabled: false,
    },
    {
      color: 0xffffff,
      intensity: 0.6,
      position: { x: 50, y: 50, z: -50 },
      target: { x: 0, y: 0, z: 0 },
      angle: Math.PI / 6,
      penumbra: 0.2,
      decay: 1.5,
      distance: 500,
      castShadow: true,
      shadowMapSize: 1024,
      enabled: false,
    },
  ],
  hemisphereLight: {
    skyColor: 0x87ceeb,
    groundColor: 0x404040,
    intensity: 0.6,
    enabled: true,
  },
  shadowsEnabled: true,
};

// Store light references for later control
export const lightRefs = {
  ambient: null,
  directional: null,
  spotlights: [],
  hemisphere: null,
  config: { ...defaultLightingConfig },
};

// Create scene, lights, and environment
export function createScene(lightingConfig = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  // Merge provided config with defaults
  const config = {
    ...defaultLightingConfig,
    ...lightingConfig,
    directional: {
      ...defaultLightingConfig.directional,
      ...(lightingConfig.directional || {}),
    },
    ambient: {
      ...defaultLightingConfig.ambient,
      ...(lightingConfig.ambient || {}),
    },
    hemisphereLight: {
      ...defaultLightingConfig.hemisphereLight,
      ...(lightingConfig.hemisphereLight || {}),
    },
    spotlights: lightingConfig.spotlights || defaultLightingConfig.spotlights,
  };

  // Store the config for later reference
  Object.assign(lightRefs.config, config);

  // Ambient light to softly illuminate all objects
  // Always create ambient light for better visibility, but respect enabled state
  const ambient = new THREE.AmbientLight(
    config.ambient.color,
    config.ambient.enabled ? config.ambient.intensity : 0
  );
  ambient.visible = config.ambient.enabled;
  scene.add(ambient);
  lightRefs.ambient = ambient;

  // Hemisphere light for sky/ground gradient lighting
  // Always create hemisphere light for better visibility, but respect enabled state
  const hemiLight = new THREE.HemisphereLight(
    config.hemisphereLight.skyColor,
    config.hemisphereLight.groundColor,
    config.hemisphereLight.enabled ? config.hemisphereLight.intensity : 0
  );
  hemiLight.visible = config.hemisphereLight.enabled;
  scene.add(hemiLight);
  lightRefs.hemisphere = hemiLight;

  // Directional light to simulate sun
  // Always create directional light for better visibility, but respect enabled state
  const dirLight = new THREE.DirectionalLight(
    config.directional.color,
    config.directional.enabled ? config.directional.intensity : 0
  );
  dirLight.position.set(
    config.directional.position.x,
    config.directional.position.y,
    config.directional.position.z
  );
  dirLight.castShadow = config.directional.castShadow && config.shadowsEnabled;
  dirLight.visible = config.directional.enabled;

  // Configure shadow properties
  if (dirLight.castShadow) {
    const size = config.directional.shadowCameraSize;
    dirLight.shadow.mapSize.width = config.directional.shadowMapSize;
    dirLight.shadow.mapSize.height = config.directional.shadowMapSize;
    dirLight.shadow.camera.left = -size;
    dirLight.shadow.camera.right = size;
    dirLight.shadow.camera.top = size;
    dirLight.shadow.camera.bottom = -size;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.bias = config.directional.shadowBias;
  }

  scene.add(dirLight);
  lightRefs.directional = dirLight;

  // Add spotlights
  lightRefs.spotlights = [];
  config.spotlights.forEach((spotConfig, index) => {
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
      scene.add(targetObj);
      spotlight.target = targetObj;
    }

    spotlight.castShadow = spotConfig.castShadow && config.shadowsEnabled;

    if (spotlight.castShadow) {
      spotlight.shadow.mapSize.width = spotConfig.shadowMapSize;
      spotlight.shadow.mapSize.height = spotConfig.shadowMapSize;
      spotlight.shadow.camera.near = 1;
      spotlight.shadow.camera.far = spotConfig.distance;
    }

    scene.add(spotlight);
    lightRefs.spotlights.push(spotlight);
  });

  return scene;
}

// Helper function to update lighting settings at runtime
export function updateLighting(newSettings = {}) {
  const config = lightRefs.config;

  // Update ambient light
  if (newSettings.ambient && lightRefs.ambient) {
    Object.assign(config.ambient, newSettings.ambient);
    lightRefs.ambient.color.set(config.ambient.color);
    lightRefs.ambient.intensity = config.ambient.intensity;
    lightRefs.ambient.visible = config.ambient.enabled;
  }

  // Update hemisphere light
  if (newSettings.hemisphereLight && lightRefs.hemisphere) {
    Object.assign(config.hemisphereLight, newSettings.hemisphereLight);
    lightRefs.hemisphere.skyColor.set(config.hemisphereLight.skyColor);
    lightRefs.hemisphere.groundColor.set(config.hemisphereLight.groundColor);
    lightRefs.hemisphere.intensity = config.hemisphereLight.intensity;
    lightRefs.hemisphere.visible = config.hemisphereLight.enabled;
  }

  // Update directional light
  if (newSettings.directional && lightRefs.directional) {
    Object.assign(config.directional, newSettings.directional);
    const dirLight = lightRefs.directional;

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
        index >= lightRefs.spotlights.length
      )
        return;

      Object.assign(config.spotlights[index], spotUpdate);
      const spotlight = lightRefs.spotlights[index];
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
    if (lightRefs.directional) {
      lightRefs.directional.castShadow =
        config.directional.castShadow && config.shadowsEnabled;
    }

    lightRefs.spotlights.forEach((spotlight, index) => {
      if (spotlight) {
        spotlight.castShadow =
          config.spotlights[index].castShadow && config.shadowsEnabled;
      }
    });
  }
}
