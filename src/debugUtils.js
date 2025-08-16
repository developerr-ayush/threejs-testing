/**
 * Comprehensive debugging utilities for Three.js scenes
 * Helps with debugging lighting, materials, and other common issues
 */
import * as THREE from "three";

/**
 * Creates a debug overlay with information about the scene
 * @param {Object} options - Configuration options
 * @returns {Object} Debug controller object
 */
export function createDebugOverlay(options = {}) {
  const defaults = {
    enabled: true,
    position: "top-left",
    fontSize: "12px",
    fontFamily: "monospace",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    textColor: "white",
    width: "300px",
    padding: "10px",
    zIndex: 10000,
  };

  const config = { ...defaults, ...options };

  // Create overlay element
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.fontSize = config.fontSize;
  overlay.style.fontFamily = config.fontFamily;
  overlay.style.backgroundColor = config.backgroundColor;
  overlay.style.color = config.textColor;
  overlay.style.padding = config.padding;
  overlay.style.width = config.width;
  overlay.style.maxHeight = "80vh";
  overlay.style.overflowY = "auto";
  overlay.style.zIndex = config.zIndex;
  overlay.style.display = config.enabled ? "block" : "none";

  // Position the overlay
  switch (config.position) {
    case "top-left":
      overlay.style.top = "10px";
      overlay.style.left = "10px";
      break;
    case "top-right":
      overlay.style.top = "10px";
      overlay.style.right = "10px";
      break;
    case "bottom-left":
      overlay.style.bottom = "10px";
      overlay.style.left = "10px";
      break;
    case "bottom-right":
      overlay.style.bottom = "10px";
      overlay.style.right = "10px";
      break;
    default:
      overlay.style.top = "10px";
      overlay.style.right = "10px";
  }

  // Add to document
  document.body.appendChild(overlay);

  // Create sections
  const sections = {
    stats: document.createElement("div"),
    lighting: document.createElement("div"),
    materials: document.createElement("div"),
    renderer: document.createElement("div"),
    custom: document.createElement("div"),
  };

  Object.values(sections).forEach((section) => {
    section.style.marginBottom = "10px";
    overlay.appendChild(section);
  });

  // Create controller
  const controller = {
    overlay,
    sections,
    config,

    // Toggle visibility
    toggle() {
      this.overlay.style.display =
        this.overlay.style.display === "none" ? "block" : "none";
      return this.overlay.style.display !== "none";
    },

    // Update stats section
    updateStats(scene, renderer, camera) {
      if (!scene) return;

      let objectCount = 0;
      let meshCount = 0;
      let lightCount = 0;
      let triangleCount = 0;

      scene.traverse((object) => {
        objectCount++;

        if (object.isMesh) {
          meshCount++;

          // Count triangles
          if (object.geometry) {
            if (object.geometry.index) {
              triangleCount += object.geometry.index.count / 3;
            } else if (
              object.geometry.attributes &&
              object.geometry.attributes.position
            ) {
              triangleCount += object.geometry.attributes.position.count / 3;
            }
          }
        }

        if (object.isLight) {
          lightCount++;
        }
      });

      // Format numbers with commas
      const format = (num) =>
        num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

      this.sections.stats.innerHTML = `
        <h3>Scene Stats</h3>
        <div>Objects: ${format(objectCount)}</div>
        <div>Meshes: ${format(meshCount)}</div>
        <div>Lights: ${format(lightCount)}</div>
        <div>Triangles: ~${format(Math.round(triangleCount))}</div>
        ${
          renderer ? `<div>Draw calls: ${renderer.info.render.calls}</div>` : ""
        }
        ${
          renderer
            ? `<div>Triangles rendered: ${format(
                renderer.info.render.triangles
              )}</div>`
            : ""
        }
        ${
          camera
            ? `<div>Camera position: (${camera.position.x.toFixed(
                1
              )}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(
                1
              )})</div>`
            : ""
        }
      `;
    },

    // Update lighting section
    updateLighting(lightRefs) {
      if (!lightRefs) return;

      let html = "<h3>Lighting</h3>";

      // Ambient light
      if (lightRefs.ambient) {
        const light = lightRefs.ambient;
        html += `
          <div style="margin-bottom: 5px;">
            <strong>Ambient:</strong> 
            <span style="color: ${light.visible ? "#8f8" : "#f88"}">
              ${light.visible ? "VISIBLE" : "HIDDEN"}
            </span>
            <div>Intensity: ${light.intensity.toFixed(2)}</div>
            <div>Color: #${light.color.getHexString()}</div>
          </div>
        `;
      }

      // Directional light
      if (lightRefs.directional) {
        const light = lightRefs.directional;
        html += `
          <div style="margin-bottom: 5px;">
            <strong>Directional:</strong> 
            <span style="color: ${light.visible ? "#8f8" : "#f88"}">
              ${light.visible ? "VISIBLE" : "HIDDEN"}
            </span>
            <div>Intensity: ${light.intensity.toFixed(2)}</div>
            <div>Color: #${light.color.getHexString()}</div>
            <div>Position: (${light.position.x.toFixed(
              1
            )}, ${light.position.y.toFixed(1)}, ${light.position.z.toFixed(
          1
        )})</div>
            <div>Shadows: ${light.castShadow ? "ON" : "OFF"}</div>
          </div>
        `;
      }

      // Hemisphere light
      if (lightRefs.hemisphere) {
        const light = lightRefs.hemisphere;
        html += `
          <div style="margin-bottom: 5px;">
            <strong>Hemisphere:</strong> 
            <span style="color: ${light.visible ? "#8f8" : "#f88"}">
              ${light.visible ? "VISIBLE" : "HIDDEN"}
            </span>
            <div>Intensity: ${light.intensity.toFixed(2)}</div>
            <div>Sky: #${light.color.getHexString()}</div>
            <div>Ground: #${light.groundColor.getHexString()}</div>
          </div>
        `;
      }

      // Spotlights
      if (lightRefs.spotlights && lightRefs.spotlights.length) {
        lightRefs.spotlights.forEach((light, i) => {
          if (light) {
            html += `
              <div style="margin-bottom: 5px;">
                <strong>Spotlight ${i + 1}:</strong> 
                <span style="color: ${light.visible ? "#8f8" : "#f88"}">
                  ${light.visible ? "VISIBLE" : "HIDDEN"}
                </span>
                <div>Intensity: ${light.intensity.toFixed(2)}</div>
                <div>Color: #${light.color.getHexString()}</div>
                <div>Position: (${light.position.x.toFixed(
                  1
                )}, ${light.position.y.toFixed(1)}, ${light.position.z.toFixed(
              1
            )})</div>
                <div>Shadows: ${light.castShadow ? "ON" : "OFF"}</div>
              </div>
            `;
          }
        });
      }

      this.sections.lighting.innerHTML = html;
    },

    // Update materials section
    updateMaterials(scene) {
      if (!scene) return;

      const materialCounts = {};
      const materialDetails = [];

      // Analyze materials
      scene.traverse((object) => {
        if (object.isMesh) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => {
              if (mat) {
                const type = mat.type || "Unknown";
                materialCounts[type] = (materialCounts[type] || 0) + 1;

                // Only add detailed info for first few instances of each type
                const existingCount = materialDetails.filter(
                  (m) => m.type === type
                ).length;
                if (existingCount < 3) {
                  materialDetails.push({
                    type,
                    name: mat.name || "unnamed",
                    color: mat.color ? "#" + mat.color.getHexString() : "none",
                    metalness: mat.metalness,
                    roughness: mat.roughness,
                    maps: {
                      map: !!mat.map,
                      normalMap: !!mat.normalMap,
                      emissiveMap: !!mat.emissiveMap,
                    },
                    mesh: object.name || object.uuid.substring(0, 8),
                  });
                }
              }
            });
          } else if (object.material) {
            const mat = object.material;
            const type = mat.type || "Unknown";
            materialCounts[type] = (materialCounts[type] || 0) + 1;

            // Only add detailed info for first few instances of each type
            const existingCount = materialDetails.filter(
              (m) => m.type === type
            ).length;
            if (existingCount < 3) {
              materialDetails.push({
                type,
                name: mat.name || "unnamed",
                color: mat.color ? "#" + mat.color.getHexString() : "none",
                metalness: mat.metalness,
                roughness: mat.roughness,
                maps: {
                  map: !!mat.map,
                  normalMap: !!mat.normalMap,
                  emissiveMap: !!mat.emissiveMap,
                },
                mesh: object.name || object.uuid.substring(0, 8),
              });
            }
          }
        }
      });

      // Create HTML
      let html = "<h3>Materials</h3>";

      // Summary
      html += "<div><strong>Material Types:</strong></div>";
      Object.entries(materialCounts).forEach(([type, count]) => {
        html += `<div>${type}: ${count}</div>`;
      });

      // Details
      html +=
        '<div style="margin-top: 5px;"><strong>Sample Materials:</strong></div>';
      materialDetails.forEach((mat) => {
        html += `
          <div style="margin-bottom: 5px; border-left: 2px solid #666; padding-left: 5px;">
            <div><strong>${mat.type}</strong> (${mat.name})</div>
            ${
              mat.color !== "none"
                ? `<div>Color: <span style="display: inline-block; width: 12px; height: 12px; background-color: ${mat.color};"></span> ${mat.color}</div>`
                : ""
            }
            ${
              mat.metalness !== undefined
                ? `<div>Metalness: ${mat.metalness?.toFixed(2)}</div>`
                : ""
            }
            ${
              mat.roughness !== undefined
                ? `<div>Roughness: ${mat.roughness?.toFixed(2)}</div>`
                : ""
            }
            <div>Maps: ${mat.maps.map ? "Diffuse " : ""}${
          mat.maps.normalMap ? "Normal " : ""
        }${mat.maps.emissiveMap ? "Emissive" : ""}</div>
            <div>On: ${mat.mesh}</div>
          </div>
        `;
      });

      this.sections.materials.innerHTML = html;
    },

    // Update renderer section
    updateRenderer(renderer) {
      if (!renderer) return;

      this.sections.renderer.innerHTML = `
        <h3>Renderer</h3>
        <div>Shadows: ${
          renderer.shadowMap.enabled ? "Enabled" : "Disabled"
        }</div>
        <div>Shadow Type: ${getShadowMapTypeName(renderer.shadowMap.type)}</div>
        <div>Output Color Space: ${getColorSpaceName(
          renderer.outputColorSpace
        )}</div>
        <div>Tone Mapping: ${getToneMappingName(renderer.toneMapping)}</div>
        <div>Exposure: ${renderer.toneMappingExposure.toFixed(2)}</div>
        <div>Physically Correct Lights: ${
          renderer.physicallyCorrectLights ? "Yes" : "No"
        }</div>
      `;
    },

    // Update with custom content
    updateCustom(html) {
      this.sections.custom.innerHTML = html;
    },

    // Update all sections
    update(scene, renderer, camera, lightRefs, customHTML) {
      if (this.overlay.style.display === "none") return;

      this.updateStats(scene, renderer, camera);
      this.updateLighting(lightRefs);
      this.updateMaterials(scene);
      this.updateRenderer(renderer);

      if (customHTML) {
        this.updateCustom(customHTML);
      }
    },
  };

  // Add keyboard shortcut to toggle overlay (Ctrl+D)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "d") {
      e.preventDefault();
      controller.toggle();
    }
  });

  return controller;
}

// Helper functions for renderer info
function getShadowMapTypeName(type) {
  switch (type) {
    case THREE.BasicShadowMap:
      return "BasicShadowMap";
    case THREE.PCFShadowMap:
      return "PCFShadowMap";
    case THREE.PCFSoftShadowMap:
      return "PCFSoftShadowMap";
    case THREE.VSMShadowMap:
      return "VSMShadowMap";
    default:
      return "Unknown";
  }
}

function getColorSpaceName(colorSpace) {
  switch (colorSpace) {
    case THREE.SRGBColorSpace:
      return "sRGB";
    case THREE.LinearSRGBColorSpace:
      return "Linear sRGB";
    default:
      return colorSpace || "Unknown";
  }
}

function getToneMappingName(toneMapping) {
  switch (toneMapping) {
    case THREE.NoToneMapping:
      return "None";
    case THREE.LinearToneMapping:
      return "Linear";
    case THREE.ReinhardToneMapping:
      return "Reinhard";
    case THREE.CineonToneMapping:
      return "Cineon";
    case THREE.ACESFilmicToneMapping:
      return "ACES Filmic";
    default:
      return "Unknown";
  }
}

/**
 * Creates a visual grid helper for the scene
 * @param {THREE.Scene} scene - The scene to add the grid to
 * @param {Object} options - Configuration options
 * @returns {Object} Grid helper controller
 */
export function createDebugGrid(scene, options = {}) {
  const defaults = {
    size: 100,
    divisions: 100,
    color1: 0x444444,
    color2: 0x888888,
    enabled: true,
  };

  const config = { ...defaults, ...options };
  const gridHelper = new THREE.GridHelper(
    config.size,
    config.divisions,
    config.color1,
    config.color2
  );
  gridHelper.visible = config.enabled;

  if (scene) {
    scene.add(gridHelper);
  }

  return {
    grid: gridHelper,
    toggle() {
      gridHelper.visible = !gridHelper.visible;
      return gridHelper.visible;
    },
    setVisible(visible) {
      gridHelper.visible = visible;
    },
  };
}

/**
 * Creates axes helper for the scene
 * @param {THREE.Scene} scene - The scene to add the axes to
 * @param {Object} options - Configuration options
 * @returns {Object} Axes helper controller
 */
export function createDebugAxes(scene, options = {}) {
  const defaults = {
    size: 5,
    enabled: true,
  };

  const config = { ...defaults, ...options };
  const axesHelper = new THREE.AxesHelper(config.size);
  axesHelper.visible = config.enabled;

  if (scene) {
    scene.add(axesHelper);
  }

  return {
    axes: axesHelper,
    toggle() {
      axesHelper.visible = !axesHelper.visible;
      return axesHelper.visible;
    },
    setVisible(visible) {
      axesHelper.visible = visible;
    },
  };
}

/**
 * Creates a performance monitor
 * @param {Object} options - Configuration options
 * @returns {Object} Performance monitor controller
 */
export function createPerformanceMonitor(options = {}) {
  const defaults = {
    enabled: true,
    sampleSize: 60, // 1 second at 60fps
    position: "bottom-left",
    width: 200,
    height: 100,
  };

  const config = { ...defaults, ...options };

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = config.width;
  canvas.height = config.height;
  canvas.style.position = "fixed";
  canvas.style.zIndex = 10000;
  canvas.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  canvas.style.display = config.enabled ? "block" : "none";

  // Position the canvas
  switch (config.position) {
    case "top-left":
      canvas.style.top = "10px";
      canvas.style.left = "10px";
      break;
    case "top-right":
      canvas.style.top = "10px";
      canvas.style.right = "10px";
      break;
    case "bottom-left":
      canvas.style.bottom = "10px";
      canvas.style.left = "10px";
      break;
    case "bottom-right":
      canvas.style.bottom = "10px";
      canvas.style.right = "10px";
      break;
    default:
      canvas.style.bottom = "10px";
      canvas.style.left = "10px";
  }

  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const samples = [];

  // Initialize with empty samples
  for (let i = 0; i < config.sampleSize; i++) {
    samples.push(0);
  }

  let lastTime = performance.now();
  let frameCount = 0;
  let fps = 0;

  return {
    canvas,
    config,
    samples,

    toggle() {
      this.canvas.style.display =
        this.canvas.style.display === "none" ? "block" : "none";
      return this.canvas.style.display !== "none";
    },

    update() {
      if (this.canvas.style.display === "none") return;

      const now = performance.now();
      const delta = now - lastTime;

      // Update FPS once per second
      frameCount++;
      if (delta >= 1000) {
        fps = Math.round((frameCount * 1000) / delta);
        frameCount = 0;
        lastTime = now;
      }

      // Add current frame time to samples
      const frameTime = delta / frameCount || 0;
      samples.push(frameTime);
      samples.shift();

      // Draw the graph
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw FPS text
      ctx.fillStyle = fps >= 55 ? "#8f8" : fps >= 30 ? "#ff8" : "#f88";
      ctx.font = "20px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`FPS: ${fps}`, 10, 25);

      // Draw frame time
      ctx.fillStyle = "#fff";
      ctx.font = "12px monospace";
      ctx.fillText(`Frame: ${frameTime.toFixed(2)}ms`, 10, 45);

      // Find max value for scaling
      const maxValue = Math.max(33, ...samples); // At least 33ms (30fps) for scale

      // Draw graph
      ctx.strokeStyle = "#4f4";
      ctx.beginPath();

      const barWidth = canvas.width / samples.length;

      samples.forEach((sample, i) => {
        const x = i * barWidth;
        const y = canvas.height - (sample / maxValue) * (canvas.height - 50);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw threshold lines
      // 60fps line (16.67ms)
      ctx.strokeStyle = "#8f8";
      ctx.beginPath();
      const y60fps = canvas.height - (16.67 / maxValue) * (canvas.height - 50);
      ctx.moveTo(0, y60fps);
      ctx.lineTo(canvas.width, y60fps);
      ctx.stroke();

      // 30fps line (33.33ms)
      ctx.strokeStyle = "#f88";
      ctx.beginPath();
      const y30fps = canvas.height - (33.33 / maxValue) * (canvas.height - 50);
      ctx.moveTo(0, y30fps);
      ctx.lineTo(canvas.width, y30fps);
      ctx.stroke();
    },
  };
}

// Export a global debug controller
window.debugController = {
  init(scene, renderer, camera, lightRefs) {
    this.overlay = createDebugOverlay();
    this.grid = createDebugGrid(scene);
    this.axes = createDebugAxes(scene);
    this.performance = createPerformanceMonitor();

    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.lightRefs = lightRefs;

    // Set up animation loop hook
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function (callback) {
      return originalRAF((time) => {
        if (window.debugController) {
          window.debugController.update(time);
        }
        return callback(time);
      });
    };

    console.log(
      "Debug controller initialized. Press Ctrl+D to toggle overlay."
    );
    return this;
  },

  update(time) {
    if (!this.overlay) return;

    // Get active camera if not specified
    const camera =
      this.camera ||
      (window.cameraManager ? window.cameraManager.getActiveCamera() : null);

    this.overlay.update(this.scene, this.renderer, camera, this.lightRefs);
    this.performance.update();
  },

  toggleOverlay() {
    if (this.overlay) this.overlay.toggle();
  },

  toggleGrid() {
    if (this.grid) this.grid.toggle();
  },

  toggleAxes() {
    if (this.axes) this.axes.toggle();
  },

  togglePerformance() {
    if (this.performance) this.performance.toggle();
  },
};
