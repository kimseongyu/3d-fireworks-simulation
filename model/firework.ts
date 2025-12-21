import * as THREE from "three";
import { FireworkConfig, GRID_SIZE } from "./firework-config";

export class Firework {
  private static readonly PARTICLE_COUNT = 500;
  private static readonly EXPLOSION_HEIGHT = 15;

  // Geometry: 3D 객체의 형태(모양)를 정의합니다
  // PlaneGeometry: 평면 형태의 지오메트리 (너비, 높이)
  // static으로 선언하여 모든 인스턴스가 공유 (메모리 효율)
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
    // MeshBasicMaterial: 조명에 영향을 받지 않는 기본 재질
    // color: 0xffffff = 흰색 (16진수 색상 코드)
    const rocketMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Mesh: Geometry(형태) + Material(재질) = 화면에 보이는 3D 객체
    // Mesh는 Three.js에서 가장 기본적인 렌더링 가능한 객체입니다
    const rocket = new THREE.Mesh(Firework.ROCKET_GEOMETRY, rocketMaterial);

    const snappedX = this.snapToGrid(x);
    const snappedY = this.snapToGrid(y);

    // Mesh의 위치 설정 (x, y, z)
    rocket.position.set(snappedX, snappedY, z);

    // userData: Mesh 객체에 사용자 정의 데이터 저장
    // truePos는 부드러운 물리 계산을 위한 실제 위치입니다
    rocket.userData.truePos = { x: snappedX, y: snappedY };

    const velocity = {
      vx: (Math.random() - 0.5) * 0.1,
      vy: 0.5 + Math.random() * 0.2,
      vz: 0,
    };

    return { rocket, velocity };
  }

  public createExplosion(x: number, y: number, z: number) {
    // Float32Array: 고성능을 위한 타입화된 배열 (각 파티클의 속도 저장)
    // 각 파티클당 3개 값 (vx, vy, vz) * 파티클 개수
    const velocities = new Float32Array(Firework.PARTICLE_COUNT * 3);

    // Group: 여러 Mesh를 하나로 묶어서 관리하는 컨테이너
    // Group에 추가된 모든 객체는 함께 이동/회전/스케일링 가능
    const particleGroup = new THREE.Group();

    const snappedX = this.snapToGrid(x);
    const snappedY = this.snapToGrid(y);

    for (let i = 0; i < Firework.PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // 원형으로 퍼지는 각도 계산 (0 ~ 2π)
      const angle = (Math.PI * 2 * i) / Firework.PARTICLE_COUNT;
      const radius = Math.random() * 0.5 + 0.5;

      // 설정에서 정의된 속도 계산 함수 사용
      const velocity = this.config.getVelocity(angle, radius, i);
      velocities[i3] = velocity.vx; // X 방향 속도
      velocities[i3 + 1] = velocity.vy; // Y 방향 속도
      velocities[i3 + 2] = 0; // Z 방향 속도 (2D이므로 0)

      // 색상 변형 (파스텔 효과를 위한 랜덤 변형)
      const colorVariation = this.getColorVariation();

      // THREE.Color: RGB 색상 객체 (0.0 ~ 1.0 범위)
      const pixelColor = new THREE.Color(
        this.baseColor.r * colorVariation,
        this.baseColor.g * colorVariation,
        this.baseColor.b * colorVariation
      );

      // MeshBasicMaterial: 조명 없이도 보이는 기본 재질
      // transparent: true = 투명도 사용 가능
      // opacity: 1.0 = 완전 불투명 (초기값)
      const pixelMaterial = new THREE.MeshBasicMaterial({
        color: pixelColor,
        transparent: true,
        opacity: 1.0,
      });

      // 각 파티클을 Mesh로 생성
      const pixel = new THREE.Mesh(Firework.PIXEL_GEOMETRY, pixelMaterial);

      // 파티클의 초기 위치 설정
      pixel.position.set(snappedX, snappedY, z);

      // 물리 계산을 위한 실제 위치 저장
      pixel.userData.truePos = { x: snappedX, y: snappedY };
      // 초기 투명도 저장 (나중에 페이드아웃 계산에 사용)
      pixel.userData.initialOpacity = 1.0;

      // Group에 파티클 추가 (모든 파티클을 하나의 그룹으로 관리)
      particleGroup.add(pixel);
    }

    return { group: particleGroup, velocities };
  }
}
