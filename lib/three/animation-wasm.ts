import * as THREE from "three";
import { Firework } from "@/model/firework";
import { fireworkConfigs } from "@/model/firework-config";
import { ALPHA_DECAY, ALPHA_THRESHOLD } from "./constants";
import type { ParticleItem, ParticleSystemWasm, RocketItemWasm } from "./types";
import * as wasm from "wasm-lib";

const dummy = new THREE.Object3D();

export const updateRockets = (
  rocketsRef: { current: RocketItemWasm[] },
  particlesRef: { current: ParticleItem[] },
  scene: THREE.Scene,
  delta: number
) => {
  if (rocketsRef.current.length === 0) return;

  for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
    const item = rocketsRef.current[i];

    if (item.wasmId === undefined) {
      const truePos = new Float32Array([
        item.rocket.userData.truePos.x,
        item.rocket.userData.truePos.y,
        item.rocket.userData.truePos.z || 0,
      ]);
      const velocity = new Float32Array([
        item.velocity.vx,
        item.velocity.vy,
        item.velocity.vz,
      ]);
      item.wasmId = wasm.create_rocket(truePos, velocity);
    }

    const results = wasm.update_rocket(item.wasmId, delta);

    if (results.length === 6) {
      item.rocket.userData.truePos.x = results[0];
      item.rocket.userData.truePos.y = results[1];
      item.rocket.userData.truePos.z = results[2];

      item.rocket.position.x = results[3];
      item.rocket.position.y = results[4];
      item.rocket.position.z = results[5];
    }

    const targetHeight = Firework.EXPLOSION_HEIGHT;

    if (item.rocket.userData.truePos.z >= targetHeight) {
      const fireworkModel = new Firework(fireworkConfigs[item.type]);
      const { group } = fireworkModel.createExplosionWasm(
        item.rocket.position.x,
        item.rocket.position.y,
        item.rocket.position.z
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

  if (rocketsRef.current.length === 0) {
    wasm.clear_rockets();
  }
};

export const updateParticles = (
  particlesRef: { current: ParticleItem[] },
  scene: THREE.Scene,
  delta: number
) => {
  if (particlesRef.current.length === 0) return;

  for (let i = particlesRef.current.length - 1; i >= 0; i--) {
    const mesh: ParticleSystemWasm = particlesRef.current[i];
    const particleCount = mesh.count;

    if (mesh.userData.wasmId === undefined) {
      mesh.userData.wasmId = wasm.create_particle(
        mesh.userData.velocities,
        mesh.userData.truePos,
        particleCount
      );
    }

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

    const snappedPositions = wasm.update_particle(mesh.userData.wasmId, delta);

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

  if (particlesRef.current.length === 0) {
    wasm.clear_particles();
  }
};
