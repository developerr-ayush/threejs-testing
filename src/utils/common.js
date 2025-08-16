/**
 * Common utility functions for the application
 */

/**
 * Safely reads a value from localStorage with error handling
 * @param {string} key - The localStorage key to read
 * @param {any} defaultValue - Default value to return if key doesn't exist or on error
 * @returns {any} The parsed value or defaultValue
 */
export function readFromStorage(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to read ${key} from localStorage:`, e);
    return defaultValue;
  }
}

/**
 * Safely writes a value to localStorage with error handling
 * @param {string} key - The localStorage key to write to
 * @param {any} value - The value to write (will be JSON stringified)
 * @returns {boolean} True if successful, false on error
 */
export function writeToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Failed to write ${key} to localStorage:`, e);
    return false;
  }
}

/**
 * Clamps a number between min and max values
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} The clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linearly interpolates between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} The interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Converts degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radToDeg(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Generates a UUID v4
 * @returns {string} A UUID v4 string
 */
export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Debounces a function to limit how often it can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - Time in ms to wait between calls
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Throttles a function to limit how often it can be called
 * @param {Function} func - The function to throttle
 * @param {number} limit - Time in ms between allowed calls
 * @returns {Function} The throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
