import * as CANNON from "cannon-es";
import { physicsConfig } from "./config.js";

export function createPhysicsWorld() {
  const world = new CANNON.World();
  world.gravity.set(
    physicsConfig.gravity.x,
    physicsConfig.gravity.y,
    physicsConfig.gravity.z
  );
  return world;
}

export function createGroundPlane(world) {
  const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
    material: new CANNON.Material({ friction: physicsConfig.groundFriction }),
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);
  return groundBody;
}

export function createCarBody(position) {
  const carBody = new CANNON.Body({
    mass: physicsConfig.carMass,
    position: new CANNON.Vec3(position.x, position.y, position.z),
    shape: new CANNON.Box(new CANNON.Vec3(2, 0.5, 4)), // Approximate car dimensions
  });
  return carBody;
}
