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
  scene: THREE.Scene
) => {
  for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
    const item = rocketsRef.current[i];

    item.rocket.userData.truePos.x += item.velocity.vx;
    item.rocket.userData.truePos.y += item.velocity.vy;
    item.rocket.userData.truePos.z += item.velocity.vz;

    item.rocket.position.x = snapToGrid(item.rocket.userData.truePos.x);
    item.rocket.position.y = snapToGrid(item.rocket.userData.truePos.y);
    item.rocket.position.z = 0;

    const targetHeight = item.launchY + Firework.EXPLOSION_HEIGHT;

    if (item.rocket.userData.truePos.y >= targetHeight) {
      const fireworkModel = new Firework(fireworkConfigs[item.type]);
      const { group } = fireworkModel.createExplosion(
        item.rocket.position.x,
        item.rocket.position.y,
        0
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
  scene: THREE.Scene
) => {
  for (let i = particlesRef.current.length - 1; i >= 0; i--) {
    const mesh = particlesRef.current[i];
    const velocities = mesh.userData.velocities as Float32Array;
    const truePositions = mesh.userData.truePos as Float32Array;

    mesh.userData.alpha *= ALPHA_DECAY;
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
      const j3 = j * 3;
      const j2 = j * 2;

      velocities[j3 + 1] -= GRAVITY;

      truePositions[j2] += velocities[j3];
      truePositions[j2 + 1] += velocities[j3 + 1];

      const snappedX = snapToGrid(truePositions[j2]);
      const snappedY = snapToGrid(truePositions[j2 + 1]);

      dummy.position.set(snappedX, snappedY, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(j, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }
};
