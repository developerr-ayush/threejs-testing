/**
 * Utility to fix materials in GLB models to properly respond to lighting
 */
import * as THREE from "three";

/**
 * Fixes materials in a loaded GLB model to properly respond to lighting
 * @param {THREE.Object3D} object - The loaded GLB model
 * @param {Object} options - Configuration options
 * @returns {THREE.Object3D} The modified object
 */
export function fixModelMaterials(object, options = {}) {
  const defaults = {
    metalness: 0.3,
    roughness: 0.7,
    envMapIntensity: 1.0,
    normalScale: 1.0,
    emissiveIntensity: 1.0,
    forceMaterialUpdate: true,
    debug: false,
  };

  const config = { ...defaults, ...options };

  if (config.debug) {
    console.log("Fixing materials for model:", object.name || "unnamed model");
  }

  // Count of fixed materials
  let fixedCount = 0;
  let totalCount = 0;

  // Traverse the object and fix materials
  object.traverse((node) => {
    if (node.isMesh) {
      totalCount++;

      // Check if material is an array
      if (Array.isArray(node.material)) {
        node.material.forEach((mat, index) => {
          fixedCount += fixMaterial(mat, node, config) ? 1 : 0;
        });
      } else if (node.material) {
        fixedCount += fixMaterial(node.material, node, config) ? 1 : 0;
      }
    }
  });

  if (config.debug) {
    console.log(`Fixed ${fixedCount} out of ${totalCount} materials`);
  }

  return object;
}

/**
 * Fixes a single material to properly respond to lighting
 * @param {THREE.Material} material - The material to fix
 * @param {THREE.Mesh} mesh - The mesh using this material
 * @param {Object} config - Configuration options
 * @returns {boolean} True if material was modified
 */
function fixMaterial(material, mesh, config) {
  if (!material) return false;

  let modified = false;

  // Always ensure shadows are enabled on the mesh
  if (mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  // Make sure material responds to lights
  if (material.isMeshBasicMaterial) {
    // Convert MeshBasicMaterial to MeshStandardMaterial
    const newMat = new THREE.MeshStandardMaterial({
      color: material.color ? material.color.clone() : 0xffffff,
      map: material.map,
      transparent: material.transparent,
      opacity: material.opacity,
      alphaTest: material.alphaTest || 0,
      side: material.side || THREE.FrontSide,
      flatShading: material.flatShading || false,
      wireframe: material.wireframe || false,
      metalness: config.metalness,
      roughness: config.roughness,
      envMapIntensity: config.envMapIntensity || 1.0,
    });

    // Copy texture settings if present
    if (material.map) {
      newMat.map = material.map;
      newMat.map.needsUpdate = true;
    }

    // Copy any other relevant properties
    if (material.name) newMat.name = material.name;
    if (material.userData) newMat.userData = { ...material.userData };

    // Replace the material
    mesh.material = newMat;
    modified = true;

    if (config.debug) {
      console.log("Converted MeshBasicMaterial to MeshStandardMaterial");
    }
  } else if (material.isMeshLambertMaterial || material.isMeshPhongMaterial) {
    // Convert to MeshStandardMaterial for better PBR lighting
    const newMat = new THREE.MeshStandardMaterial({
      color: material.color ? material.color.clone() : 0xffffff,
      map: material.map,
      normalMap: material.normalMap,
      transparent: material.transparent,
      opacity: material.opacity,
      alphaTest: material.alphaTest || 0,
      side: material.side || THREE.FrontSide,
      flatShading: material.flatShading || false,
      wireframe: material.wireframe || false,
      metalness: config.metalness,
      roughness: config.roughness,
      emissive: material.emissive
        ? material.emissive.clone()
        : new THREE.Color(0x000000),
      emissiveIntensity: material.emissiveIntensity || config.emissiveIntensity,
      envMapIntensity: config.envMapIntensity || 1.0,
    });

    // Copy texture settings if present
    if (material.map) {
      newMat.map = material.map;
      newMat.map.needsUpdate = true;
    }

    if (material.normalMap) {
      newMat.normalMap = material.normalMap;
      newMat.normalScale.set(
        config.normalScale || 1.0,
        config.normalScale || 1.0
      );
      newMat.normalMap.needsUpdate = true;
    }

    // Copy emissive map if present
    if (material.emissiveMap) {
      newMat.emissiveMap = material.emissiveMap;
      newMat.emissiveMap.needsUpdate = true;
    }

    // Copy any other relevant properties
    if (material.name) newMat.name = material.name;
    if (material.userData) newMat.userData = { ...material.userData };

    // Replace the material
    mesh.material = newMat;
    modified = true;

    if (config.debug) {
      console.log(
        "Converted MeshLambertMaterial/MeshPhongMaterial to MeshStandardMaterial"
      );
    }
  } else if (material.isMeshStandardMaterial) {
    // Just ensure properties are set correctly
    if (material.metalness === undefined || material.metalness === 0) {
      material.metalness = config.metalness;
      modified = true;
    }

    if (material.roughness === undefined || material.roughness === 1) {
      material.roughness = config.roughness;
      modified = true;
    }

    // Make sure textures are properly set to update
    if (material.map) {
      material.map.needsUpdate = true;
    }

    if (material.normalMap) {
      material.normalMap.needsUpdate = true;
    }

    if (material.envMap) {
      material.envMap.needsUpdate = true;
    }

    if (material.emissiveMap) {
      material.emissiveMap.needsUpdate = true;
    }

    if (config.debug && modified) {
      console.log("Updated MeshStandardMaterial properties");
    }
  } else if (material.type && material.type !== "MeshStandardMaterial") {
    // Try to handle any other material types
    try {
      const newMat = new THREE.MeshStandardMaterial({
        color: material.color ? material.color.clone() : 0xffffff,
        metalness: config.metalness,
        roughness: config.roughness,
        transparent: material.transparent || false,
        opacity: material.opacity !== undefined ? material.opacity : 1.0,
        side: material.side || THREE.FrontSide,
        flatShading: false,
      });

      // Copy any maps that might exist
      const mapProperties = [
        "map",
        "normalMap",
        "bumpMap",
        "emissiveMap",
        "metalnessMap",
        "roughnessMap",
      ];
      mapProperties.forEach((prop) => {
        if (material[prop]) {
          newMat[prop] = material[prop];
          newMat[prop].needsUpdate = true;
        }
      });

      // Replace the material
      mesh.material = newMat;
      modified = true;

      if (config.debug) {
        console.log(`Converted ${material.type} to MeshStandardMaterial`);
      }
    } catch (e) {
      console.warn(`Failed to convert material of type ${material.type}:`, e);
    }
  }

  // Ensure material updates properly
  if (modified || config.forceMaterialUpdate) {
    material.needsUpdate = true;
  }

  return modified;
}

/**
 * Fixes all materials in the scene to properly respond to lighting
 * @param {THREE.Scene} scene - The scene containing models
 * @param {Object} options - Configuration options
 */
export function fixAllSceneMaterials(scene, options = {}) {
  console.log("Fixing all materials in scene...");

  let totalFixed = 0;
  let totalObjects = 0;
  let totalMaterials = 0;

  // Keep track of processed materials to avoid duplicates
  const processedMaterials = new Set();

  scene.traverse((object) => {
    if (object.isMesh) {
      totalObjects++;

      // Handle array of materials
      if (Array.isArray(object.material)) {
        object.material.forEach((mat, index) => {
          if (mat) {
            totalMaterials++;
            // Use material's UUID to avoid processing the same material multiple times
            if (!processedMaterials.has(mat.uuid)) {
              processedMaterials.add(mat.uuid);
              if (fixMaterial(mat, object, options)) {
                totalFixed++;
              }
            }
          }
        });
      }
      // Handle single material
      else if (object.material) {
        totalMaterials++;
        if (!processedMaterials.has(object.material.uuid)) {
          processedMaterials.add(object.material.uuid);
          if (fixMaterial(object.material, object, options)) {
            totalFixed++;
          }
        }
      }

      // Always ensure the mesh has shadow properties set
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  console.log(
    `Fixed ${totalFixed} out of ${totalMaterials} materials across ${totalObjects} objects in scene`
  );

  return { totalFixed, totalObjects, totalMaterials };
}

// Export global functions to fix materials from the console
window.fixAllMaterials = function (options = {}) {
  if (window.scene) {
    const result = fixAllSceneMaterials(window.scene, {
      debug: true,
      metalness: options.metalness || 0.5,
      roughness: options.roughness || 0.5,
      ...options,
    });
    return `Materials fixed: ${result.totalFixed} out of ${result.totalMaterials} materials across ${result.totalObjects} objects - check console for details`;
  } else {
    return "Scene not available globally";
  }
};

// Add a function to inspect materials in the scene
window.inspectMaterials = function () {
  if (!window.scene) return "Scene not available globally";

  const materials = {};
  const materialTypes = {};

  window.scene.traverse((object) => {
    if (object.isMesh) {
      if (Array.isArray(object.material)) {
        object.material.forEach((mat) => {
          if (mat) {
            const type = mat.type || "Unknown";
            materialTypes[type] = (materialTypes[type] || 0) + 1;
            materials[mat.uuid] = {
              type,
              name: mat.name || "unnamed",
              color: mat.color ? "#" + mat.color.getHexString() : "none",
              metalness: mat.metalness,
              roughness: mat.roughness,
              maps: {
                map: !!mat.map,
                normalMap: !!mat.normalMap,
                emissiveMap: !!mat.emissiveMap,
                metalnessMap: !!mat.metalnessMap,
                roughnessMap: !!mat.roughnessMap,
              },
              mesh: object.name || object.uuid,
            };
          }
        });
      } else if (object.material) {
        const mat = object.material;
        const type = mat.type || "Unknown";
        materialTypes[type] = (materialTypes[type] || 0) + 1;
        materials[mat.uuid] = {
          type,
          name: mat.name || "unnamed",
          color: mat.color ? "#" + mat.color.getHexString() : "none",
          metalness: mat.metalness,
          roughness: mat.roughness,
          maps: {
            map: !!mat.map,
            normalMap: !!mat.normalMap,
            emissiveMap: !!mat.emissiveMap,
            metalnessMap: !!mat.metalnessMap,
            roughnessMap: !!mat.roughnessMap,
          },
          mesh: object.name || object.uuid,
        };
      }
    }
  });

  console.log("Material Types Summary:", materialTypes);
  console.log("Material Details:", materials);

  return `Found ${
    Object.keys(materials).length
  } unique materials - check console for details`;
};
