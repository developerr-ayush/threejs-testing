import racePathData from "./racepath.json";

export const keyboardControls = {
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
};

export const physicsConfig = {
  gravity: { x: 0, y: -9.82, z: 0 },
  carMass: 1,
  groundFriction: 0.3,
  carDimensions: { x: 2, y: 0.5, z: 4 },
  linearDamping: 0.4,
  angularDamping: 0.6,
  suspensionOffset: 0.6, // visual Y offset to keep car above the track mesh
};

export const cameraConfig = {
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 5000,
  position: { x: 0, y: 10, z: 20 },
  lookAt: { x: 0, y: 0, z: 0 },
};

export const followCameraConfig = {
  top: { offset: { x: 0, y: 12, z: 0 }, lookOffset: { x: 0, y: 0, z: 0 } },
  chase: { offset: { x: 0, y: 5, z: -10 }, lookOffset: { x: 0, y: 2, z: 6 } },
  bottom: { offset: { x: 0, y: -1, z: 0 }, lookOffset: { x: 0, y: 0, z: 3 } },
  t_cam: {
    offset: { x: 0, y: 0.8, z: -0.2 },
    lookOffset: { x: 0, y: 0.5, z: 2 },
  }, // F1 T-cam (onboard)
  front_wing: {
    offset: { x: 0, y: 0.3, z: 3 },
    lookOffset: { x: 0, y: 0.5, z: 10 },
  }, // Front wing cam
};

export const gameplayConfig = {
  physicsEnabled: false,
};

export const kinematicMovement = {
  accelForward: 100,
  accelStrafe: 100,
  maxSpeed: 500,
  drag: 2.5,
  brakeDrag: 6.0,
  yawSpeed: 4, // radians/sec
};

// F1 car specifications (for HUD and physics)
export const f1CarSpecs = {
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
};

export const orbitControlsConfig = {
  enableDamping: false,
  enablePan: false,
  minDistance: 50,
  maxDistance: 200,
  target: { x: 0, y: 0, z: 0 },
};

// Parameters for car target positions (world space)
export const carPositions = [
  // Car 1 spawn aligned with your provided grid location (approx.)
  { x: -6.64, y: 0.1, z: -25.11 },
  { x: -25, y: 0.1, z: -30 },
  { x: -29, y: 0.1, z: -35 },
  { x: -25, y: 0.1, z: -35 },
];

// Default spawn for Car 1 (used by Reset/auto-respawn)
export const car1Spawn = {
  position: { x: -6.64, y: 2, z: -25.11 },
  yaw: 1.57079632679,
};

export const racePathPoints = racePathData.racePathPoints.map((p) => ({
  x: p[0],
  y: p[1],
  z: p[2],
}));

// Tuning
export const movementLerp = 0.02; // 0..1 per frame

// Paths
export const MODEL_PATHS = {
  track: "/models/track.glb",
  cars: [
    "/models/red_bull.glb",
    "/models/aston_martin.glb",
    "/models/mclaren_2021.glb",
    "/models/mclaren_2022.glb",
  ],
};
