import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// Load a single GLB, resolve to the root scene/object3D
export function loadGLB(url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const root = gltf.scene || gltf.scenes?.[0];
        resolve(root);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

// Load the track and array of cars; returns { track, cars }
export async function loadAllModels(trackUrl, carUrls) {
  const [track, ...cars] = await Promise.all([
    loadGLB(trackUrl),
    ...carUrls.map((u) => loadGLB(u))
  ]);
  return { track, cars };
}
