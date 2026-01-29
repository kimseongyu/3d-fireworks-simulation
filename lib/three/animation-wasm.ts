import * as THREE from "three";
import { Firework } from "@/model/firework";
import { fireworkConfigs } from "@/model/firework-config";
import { ALPHA_DECAY, ALPHA_THRESHOLD } from "./constants";
import { RocketItem } from "./animation-js";
import * as wasm from "wasm-lib";

const dummy = new THREE.Object3D();

export const updateRockets = (
  rocketsRef: { current: RocketItem[] },
  particlesRef: { current: THREE.InstancedMesh[] },
  scene: THREE.Scene,
  delta: number,
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

  const results = wasm.update_rocket_positions(
    truePositions,
    velocities,
    rocketCount,
    delta,
  );

  for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
    const item = rocketsRef.current[i];
    const i6 = i * 6;

    item.rocket.userData.truePos.x = results[i6];
    item.rocket.userData.truePos.y = results[i6 + 1];
    item.rocket.userData.truePos.z = results[i6 + 2];

    item.rocket.position.x = results[i6 + 3];
    item.rocket.position.y = results[i6 + 4];
    item.rocket.position.z = results[i6 + 5];

    const targetHeight = Firework.EXPLOSION_HEIGHT;

    if (item.rocket.userData.truePos.z >= targetHeight) {
      const fireworkModel = new Firework(fireworkConfigs[item.type]);
      const { group } = fireworkModel.createExplosionWasm(
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
    const particleCount = mesh.count;

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

    const results = wasm.update_particles(
      velocities,
      truePositions,
      particleCount,
      delta,
    );

    for (let j = 0; j < particleCount; j++) {
      const j6 = j * 6;
      const j3 = j * 3;

      velocities[j3] = results[j6];
      velocities[j3 + 1] = results[j6 + 1];
      velocities[j3 + 2] = results[j6 + 2];

      truePositions[j3] = results[j6 + 3];
      truePositions[j3 + 1] = results[j6 + 4];
      truePositions[j3 + 2] = results[j6 + 5];
    }

    const snappedPositions = wasm.snap_particle_positions(
      truePositions,
      particleCount,
    );

    for (let j = 0; j < particleCount; j++) {
      const j3 = j * 3;
      const snappedX = snappedPositions[j3];
      const snappedY = snappedPositions[j3 + 1];
      const snappedZ = snappedPositions[j3 + 2];

      dummy.position.set(snappedX, snappedY, snappedZ);
      dummy.updateMatrix();
      mesh.setMatrixAt(j, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }
};
