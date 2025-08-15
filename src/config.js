export const cameraConfig = {
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 5000,
  position: { x: 0, y: 50, z: 100 },
  lookAt: { x: 0, y: 0, z: 0 },
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
  { x: 10, y: 0, z: 5 },
  { x: 12, y: 0, z: 5 },
  { x: 14, y: 0, z: 5 },
  { x: 16, y: 0, z: 5 },
];

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
