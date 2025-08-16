/**
 * Renderer utilities for Three.js
 */
import * as THREE from "three";
import CONFIG from "../config.js";

/**
 * Creates and configures a WebGLRenderer based on config settings
 * @param {Object} options - Override options for the renderer
 * @returns {THREE.WebGLRenderer} Configured renderer
 */
export function createRenderer(options = {}) {
  const config = CONFIG.renderer;

  // Create renderer with merged options
  const renderer = new THREE.WebGLRenderer({
    antialias:
      options.antialias !== undefined ? options.antialias : config.antialias,
    powerPreference: options.powerPreference || config.powerPreference,
    ...options,
  });

  // Configure renderer
  renderer.setPixelRatio(options.pixelRatio || config.pixelRatio);

  // Configure shadows
  renderer.shadowMap.enabled = true;

  // Set shadow map type
  const shadowMapType = options.shadowMapType || config.shadowMapType;
  switch (shadowMapType) {
    case "Basic":
      renderer.shadowMap.type = THREE.BasicShadowMap;
      break;
    case "PCF":
      renderer.shadowMap.type = THREE.PCFShadowMap;
      break;
    case "PCFSoft":
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      break;
    case "VSM":
      renderer.shadowMap.type = THREE.VSMShadowMap;
      break;
    default:
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  // Configure physically correct lighting
  renderer.physicallyCorrectLights =
    options.physicallyCorrectLights !== undefined
      ? options.physicallyCorrectLights
      : config.physicallyCorrectLights;

  // Configure color space
  const colorSpace = options.outputColorSpace || config.outputColorSpace;
  if (colorSpace === "sRGB") {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if (colorSpace === "Linear") {
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  }

  // Configure tone mapping
  const toneMapping = options.toneMapping || config.toneMapping;
  switch (toneMapping) {
    case "None":
      renderer.toneMapping = THREE.NoToneMapping;
      break;
    case "Linear":
      renderer.toneMapping = THREE.LinearToneMapping;
      break;
    case "Reinhard":
      renderer.toneMapping = THREE.ReinhardToneMapping;
      break;
    case "Cineon":
      renderer.toneMapping = THREE.CineonToneMapping;
      break;
    case "ACESFilmic":
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      break;
    default:
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
  }

  // Set tone mapping exposure
  renderer.toneMappingExposure =
    options.toneMappingExposure !== undefined
      ? options.toneMappingExposure
      : config.toneMappingExposure;

  return renderer;
}

/**
 * Handles window resize for renderer and cameras
 * @param {THREE.WebGLRenderer} renderer - The renderer to resize
 * @param {THREE.Camera} camera - The camera to update
 * @param {Function} additionalCallback - Optional callback for additional resize logic
 * @returns {Function} Function to call when window is resized
 */
export function createResizeHandler(
  renderer,
  camera,
  additionalCallback = null
) {
  return function () {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Update renderer
    renderer.setSize(width, height);

    // Update camera aspect ratio
    if (camera && camera.isPerspectiveCamera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    // Call additional callback if provided
    if (additionalCallback && typeof additionalCallback === "function") {
      additionalCallback(width, height);
    }
  };
}

/**
 * Creates a screenshot of the current renderer view
 * @param {THREE.WebGLRenderer} renderer - The renderer to capture from
 * @param {string} fileName - Optional filename for download
 * @returns {string} Data URL of the screenshot
 */
export function captureScreenshot(renderer, fileName = "screenshot.png") {
  // Render and get data URL
  const dataURL = renderer.domElement.toDataURL("image/png");

  // Create download if filename is provided
  if (fileName) {
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = fileName;
    link.click();
  }

  return dataURL;
}
