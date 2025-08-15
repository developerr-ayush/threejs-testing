import * as CANNON from "cannon-es";
import { keyboardControls } from "./config.js";

export const keyState = {};

export function initializeKeyboardControls() {
  window.addEventListener("keydown", (e) => {
    keyState[e.key.toLowerCase()] = true;
  });
  window.addEventListener("keyup", (e) => {
    keyState[e.key.toLowerCase()] = false;
  });
}

let lastLogTime = 0;

export function updateCarControls(carBody, delta, onDebug) {
  const forward = !!keyState[keyboardControls.forward];
  const backward = !!keyState[keyboardControls.backward];
  const left = !!keyState[keyboardControls.left];
  const right = !!keyState[keyboardControls.right];
  const yawLeft = !!keyState[keyboardControls.yawLeft];
  const yawRight = !!keyState[keyboardControls.yawRight];

  // Translate forward/backward using local force relative to current orientation
  if (forward) {
    carBody.applyLocalForce(
      new CANNON.Vec3(0, 0, keyboardControls.force),
      new CANNON.Vec3(0, 0, 0)
    );
  }
  if (backward) {
    carBody.applyLocalForce(
      new CANNON.Vec3(0, 0, -keyboardControls.force),
      new CANNON.Vec3(0, 0, 0)
    );
  }

  // Steer by applying a yaw rotation quaternion (Q/E)
  const yawAmount = keyboardControls.turnSpeed * (delta || 0.016);
  if (yawLeft) {
    const q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), yawAmount);
    carBody.quaternion.mult(q, carBody.quaternion);
  }
  if (yawRight) {
    const q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -yawAmount);
    carBody.quaternion.mult(q, carBody.quaternion);
  }

  // Strafe left/right (A/D) using local force to the side
  if (left) {
    carBody.applyLocalForce(
      new CANNON.Vec3(-keyboardControls.force, 0, 0),
      new CANNON.Vec3(0, 0, 0)
    );
  }
  if (right) {
    carBody.applyLocalForce(
      new CANNON.Vec3(keyboardControls.force, 0, 0),
      new CANNON.Vec3(0, 0, 0)
    );
  }

  // Throttled debug logging while actively moving/steering
  const isActivelyControlling = forward || backward || left || right;
  const now = performance.now();
  if (isActivelyControlling && now - lastLogTime > 100) {
    lastLogTime = now;
    if (onDebug) onDebug(carBody.position, carBody.velocity);
  }
}
