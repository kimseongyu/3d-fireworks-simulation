import * as THREE from "three";
import type { FireworkType } from "@/model/firework-config";

export interface RocketItem {
  rocket: THREE.Mesh;
  velocity: { vx: number; vy: number; vz: number };
  type: FireworkType;
  launchY: number;
}

export interface RocketItemWasm extends RocketItem {
  wasmId?: number;
}

export interface ParticleItem extends THREE.InstancedMesh {
  userData: {
    velocities: Float32Array;
    truePos: Float32Array;
    alpha: number;
  };
}

export interface ParticleSystemWasm extends ParticleItem {
  userData: ParticleItem["userData"] & { wasmId?: number };
}
