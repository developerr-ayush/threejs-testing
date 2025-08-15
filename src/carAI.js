import * as THREE from "three";
import * as CANNON from "cannon-es";

/**
 * Updates the state of all AI cars to follow a predefined race path.
 * Supports per-car path overrides when provided.
 *
 * @param {THREE.Object3D[]} carObjects
 * @param {(CANNON.Body|null)[]} carBodies
 * @param {{progress:number,speed:number,done?:boolean}[]} carAIStates
 * @param {THREE.CatmullRomCurve3} defaultRacePath
 * @param {THREE.Line} defaultRacePathLine
 * @param {number} delta
 * @param {{curve:THREE.CatmullRomCurve3,line:THREE.Line}[]=} perCarPaths
 */
export function updateCarAI(
  carObjects,
  carBodies,
  carAIStates,
  defaultRacePath,
  defaultRacePathLine,
  delta,
  perCarPaths
) {
  if (
    !carObjects ||
    !carBodies ||
    !carAIStates ||
    !defaultRacePath ||
    !defaultRacePathLine
  ) {
    console.error("updateCarAI: Missing required arguments.");
    return;
  }

  // Ensure default line matrix is up to date
  defaultRacePathLine.updateMatrixWorld();

  for (let i = 0; i < carObjects.length; i++) {
    const car = carObjects[i];
    const state = carAIStates[i];
    if (!car || !state) continue;

    // Pick path for this car
    const usePath =
      perCarPaths &&
      perCarPaths[i] &&
      perCarPaths[i].curve &&
      perCarPaths[i].line
        ? perCarPaths[i]
        : { curve: defaultRacePath, line: defaultRacePathLine };

    // Ensure matrices are current
    usePath.line.updateMatrixWorld();
    const pathWorldQuat = new THREE.Quaternion();
    usePath.line.getWorldQuaternion(pathWorldQuat);

    if (state.done) {
      // Already finished: hold final pose
      const last = usePath.curve.getPoint(1);
      const lastPos = last.clone().applyMatrix4(usePath.line.matrixWorld);
      car.position.copy(lastPos);
      const prev = usePath.curve.getPoint(0.999);
      const tangent = last.clone().sub(prev).normalize();
      const worldTangent = tangent.applyQuaternion(pathWorldQuat);
      car.lookAt(new THREE.Vector3().copy(lastPos).add(worldTangent));
      const body = carBodies[i];
      if (body) {
        body.position.copy(lastPos);
        body.quaternion.copy(car.quaternion);
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
      }
      continue;
    }

    const speed = typeof state.speed === "number" ? state.speed : 0;
    let nextProgress = state.progress + speed * delta;

    const isClosed = !!usePath.curve.closed;
    if (!isClosed && nextProgress >= 1) {
      nextProgress = 1;
      state.progress = nextProgress;
      state.done = true;
    } else {
      state.progress = isClosed ? nextProgress % 1 : nextProgress;
    }

    const t = state.progress;
    const localPos = usePath.curve.getPoint(t);
    const tangent = usePath.curve.getTangent(Math.max(0, t - 1e-3)).normalize();

    const newPos = localPos.clone().applyMatrix4(usePath.line.matrixWorld);
    const worldTangent = tangent.clone().applyQuaternion(pathWorldQuat);
    const lookAtPosition = new THREE.Vector3().copy(newPos).add(worldTangent);

    car.position.copy(newPos);
    car.lookAt(lookAtPosition);

    const body = carBodies[i];
    if (body) {
      body.position.copy(newPos);
      body.quaternion.copy(car.quaternion);
      if (state.done) {
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
      }
    }
  }
}
