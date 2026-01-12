import * as THREE from "three";
import { FireworkConfig, fireworkConfigs } from "./firework-config";
import { PIXEL_GEOMETRY, ROCKET_GEOMETRY } from "@/lib/three/assets";
import { snapToGrid, getColorVariation } from "@/lib/utils";
import * as wasm from "wasm-lib";

export class Firework {
  private static readonly PARTICLE_COUNT = 500;
  public static readonly EXPLOSION_HEIGHT = 40;

  constructor(private readonly config: FireworkConfig) {}

  get name(): string {
    return this.config.name;
  }

  get description(): string {
    return this.config.description;
  }

  get baseColor(): THREE.Color {
    return this.config.baseColor;
  }

  public createRocket(x: number, y: number, z: number) {
    const rocketMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const rocket = new THREE.Mesh(ROCKET_GEOMETRY, rocketMaterial);

    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);

    rocket.position.set(snappedX, snappedY, z);
    rocket.userData.truePos = { x: snappedX, y: snappedY, z };
    rocket.frustumCulled = false;

    const velocity = {
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      vz: 0.5 + Math.random() * 0.2,
    };

    return { rocket, velocity };
  }

  public createExplosionJs(x: number, y: number, z: number) {
    const velocities = new Float32Array(Firework.PARTICLE_COUNT * 3);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 1.0,
    });

    const instancedMesh = new THREE.InstancedMesh(
      PIXEL_GEOMETRY,
      material,
      Firework.PARTICLE_COUNT
    );
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedMesh.frustumCulled = false;

    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);

    const truePositions = new Float32Array(Firework.PARTICLE_COUNT * 3);
    const dummy = new THREE.Object3D();
    dummy.position.set(snappedX, snappedY, z);
    dummy.updateMatrix();

    for (let i = 0; i < Firework.PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      const u = Math.random();
      const v = Math.random();
      const phi = Math.acos(2 * u - 1);
      const theta = 2 * Math.PI * v;

      const dirX = Math.sin(phi) * Math.cos(theta);
      const dirY = Math.sin(phi) * Math.sin(theta);
      const dirZ = Math.cos(phi);

      const dir = new THREE.Vector3(dirX, dirY, dirZ);
      const radius = Math.random() * 0.5 + 0.5;

      const velocity = this.config.getVelocity(dir, radius);
      velocities[i3] = velocity.vx;
      velocities[i3 + 1] = velocity.vy;
      velocities[i3 + 2] = velocity.vz;

      const colorVariation = getColorVariation();
      const pixelColor = new THREE.Color(
        this.baseColor.r * colorVariation,
        this.baseColor.g * colorVariation,
        this.baseColor.b * colorVariation
      );

      instancedMesh.setColorAt(i, pixelColor);
      instancedMesh.setMatrixAt(i, dummy.matrix);

      truePositions[i3] = snappedX;
      truePositions[i3 + 1] = snappedY;
      truePositions[i3 + 2] = z;
    }
    instancedMesh.instanceColor!.needsUpdate = true;

    instancedMesh.userData.velocities = velocities;
    instancedMesh.userData.truePos = truePositions;
    instancedMesh.userData.alpha = 1.0;

    return { group: instancedMesh };
  }

  public createExplosionWasm(x: number, y: number, z: number) {
    const wasmType = Object.keys(fireworkConfigs).indexOf(this.config.name);

    const wasmVelocities = wasm.calculate_explosion_velocities(
      wasmType,
      Firework.PARTICLE_COUNT
    );

    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 1.0,
    });

    const instancedMesh = new THREE.InstancedMesh(
      PIXEL_GEOMETRY,
      material,
      Firework.PARTICLE_COUNT
    );
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedMesh.frustumCulled = false;

    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);

    const truePositions = new Float32Array(Firework.PARTICLE_COUNT * 3);
    const dummy = new THREE.Object3D();
    dummy.position.set(snappedX, snappedY, z);
    dummy.updateMatrix();

    for (let i = 0; i < Firework.PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      const colorVariation = getColorVariation();
      const pixelColor = new THREE.Color(
        this.baseColor.r * colorVariation,
        this.baseColor.g * colorVariation,
        this.baseColor.b * colorVariation
      );

      instancedMesh.setColorAt(i, pixelColor);
      instancedMesh.setMatrixAt(i, dummy.matrix);

      truePositions[i3] = snappedX;
      truePositions[i3 + 1] = snappedY;
      truePositions[i3 + 2] = z;
    }
    instancedMesh.instanceColor!.needsUpdate = true;

    instancedMesh.userData.velocities = wasmVelocities;
    instancedMesh.userData.truePos = truePositions;
    instancedMesh.userData.alpha = 1.0;

    return { group: instancedMesh };
  }
}
