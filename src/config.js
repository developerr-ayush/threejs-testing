// Parameters for car target positions (world space)
export const carPositions = [
  { x: 10, y: 0, z: 5 },
  { x: 12, y: 0, z: 7 },
  { x: 15, y: 0, z: 6 },
  { x: 17, y: 0, z: 4 }
];

// Tuning
export const movementLerp = 0.02; // 0..1 per frame
export const cameraFollowLerp = 0.08; // 0..1 per frame

// Camera relative offset (behind and above each car)
export const chaseCameraOffset = { x: 0, y: 3, z: -6 };

// Paths
export const MODEL_PATHS = {
  track: '/models/track.glb',
  cars: [
    '/models/red_bull.glb',
    '/models/aston_martin.glb',
    '/models/mclaren_2021.glb',
    '/models/mclaren_2022.glb'
  ]
};
