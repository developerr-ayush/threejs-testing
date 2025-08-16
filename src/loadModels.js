import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { fixModelMaterials } from './fixMaterials.js';

// Create GLTF loader with Draco compression support
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
loader.setDRACOLoader(dracoLoader);

/**
 * Load manager to track loading progress
 */
const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (url, loaded, total) => {
  const progress = (loaded / total) * 100;
  console.log(`Loading: ${Math.round(progress)}% (${url})`);
  
  // Update loading UI if it exists
  if (window.updateLoadingProgress) {
    window.updateLoadingProgress(progress);
  }
};

/**
 * Load a single GLB model
 * @param {string} url - URL to the GLB file
 * @param {Object} options - Loading options
 * @returns {Promise<THREE.Object3D>} The loaded model
 */
export function loadGLB(url, options = {}) {
  const defaults = {
    autoFixMaterials: true,
    castShadow: true,
    receiveShadow: true,
    materialOptions: {
      metalness: 0.5,
      roughness: 0.5,
      debug: false
    }
  };
  
  const config = { ...defaults, ...options };
  
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const root = gltf.scene || gltf.scenes?.[0];
        
        if (!root) {
          console.warn(`No scene found in model: ${url}`);
          reject(new Error(`No scene found in model: ${url}`));
          return;
        }
        
        // Set name based on URL if not already set
        if (!root.name) {
          const urlParts = url.split('/');
          const fileName = urlParts[urlParts.length - 1].split('.')[0];
          root.name = fileName;
        }
        
        // Apply shadow settings
        if (config.castShadow || config.receiveShadow) {
          root.traverse((object) => {
            if (object.isMesh) {
              if (config.castShadow) object.castShadow = true;
              if (config.receiveShadow) object.receiveShadow = true;
            }
          });
        }
        
        // Fix materials if requested
        if (config.autoFixMaterials) {
          fixModelMaterials(root, config.materialOptions);
        }
        
        resolve(root);
      },
      (progress) => {
        // Progress callback (if needed)
        if (options.onProgress) {
          options.onProgress(progress);
        }
      },
      (err) => {
        console.error(`Error loading model: ${url}`, err);
        reject(err);
      }
    );
  });
}

/**
 * Load the track and array of cars
 * @param {string} trackUrl - URL to track GLB
 * @param {Array<string>} carUrls - Array of URLs to car GLBs
 * @param {Object} options - Loading options
 * @returns {Promise<Object>} Object containing track and cars
 */
export async function loadAllModels(trackUrl, carUrls, options = {}) {
  try {
    console.log('Loading models...');
    
    // Track loading options
    const trackOptions = {
      autoFixMaterials: true,
      castShadow: true,
      receiveShadow: true,
      materialOptions: {
        metalness: 0.4,
        roughness: 0.6,
        debug: options.debug || false
      }
    };
    
    // Car loading options
    const carOptions = {
      autoFixMaterials: true,
      castShadow: true,
      receiveShadow: true,
      materialOptions: {
        metalness: 0.7,  // Higher metalness for cars (more reflective)
        roughness: 0.3,  // Lower roughness for cars (more shiny)
        debug: options.debug || false
      }
    };
    
    // Load all models in parallel
    const [track, ...cars] = await Promise.all([
      loadGLB(trackUrl, trackOptions),
      ...carUrls.map(url => loadGLB(url, carOptions))
    ]);
    
    console.log('All models loaded successfully');
    return { track, cars };
  } catch (error) {
    console.error('Error loading models:', error);
    throw error;
  }
}

/**
 * Create a simple loading screen
 * @returns {Object} Loading screen controller
 */
export function createLoadingScreen() {
  // Create loading overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '10000';
  
  // Create loading text
  const text = document.createElement('div');
  text.textContent = 'Loading...';
  text.style.color = 'white';
  text.style.fontSize = '24px';
  text.style.marginBottom = '20px';
  overlay.appendChild(text);
  
  // Create progress bar container
  const progressContainer = document.createElement('div');
  progressContainer.style.width = '300px';
  progressContainer.style.height = '20px';
  progressContainer.style.backgroundColor = '#333';
  progressContainer.style.borderRadius = '10px';
  progressContainer.style.overflow = 'hidden';
  overlay.appendChild(progressContainer);
  
  // Create progress bar
  const progressBar = document.createElement('div');
  progressBar.style.width = '0%';
  progressBar.style.height = '100%';
  progressBar.style.backgroundColor = '#4CAF50';
  progressBar.style.transition = 'width 0.3s ease';
  progressContainer.appendChild(progressBar);
  
  // Add to document
  document.body.appendChild(overlay);
  
  // Create controller
  const controller = {
    overlay,
    text,
    progressBar,
    
    // Update progress
    updateProgress(progress) {
      this.progressBar.style.width = `${progress}%`;
    },
    
    // Update text
    updateText(message) {
      this.text.textContent = message;
    },
    
    // Hide loading screen
    hide() {
      this.overlay.style.opacity = '0';
      this.overlay.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        this.overlay.style.display = 'none';
      }, 500);
    },
    
    // Show loading screen
    show() {
      this.overlay.style.display = 'flex';
      this.overlay.style.opacity = '1';
    }
  };
  
  // Expose update function globally
  window.updateLoadingProgress = (progress) => {
    controller.updateProgress(progress);
  };
  
  return controller;
}
