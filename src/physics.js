import * as CANNON from "cannon-es";
import * as THREE from "three";
import { physicsConfig } from "./config.js";
import { threeToCannon, ShapeType } from "three-to-cannon";

export function createPhysicsWorld() {
  const world = new CANNON.World();
  world.gravity.set(
    physicsConfig.gravity.x,
    physicsConfig.gravity.y,
    physicsConfig.gravity.z
  );
  // Improve stability with broadphase + solver tuning
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  world.solver.iterations = 15;
  world.solver.tolerance = 0.001;
  world.defaultContactMaterial.friction = physicsConfig.groundFriction;
  world.defaultContactMaterial.restitution = 0;
  return world;
}

export function createTrackBody(trackObject) {
  const { shape, offset, quaternion } = threeToCannon(trackObject, {
    type: ShapeType.MESH,
  });

  const trackBody = new CANNON.Body({
    mass: 0,
    material: new CANNON.Material({ friction: physicsConfig.groundFriction }),
  });
  // Add the mesh shape with any local offset/orientation provided
  const shapeOffset = offset
    ? new CANNON.Vec3(offset.x, offset.y, offset.z)
    : new CANNON.Vec3(0, 0, 0);
  const shapeQuat = quaternion
    ? new CANNON.Quaternion(
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
      )
    : new CANNON.Quaternion(0, 0, 0, 1);
  trackBody.addShape(shape, shapeOffset, shapeQuat);

  // Sync body transform with THREE object world transform
  const worldPos = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();
  trackObject.updateMatrixWorld(true);
  trackObject.getWorldPosition(worldPos);
  trackObject.getWorldQuaternion(worldQuat);
  trackBody.position.set(worldPos.x, worldPos.y, worldPos.z);
  trackBody.quaternion.set(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w);
  return trackBody;
}

export function createCarBody(position) {
  const carBody = new CANNON.Body({
    mass: physicsConfig.carMass,
    position: new CANNON.Vec3(position.x, position.y, position.z),
    shape: new CANNON.Box(
      new CANNON.Vec3(
        physicsConfig.carDimensions.x / 2,
        physicsConfig.carDimensions.y / 2,
        physicsConfig.carDimensions.z / 2
      )
    ),
  });
  carBody.linearDamping = physicsConfig.linearDamping;
  carBody.angularDamping = physicsConfig.angularDamping;
  return carBody;
}
