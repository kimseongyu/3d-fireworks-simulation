import * as THREE from "three";
import { Firework } from "@/model/firework";
import { fireworkConfigs, FireworkType } from "@/model/firework-config";
import { GRAVITY, ALPHA_DECAY, ALPHA_THRESHOLD } from "./constants";
import { snapToGrid } from "@/lib/utils";

export interface RocketItem {
  rocket: THREE.Mesh;
  velocity: { vx: number; vy: number; vz: number };
  type: FireworkType;
  launchY: number;
}

const dummy = new THREE.Object3D();

export const updateRockets = (
  rocketsRef: { current: RocketItem[] },
  particlesRef: { current: THREE.InstancedMesh[] },
  scene: THREE.Scene,
  delta: number,
) => {
  for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
    const item = rocketsRef.current[i];

    item.rocket.userData.truePos.x += item.velocity.vx * delta;
    item.rocket.userData.truePos.y += item.velocity.vy * delta;
    item.rocket.userData.truePos.z += item.velocity.vz * delta;

    item.rocket.position.x = snapToGrid(item.rocket.userData.truePos.x);
    item.rocket.position.y = snapToGrid(item.rocket.userData.truePos.y);
    item.rocket.position.z = snapToGrid(item.rocket.userData.truePos.z);

    const targetHeight = Firework.EXPLOSION_HEIGHT;

    if (item.rocket.userData.truePos.z >= targetHeight) {
      const fireworkModel = new Firework(fireworkConfigs[item.type]);
      const { group } = fireworkModel.createExplosionJs(
        item.rocket.position.x,
        item.rocket.position.y,
        item.rocket.position.z,
      );

      scene.add(group);
      particlesRef.current.push(group);

      scene.remove(item.rocket);
      if (item.rocket.material instanceof THREE.Material) {
        item.rocket.material.dispose();
      }
      rocketsRef.current.splice(i, 1);
    }
  }
};

export const updateParticles = (
  particlesRef: { current: THREE.InstancedMesh[] },
  scene: THREE.Scene,
  delta: number,
) => {
  for (let i = particlesRef.current.length - 1; i >= 0; i--) {
    const mesh = particlesRef.current[i];
    const velocities = mesh.userData.velocities as Float32Array;
    const truePositions = mesh.userData.truePos as Float32Array;

    mesh.userData.alpha *= Math.pow(ALPHA_DECAY, delta);
    (mesh.material as THREE.MeshBasicMaterial).opacity = mesh.userData.alpha;

    if (mesh.userData.alpha < ALPHA_THRESHOLD) {
      scene.remove(mesh);
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
      particlesRef.current.splice(i, 1);
      continue;
    }

    for (let j = 0; j < mesh.count; j++) {
      const vIdx = j * 3;
      const pIdx = j * 3;

      velocities[vIdx + 2] -= GRAVITY * delta;

      truePositions[pIdx] += velocities[vIdx] * delta;
      truePositions[pIdx + 1] += velocities[vIdx + 1] * delta;
      truePositions[pIdx + 2] += velocities[vIdx + 2] * delta;

      const snappedX = snapToGrid(truePositions[pIdx]);
      const snappedY = snapToGrid(truePositions[pIdx + 1]);
      const snappedZ = snapToGrid(truePositions[pIdx + 2]);

      dummy.position.set(snappedX, snappedY, snappedZ);
      dummy.updateMatrix();
      mesh.setMatrixAt(j, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }
};
