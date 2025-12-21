import * as THREE from "three";
import { FireworkConfig, GRID_SIZE } from "./firework-config";

export class Firework {
  private static readonly PARTICLE_COUNT = 500;
  private static readonly EXPLOSION_HEIGHT = 15;
  private static readonly PIXEL_GEOMETRY = new THREE.PlaneGeometry(
    GRID_SIZE,
    GRID_SIZE
  );
  private static readonly ROCKET_GEOMETRY = new THREE.PlaneGeometry(
    GRID_SIZE,
    GRID_SIZE * 2
  );

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

  get explosionHeight(): number {
    return Firework.EXPLOSION_HEIGHT;
  }

  private getColorVariation(): number {
    return 0.7 + Math.random() * 0.3;
  }

  private snapToGrid(value: number): number {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  public createRocket(x: number, y: number, z: number) {
    const rocketMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const rocket = new THREE.Mesh(Firework.ROCKET_GEOMETRY, rocketMaterial);

    const snappedX = this.snapToGrid(x);
    const snappedY = this.snapToGrid(y);

    rocket.position.set(snappedX, snappedY, z);
    rocket.userData.truePos = { x: snappedX, y: snappedY };

    const velocity = {
      vx: (Math.random() - 0.5) * 0.1,
      vy: 0.5 + Math.random() * 0.2,
      vz: 0,
    };

    return { rocket, velocity };
  }

  public createExplosion(x: number, y: number, z: number) {
    const velocities = new Float32Array(Firework.PARTICLE_COUNT * 3);
    const particleGroup = new THREE.Group();

    const snappedX = this.snapToGrid(x);
    const snappedY = this.snapToGrid(y);

    for (let i = 0; i < Firework.PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const angle = (Math.PI * 2 * i) / Firework.PARTICLE_COUNT;
      const radius = Math.random() * 0.5 + 0.5;

      const velocity = this.config.getVelocity(angle, radius, i);
      velocities[i3] = velocity.vx;
      velocities[i3 + 1] = velocity.vy;
      velocities[i3 + 2] = 0;

      const colorVariation = this.getColorVariation();
      const pixelColor = new THREE.Color(
        this.baseColor.r * colorVariation,
        this.baseColor.g * colorVariation,
        this.baseColor.b * colorVariation
      );

      const pixelMaterial = new THREE.MeshBasicMaterial({
        color: pixelColor,
        transparent: true,
        opacity: 1.0,
      });

      const pixel = new THREE.Mesh(Firework.PIXEL_GEOMETRY, pixelMaterial);

      pixel.position.set(snappedX, snappedY, z);
      pixel.userData.truePos = { x: snappedX, y: snappedY };
      pixel.userData.initialOpacity = 1.0;

      particleGroup.add(pixel);
    }

    return { group: particleGroup, velocities };
  }
}
