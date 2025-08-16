import racePathData from "./racepath.json";

// Main configuration object
const CONFIG = {
  // Keyboard controls
  keyboard: {
    forward: "w",
    backward: "s",
    left: "a",
    right: "d",
    yawLeft: "a", // A/D turn (steer)
    yawRight: "d",
    modifierStrafe: "shift", // hold to strafe with A/D
    force: 20,
    torque: 10,
    turnSpeed: 2.5, // radians per second
  },

  // Physics settings
  physics: {
    enabled: false, // Whether to use physics or kinematic movement
    gravity: { x: 0, y: -9.82, z: 0 },
    carMass: 1,
    groundFriction: 0.3,
    carDimensions: { x: 2, y: 0.5, z: 4 },
    linearDamping: 0.4,
    angularDamping: 0.6,
    suspensionOffset: 0.6, // visual Y offset to keep car above the track mesh
  },

  // Camera settings
  camera: {
    main: {
      fov: 75,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 5000,
      position: { x: 0, y: 10, z: 20 },
      lookAt: { x: 0, y: 0, z: 0 },
    },

    // Follow camera configurations
    follow: {
      top: {
        offset: { x: 0, y: 12, z: 0 },
        lookOffset: { x: 0, y: 0, z: 0 },
      },
      chase: {
        offset: { x: 0, y: 5, z: -10 },
        lookOffset: { x: 0, y: 2, z: 6 },
      },
      bottom: {
        offset: { x: 0, y: -1, z: 0 },
        lookOffset: { x: 0, y: 0, z: 3 },
      },
      t_cam: {
        offset: { x: 0, y: 0.8, z: -0.2 },
        lookOffset: { x: 0, y: 0.5, z: 2 },
      }, // F1 T-cam (onboard)
      front_wing: {
        offset: { x: 0, y: 0.3, z: 3 },
        lookOffset: { x: 0, y: 0.5, z: 10 },
      }, // Front wing cam
      side_wide: {
        offset: { x: 8, y: 3, z: -3 },
        lookOffset: { x: 0, y: 1, z: 3 },
      }, // Side-wide chase camera
    },

    // Orbit controls settings
    orbit: {
      enableDamping: false,
      enablePan: false,
      minDistance: 50,
      maxDistance: 200,
      target: { x: 0, y: 0, z: 0 },
    },

    // Camera smoothing
    smoothing: 0.2, // Camera follow smoothing factor
  },

  // Lighting settings
  lighting: {
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
  },

  // Renderer settings
  renderer: {
    antialias: true,
    powerPreference: "high-performance",
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    shadowMapType: "PCFSoft", // "Basic", "PCF", "PCFSoft", "VSM"
    physicallyCorrectLights: true,
    outputColorSpace: "sRGB",
    toneMapping: "ACESFilmic", // "None", "Linear", "Reinhard", "Cineon", "ACESFilmic"
    toneMappingExposure: 1,
  },

  // Movement settings
  movement: {
    kinematic: {
      accelForward: 100,
      accelStrafe: 100,
      maxSpeed: 500,
      drag: 2.5,
      brakeDrag: 6.0,
      yawSpeed: 4, // radians/sec
    },
    lerp: 0.02, // Movement lerp factor (0..1 per frame)
  },

  // Car specifications
  car: {
    // F1 car specifications (for HUD and physics)
    specs: {
      maxRPM: 15000,
      idleRPM: 4000,
      redlineRPM: 12000,
      gears: 8,
      maxSpeedKph: 360,
      maxTorque: 770, // Nm
      downforceCoefficient: 5.0,
      dragCoefficient: 1.0,
      tyreCompounds: ["Soft", "Medium", "Hard", "Intermediate", "Wet"],
      defaultTyreCompound: "Medium",
      engineModes: ["Standard", "Rich", "Lean"],
      defaultEngineMode: "Standard",
      brakeBias: 0.5, // 0.0 = full rear, 1.0 = full front
    },

    // Parameters for car target positions (world space)
    positions: [
      // Car 1 spawn aligned with your provided grid location (approx.)
      { x: -6.64, y: 0.1, z: -25.11 },
      { x: -25, y: 0.1, z: -30 },
      { x: -29, y: 0.1, z: -35 },
      { x: -25, y: 0.1, z: -35 },
    ],

    // Default spawn for Car 1 (used by Reset/auto-respawn)
    car1Spawn: {
      position: { x: -6.64, y: 2, z: -25.11 },
      yaw: 1.57079632679,
    },
  },

  // Path settings
  path: {
    // Race path points loaded from JSON
    racePathPoints: racePathData.racePathPoints.map((p) => ({
      x: p[0],
      y: p[1],
      z: p[2],
    })),

    // Path editor settings
    editor: {
      sphereSize: 0.5,
      sphereSegments: 16,
      lineColor: 0x00ff00,
      sphereColor: 0x00ff00,
    },

    // Path recording settings
    recorder: {
      minSampleDistance: 0.75,
      defaultSpeed: 0.01,
      storageKey: "racePathsV1",
    },
  },

  // Asset paths
  assets: {
    track: "/models/track.glb",
    cars: [
      "/models/red_bull.glb",
      "/models/aston_martin.glb",
      "/models/mclaren_2021.glb",
      "/models/mclaren_2022.glb",
    ],
  },

  // HUD settings
  hud: {
    enabled: true,
    fontSize: 14,
    fontFamily: "Arial",
    color: "#ffffff",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
};

// Export individual sections for backward compatibility
export const keyboardControls = CONFIG.keyboard;
export const physicsConfig = CONFIG.physics;
export const cameraConfig = CONFIG.camera.main;
export const followCameraConfig = CONFIG.camera.follow;
export const gameplayConfig = { physicsEnabled: CONFIG.physics.enabled };
export const kinematicMovement = CONFIG.movement.kinematic;
export const f1CarSpecs = CONFIG.car.specs;
export const orbitControlsConfig = CONFIG.camera.orbit;
export const carPositions = CONFIG.car.positions;
export const car1Spawn = CONFIG.car.car1Spawn;
export const racePathPoints = CONFIG.path.racePathPoints;
export const movementLerp = CONFIG.movement.lerp;
export const MODEL_PATHS = CONFIG.assets;

// Export the entire config object
export default CONFIG;
