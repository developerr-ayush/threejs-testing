/**
 * 3D math utility functions
 */
import * as THREE from "three";

/**
 * Gets the ground Y position at a given X,Z coordinate by raycasting
 * @param {THREE.Object3D} trackMesh - The track/ground mesh to raycast against
 * @param {number} x - X world position
 * @param {number} z - Z world position
 * @param {number} rayHeight - Height to cast ray from
 * @param {number} defaultY - Default Y value if no intersection found
 * @returns {number} The Y position at the surface
 */
export function getGroundYAt(trackMesh, x, z, rayHeight = 1000, defaultY = 0) {
  if (!trackMesh) return defaultY;

  const raycaster = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3(x, rayHeight, z);
  const rayDirection = new THREE.Vector3(0, -1, 0);
  raycaster.set(rayOrigin, rayDirection);

  const intersects = raycaster.intersectObject(trackMesh, true);
  if (intersects && intersects.length > 0) {
    return intersects[0].point.y;
  }

  return defaultY;
}

/**
 * Snaps an object to the track surface with an optional Y offset
 * @param {THREE.Object3D} object - The object to snap to the track
 * @param {THREE.Object3D} trackMesh - The track/ground mesh
 * @param {number} yOffset - Additional Y offset to apply
 */
export function snapObjectToTrack(object, trackMesh, yOffset = 0) {
  if (!object || !trackMesh) return;

  const y = getGroundYAt(trackMesh, object.position.x, object.position.z);
  object.position.y = y + yOffset;
}

/**
 * Calculates the tangent direction along a curve at a specific point
 * @param {THREE.Curve} curve - The curve to calculate tangent for
 * @param {number} t - Parameter along curve (0-1)
 * @returns {THREE.Vector3} Normalized tangent vector
 */
export function getCurveTangent(curve, t) {
  // Get a small delta to calculate tangent
  const delta = 0.0001;
  const t1 = Math.max(0, t - delta);
  const t2 = Math.min(1, t + delta);

  const pt1 = curve.getPointAt(t1);
  const pt2 = curve.getPointAt(t2);

  return new THREE.Vector3().subVectors(pt2, pt1).normalize();
}

/**
 * Calculates the rotation quaternion to align an object along a curve
 * @param {THREE.Curve} curve - The curve to align with
 * @param {number} t - Parameter along curve (0-1)
 * @param {THREE.Vector3} up - Up vector (default world up)
 * @returns {THREE.Quaternion} Rotation quaternion
 */
export function getAlignmentQuaternion(
  curve,
  t,
  up = new THREE.Vector3(0, 1, 0)
) {
  const tangent = getCurveTangent(curve, t);

  // Create a rotation that aligns the object's forward direction with the tangent
  const quaternion = new THREE.Quaternion();
  const forward = new THREE.Vector3(0, 0, 1); // Assuming object's forward is +Z

  // Calculate the rotation axis and angle
  const rotationAxis = new THREE.Vector3()
    .crossVectors(forward, tangent)
    .normalize();
  const angle = Math.acos(forward.dot(tangent));

  // Set the quaternion
  quaternion.setFromAxisAngle(rotationAxis, angle);

  return quaternion;
}

/**
 * Creates a smooth curve from a set of points
 * @param {Array<THREE.Vector3>} points - Array of points to create curve from
 * @param {boolean} closed - Whether the curve should be closed
 * @returns {THREE.CatmullRomCurve3} The created curve
 */
export function createSmoothCurve(points, closed = true) {
  return new THREE.CatmullRomCurve3(points, closed, "catmullrom");
}

/**
 * Resamples a curve to have evenly spaced points
 * @param {THREE.Curve} curve - The curve to resample
 * @param {number} numPoints - Number of points in the resampled curve
 * @returns {Array<THREE.Vector3>} Array of evenly spaced points
 */
export function resampleCurve(curve, numPoints) {
  return curve.getSpacedPoints(numPoints - 1);
}

/**
 * Calculates the total length of a curve
 * @param {THREE.Curve} curve - The curve to measure
 * @param {number} divisions - Number of divisions for length calculation
 * @returns {number} The approximate length of the curve
 */
export function getCurveLength(curve, divisions = 100) {
  const points = curve.getPoints(divisions);
  let length = 0;

  for (let i = 1; i < points.length; i++) {
    length += points[i].distanceTo(points[i - 1]);
  }

  return length;
}

/**
 * Creates a visual representation of a curve
 * @param {THREE.Curve} curve - The curve to visualize
 * @param {number} numPoints - Number of points to sample
 * @param {number} color - Line color
 * @returns {THREE.Line} Line object representing the curve
 */
export function createCurveLine(curve, numPoints = 500, color = 0xff0000) {
  const points = curve.getPoints(numPoints - 1);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color });
  return new THREE.Line(geometry, material);
}
