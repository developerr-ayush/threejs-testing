/**
 * Utils module index file
 * Exports all utility functions for easier imports
 */

// Re-export all utility modules
export * from "./common.js";
export * from "./math3d.js";
export * from "./renderer.js";
export * from "./lighting.js";

// Export default object with all utilities grouped
import * as common from "./common.js";
import * as math3d from "./math3d.js";
import * as renderer from "./renderer.js";
import * as lighting from "./lighting.js";

export default {
  common,
  math3d,
  renderer,
  lighting,
};
