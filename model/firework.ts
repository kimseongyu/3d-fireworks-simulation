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
    rocket.userData.truePos = { x: snappedX, y: snappedY };

    const velocity = {
      vx: (Math.random() - 0.5) * 0.1,
      vy: 0.5 + Math.random() * 0.2,
      vz: 0,
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

    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);

    const truePositions = new Float32Array(Firework.PARTICLE_COUNT * 2);
    const dummy = new THREE.Object3D();
    dummy.position.set(snappedX, snappedY, z);
    dummy.updateMatrix();

    for (let i = 0; i < Firework.PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const i2 = i * 2;
      const angle = (Math.PI * 2 * i) / Firework.PARTICLE_COUNT;
      const radius = Math.random() * 0.5 + 0.5;

      const velocity = this.config.getVelocity(angle, radius, i);
      velocities[i3] = velocity.vx;
      velocities[i3 + 1] = velocity.vy;
      velocities[i3 + 2] = 0;

      const colorVariation = getColorVariation();
      const pixelColor = new THREE.Color(
        this.baseColor.r * colorVariation,
        this.baseColor.g * colorVariation,
        this.baseColor.b * colorVariation
      );

      instancedMesh.setColorAt(i, pixelColor);
      instancedMesh.setMatrixAt(i, dummy.matrix);

      truePositions[i2] = snappedX;
      truePositions[i2 + 1] = snappedY;
    }
    instancedMesh.instanceColor!.needsUpdate = true;

    instancedMesh.userData.velocities = velocities;
    instancedMesh.userData.truePos = truePositions;
    instancedMesh.userData.alpha = 1.0;

    return { group: instancedMesh };
  }

  public createExplosionWasm(x: number, y: number, z: number) {
    const wasmType = Object.keys(fireworkConfigs).indexOf(this.config.name);

    const velocities = wasm.calculate_explosion_velocities(
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

    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);

    const truePositions = new Float32Array(Firework.PARTICLE_COUNT * 2);
    const dummy = new THREE.Object3D();
    dummy.position.set(snappedX, snappedY, z);
    dummy.updateMatrix();

    for (let i = 0; i < Firework.PARTICLE_COUNT; i++) {
      const i2 = i * 2;

      const colorVariation = getColorVariation();
      const pixelColor = new THREE.Color(
        this.baseColor.r * colorVariation,
        this.baseColor.g * colorVariation,
        this.baseColor.b * colorVariation
      );

      instancedMesh.setColorAt(i, pixelColor);
      instancedMesh.setMatrixAt(i, dummy.matrix);

      truePositions[i2] = snappedX;
      truePositions[i2 + 1] = snappedY;
    }
    instancedMesh.instanceColor!.needsUpdate = true;

    instancedMesh.userData.velocities = velocities;
    instancedMesh.userData.truePos = truePositions;
    instancedMesh.userData.alpha = 1.0;

    return { group: instancedMesh };
  }
}
