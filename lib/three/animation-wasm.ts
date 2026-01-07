import * as THREE from "three";
import { Firework } from "@/model/firework";
import { fireworkConfigs } from "@/model/firework-config";
import { ALPHA_THRESHOLD } from "./constants";
import { RocketItem } from "./animation-js";
import * as wasm from "wasm-lib";

const dummy = new THREE.Object3D();

export const updateRockets = (
  rocketsRef: { current: RocketItem[] },
  particlesRef: { current: THREE.InstancedMesh[] },
  scene: THREE.Scene
) => {
  if (rocketsRef.current.length === 0) return;

  const rocketCount = rocketsRef.current.length;
  const truePositions = new Float32Array(rocketCount * 3);
  const velocities = new Float32Array(rocketCount * 3);

  for (let i = 0; i < rocketCount; i++) {
    const item = rocketsRef.current[i];
    const i3 = i * 3;

    truePositions[i3] = item.rocket.userData.truePos.x;
    truePositions[i3 + 1] = item.rocket.userData.truePos.y;
    truePositions[i3 + 2] = item.rocket.userData.truePos.z || 0;

    velocities[i3] = item.velocity.vx;
    velocities[i3 + 1] = item.velocity.vy;
    velocities[i3 + 2] = item.velocity.vz;
  }

  const snappedPositions = wasm.update_rocket_positions(
    truePositions,
    velocities,
    rocketCount
  );

  for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
    const item = rocketsRef.current[i];
    const i3 = i * 3;

    item.rocket.userData.truePos.x = truePositions[i3];
    item.rocket.userData.truePos.y = truePositions[i3 + 1];
    item.rocket.userData.truePos.z = truePositions[i3 + 2];

    item.rocket.position.x = snappedPositions[i3];
    item.rocket.position.y = snappedPositions[i3 + 1];
    item.rocket.position.z = snappedPositions[i3 + 2];

    const targetHeight = item.launchY + Firework.EXPLOSION_HEIGHT;
    if (item.rocket.userData.truePos.y >= targetHeight) {
      const fireworkModel = new Firework(fireworkConfigs[item.type]);
      const { group } = fireworkModel.createExplosionWasm(
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
    const particleCount = mesh.count;

    const newAlpha = wasm.update_particles(
      velocities,
      truePositions,
      mesh.userData.alpha,
      particleCount
    );

    mesh.userData.alpha = newAlpha;
    (mesh.material as THREE.MeshBasicMaterial).opacity = newAlpha;

    if (newAlpha < ALPHA_THRESHOLD) {
      scene.remove(mesh);
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
      particlesRef.current.splice(i, 1);
      continue;
    }

    const snappedPositions = wasm.snap_particle_positions(
      truePositions,
      particleCount
    );

    for (let j = 0; j < particleCount; j++) {
      const j2 = j * 2;
      const snappedX = snappedPositions[j2];
      const snappedY = snappedPositions[j2 + 1];

      dummy.position.set(snappedX, snappedY, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(j, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }
};
