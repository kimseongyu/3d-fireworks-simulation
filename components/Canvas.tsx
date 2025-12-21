"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Firework } from "@/model/firework";
import {
  fireworkConfigs,
  FireworkType,
  GRID_SIZE,
} from "@/model/firework-config";

interface CanvasProps {
  selectedType: FireworkType;
}

const VIEW_SIZE = 30;
const INITIAL_Y = -15;
const GRAVITY = 0.05;
const ALPHA_DECAY = 0.96;
const ALPHA_THRESHOLD = 0.05;

interface RocketItem {
  rocket: THREE.Mesh;
  velocity: { vx: number; vy: number; vz: number };
  type: FireworkType;
}

/**
 * Three.js Scene 생성
 * Scene은 3D 공간의 컨테이너로, 모든 3D 객체(Mesh, Light, Camera 등)를 담는 공간입니다.
 */
const createScene = (): THREE.Scene => {
  // Scene 생성: 모든 3D 객체를 담는 컨테이너
  const scene = new THREE.Scene();

  // DirectionalLight: 태양광처럼 한 방향에서 오는 평행한 빛
  // 파라미터: (색상(0xffffff = 흰색), 강도(1.0))
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  // 조명의 위치 설정 (x, y, z)
  directionalLight.position.set(10, 20, 10);
  // Scene에 조명 추가 (조명이 없으면 아무것도 보이지 않음)
  scene.add(directionalLight);
  return scene;
};

/**
 * OrthographicCamera 생성
 * OrthographicCamera는 원근감이 없는 평행 투영 카메라입니다.
 * 멀리 있는 객체와 가까이 있는 객체가 같은 크기로 보입니다 (2D 게임 스타일).
 */
const createCamera = (
  width: number,
  height: number
): THREE.OrthographicCamera => {
  const aspect = width / height; // 화면 비율

  // OrthographicCamera 생성
  // 파라미터: (left, right, top, bottom, near, far)
  // - left/right: 카메라가 볼 수 있는 좌우 범위
  // - top/bottom: 카메라가 볼 수 있는 상하 범위
  // - near: 카메라로부터 가장 가까운 렌더링 거리
  // - far: 카메라로부터 가장 먼 렌더링 거리
  const camera = new THREE.OrthographicCamera(
    -VIEW_SIZE * aspect, // 왼쪽 경계
    VIEW_SIZE * aspect, // 오른쪽 경계
    VIEW_SIZE, // 위쪽 경계
    -VIEW_SIZE, // 아래쪽 경계
    0.1, // near plane (너무 가까운 객체는 렌더링 안 함)
    1000 // far plane (너무 먼 객체는 렌더링 안 함)
  );

  // 카메라 위치 설정 (x, y, z)
  camera.position.set(0, 0, 50);
  // 카메라가 바라볼 지점 설정 (원점을 바라봄)
  camera.lookAt(0, 0, 0);
  return camera;
};

/**
 * WebGLRenderer 생성
 * Renderer는 Scene과 Camera를 사용하여 실제로 화면에 그려주는 역할을 합니다.
 * WebGL을 사용하여 GPU 가속 렌더링을 수행합니다.
 */
const createRenderer = (width: number, height: number): THREE.WebGLRenderer => {
  // WebGLRenderer 생성
  // - antialias: true = 안티앨리어싱 활성화 (부드러운 가장자리)
  // - alpha: true = 투명 배경 허용
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  // 렌더링 크기 설정 (픽셀 단위)
  renderer.setSize(width, height);

  // 픽셀 비율 설정 (고해상도 디스플레이 대응)
  // 예: Retina 디스플레이는 devicePixelRatio = 2
  renderer.setPixelRatio(window.devicePixelRatio);

  // 배경색 설정 (색상, 투명도)
  // 0x000000 = 검은색, 0 = 완전 투명
  renderer.setClearColor(0x000000, 0);

  // renderer.domElement는 <canvas> 요소입니다
  // CSS로 크기와 커서 스타일 설정
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.cursor = "pointer";
  return renderer;
};

/**
 * 화면 크기 변경 시 카메라 업데이트
 * 화면 비율이 바뀌면 카메라의 시야 범위도 조정해야 합니다.
 */
const updateCameraOnResize = (
  camera: THREE.OrthographicCamera,
  width: number,
  height: number
) => {
  const aspect = width / height; // 새로운 화면 비율

  // 카메라의 시야 범위를 새로운 비율에 맞게 조정
  camera.left = -VIEW_SIZE * aspect;
  camera.right = VIEW_SIZE * aspect;
  camera.top = VIEW_SIZE;
  camera.bottom = -VIEW_SIZE;

  // 투영 행렬 업데이트 (변경사항 적용)
  camera.updateProjectionMatrix();
};

const updateRockets = (
  rocketsRef: { current: RocketItem[] },
  particlesRef: { current: THREE.Group[] },
  scene: THREE.Scene
) => {
  // 모든 로켓을 순회하며 각 프레임마다 위치 업데이트
  for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
    const item = rocketsRef.current[i];

    // ============================================
    // [시간별 위치 추적]
    // ============================================
    // 매 프레임마다(약 16.67ms마다) 실행되므로:
    // - velocity.vx만큼 x축으로 이동
    // - velocity.vy만큼 y축으로 이동
    // - velocity.vz만큼 z축으로 이동
    //
    // 예시: velocity.vy = 0.6이면
    // - 프레임 1: y = 0 + 0.6 = 0.6
    // - 프레임 2: y = 0.6 + 0.6 = 1.2
    // - 프레임 3: y = 1.2 + 0.6 = 1.8
    // ... 계속 위로 이동
    //
    // userData는 Three.js 객체에 사용자 정의 데이터를 저장할 수 있는 공간입니다
    // truePos: 부드러운 물리 계산을 위한 실제 위치 (소수점 포함)
    item.rocket.userData.truePos.x += item.velocity.vx;
    item.rocket.userData.truePos.y += item.velocity.vy;
    item.rocket.userData.truePos.z += item.velocity.vz;

    // 렌더링 위치 스냅 (픽셀 아트 스타일을 위한 격자 정렬)
    // position은 Three.js Mesh의 실제 렌더링 위치입니다
    // GRID_SIZE 단위로 반올림하여 격자에 맞춤
    // (truePos는 부드러운 계산용, position은 실제 화면 표시용)
    item.rocket.position.x =
      Math.round(item.rocket.userData.truePos.x / GRID_SIZE) * GRID_SIZE;
    item.rocket.position.y =
      Math.round(item.rocket.userData.truePos.y / GRID_SIZE) * GRID_SIZE;
    item.rocket.position.z = 0;

    const fireworkModel = new Firework(fireworkConfigs[item.type]);

    // 폭발 조건 체크
    if (item.rocket.userData.truePos.y >= fireworkModel.explosionHeight) {
      const { group, velocities } = fireworkModel.createExplosion(
        item.rocket.position.x,
        item.rocket.position.y,
        0
      );

      // Group에 속도 배열과 투명도 저장
      // Group은 여러 Mesh를 하나로 묶어서 관리할 수 있는 컨테이너입니다
      group.userData.velocities = velocities;
      group.userData.alpha = 1.0;

      // Scene에 Group 추가 (화면에 표시되도록)
      scene.add(group);
      particlesRef.current.push(group);

      // 로켓 정리 (메모리 해제)
      // Scene에서 제거
      scene.remove(item.rocket);

      // Geometry와 Material을 dispose()하여 메모리 해제
      // Three.js는 WebGL 리소스를 사용하므로 명시적으로 해제해야 합니다
      item.rocket.geometry.dispose();
      if (item.rocket.material instanceof THREE.Material) {
        item.rocket.material.dispose();
      }
      rocketsRef.current.splice(i, 1);
    }
  }
};

const updateParticles = (
  particlesRef: { current: THREE.Group[] },
  scene: THREE.Scene
) => {
  // 모든 파티클 그룹을 순회
  for (let i = particlesRef.current.length - 1; i >= 0; i--) {
    const group = particlesRef.current[i];
    // Float32Array: 각 파티클의 속도를 저장한 배열
    // [vx0, vy0, vz0, vx1, vy1, vz1, ...] 형태
    const velocities = group.userData.velocities as Float32Array;

    // 투명도 감소 (페이드아웃 효과)
    // 매 프레임마다 ALPHA_DECAY(0.96)만큼 곱하여 점점 투명해짐
    const alpha = group.userData.alpha || 1.0;
    group.userData.alpha = alpha * ALPHA_DECAY;

    // Group의 자식 요소들 (각 파티클 Mesh)
    // Group.children은 배열로, Group에 추가된 모든 객체를 포함합니다
    const children = group.children as THREE.Mesh[];
    children.forEach((mesh, idx) => {
      const vIdx = idx * 3; // velocities 배열에서의 인덱스 (파티클당 3개 값)
      if (vIdx + 2 < velocities.length) {
        // ============================================
        // [시간별 속도 및 위치 추적]
        // ============================================
        // 매 프레임마다:
        // 1. 중력 적용: Y 속도 감소 (아래로 떨어지도록)
        //    velocities[vIdx + 1] -= GRAVITY (0.05)
        //    예: 프레임 1: vy = 2.0, 프레임 2: vy = 1.95, 프레임 3: vy = 1.90 ...
        //
        // 2. 위치 업데이트: 속도만큼 이동
        //    truePos.x += velocities[vIdx] (vx)
        //    truePos.y += velocities[vIdx + 1] (vy)
        //    예: vx = 0.5, vy = 2.0이면
        //        프레임 1: (0, 0) → 프레임 2: (0.5, 2.0) → 프레임 3: (1.0, 3.95) ...
        //
        velocities[vIdx + 1] -= GRAVITY; // 중력 적용 (Y 속도 감소)

        // 물리 위치 업데이트
        mesh.userData.truePos.x += velocities[vIdx]; // X 방향 이동
        mesh.userData.truePos.y += velocities[vIdx + 1]; // Y 방향 이동

        // 렌더링 위치 스냅
        mesh.position.x =
          Math.round(mesh.userData.truePos.x / GRID_SIZE) * GRID_SIZE;
        mesh.position.y =
          Math.round(mesh.userData.truePos.y / GRID_SIZE) * GRID_SIZE;
        mesh.position.z = 0;

        // 투명도 업데이트
        // Material은 Mesh의 외관(색상, 질감, 투명도 등)을 정의합니다
        const mat = mesh.material as THREE.Material;
        if (mat) {
          mat.transparent = true; // 투명도 활성화
          // opacity: 0.0 (완전 투명) ~ 1.0 (완전 불투명)
          mat.opacity =
            (mesh.userData.initialOpacity || 1.0) * group.userData.alpha;
        }
      }
    });

    // 파티클 제거
    if (group.userData.alpha < ALPHA_THRESHOLD) {
      scene.remove(group);
      children.forEach((mesh) => {
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
      });
      particlesRef.current.splice(i, 1);
    }
  }
};

/**
 * 로켓 리소스 해제
 * Three.js의 Geometry와 Material은 WebGL 리소스를 사용하므로
 * 사용 후 명시적으로 dispose()를 호출하여 메모리를 해제해야 합니다.
 * 해제하지 않으면 메모리 누수가 발생할 수 있습니다.
 */
const disposeRocket = (rocket: THREE.Mesh) => {
  // Geometry 리소스 해제
  rocket.geometry.dispose();
  // Material 리소스 해제
  if (rocket.material instanceof THREE.Material) {
    rocket.material.dispose();
  }
};

export const Canvas = ({ selectedType }: CanvasProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<THREE.Group[]>([]);
  const rocketsRef = useRef<RocketItem[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    // ============================================
    // [전체 렌더링 흐름]
    // ============================================
    //
    // 1. 초기화: Scene, Camera, Renderer 생성
    // 2. 애니메이션 루프 시작 (requestAnimationFrame)
    // 3. 매 프레임마다 (약 60fps):
    //    a) 로켓 위치 업데이트 (velocity만큼 이동)
    //    b) 파티클 위치 업데이트 (velocity + 중력 적용)
    //    c) Scene 렌더링 (화면에 그리기)
    // 4. 사용자 클릭 시 로켓 추가
    // 5. 로켓이 특정 높이 도달 시 파티클 생성
    // 6. 파티클이 투명해지면 제거
    //
    // [시간 추적 방식]
    // - 명시적인 시간 변수 없이, 프레임마다 실행되는 것이 "시간의 흐름"
    // - requestAnimationFrame이 약 16.67ms마다 호출 (60fps 기준)
    // - 각 객체는 velocity(속도)만큼 매 프레임 이동
    // - 이는 물리학의 "위치 = 속도 × 시간" 공식을 프레임 단위로 적용한 것
    //

    // 초기화
    rocketsRef.current = [];
    particlesRef.current = [];

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = createScene();
    const camera = createCamera(width, height);
    const renderer = createRenderer(width, height);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 리사이즈 핸들러
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      updateCameraOnResize(camera, w, h);
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ============================================
    // 애니메이션 루프: 시간별 추적 및 렌더링 과정
    // ============================================
    //
    // [시간 추적 방식]
    // - requestAnimationFrame은 브라우저의 리프레시 레이트(보통 60fps)에 맞춰 호출됩니다
    // - 즉, 약 16.67ms마다(1초에 60번) 이 함수가 실행됩니다
    // - 명시적인 시간 변수 없이도, 프레임마다 실행되는 것이 "시간의 흐름"을 의미합니다
    //
    // [렌더링 과정]
    // 1. 위치 업데이트: 각 객체의 위치를 속도(velocity)만큼 이동
    // 2. Scene 업데이트: Scene에 추가/제거된 객체 반영
    // 3. 렌더링: Scene을 Camera의 시점으로 그리기
    //
    const animate = () => {
      // 다음 프레임을 위해 다시 등록 (무한 루프)
      // 브라우저가 다음 화면 갱신 전에 이 함수를 다시 호출하도록 예약
      animationFrameRef.current = requestAnimationFrame(animate);

      // [1단계] 로켓 위치 업데이트
      // - 모든 로켓의 위치를 velocity만큼 이동
      // - 폭발 조건 체크 및 파티클 생성
      updateRockets(rocketsRef, particlesRef, scene);

      // [2단계] 파티클 위치 업데이트
      // - 모든 파티클의 위치를 velocity만큼 이동
      // - 중력 적용 및 투명도 감소
      // - 사라진 파티클 제거
      updateParticles(particlesRef, scene);

      // [3단계] 화면에 그리기
      // - Scene에 있는 모든 객체(Mesh, Group 등)를
      // - Camera의 시점으로 변환하여
      // - Canvas에 렌더링
      // 이 함수가 호출될 때마다 화면이 완전히 새로 그려집니다
      renderer.render(scene, camera);
    };
    animate(); // 애니메이션 시작 (무한 루프 시작)

    // 발사 로직
    const launchFirework = (type: FireworkType, x: number) => {
      const fireworkModel = new Firework(fireworkConfigs[type]);
      const { rocket, velocity } = fireworkModel.createRocket(x, INITIAL_Y, 0);
      scene.add(rocket);
      rocketsRef.current.push({ rocket, velocity, type });
    };

    // 클릭 핸들러
    // 마우스 클릭 위치를 3D 공간의 좌표로 변환
    const handleClick = (event: MouseEvent) => {
      if (!renderer.domElement || !camera) return;

      // Canvas 요소의 화면상 위치와 크기
      const rect = renderer.domElement.getBoundingClientRect();

      // 마우스 X 좌표를 -1 ~ 1 범위로 정규화 (NDC: Normalized Device Coordinates)
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;

      // NDC를 3D 공간의 실제 좌표로 변환
      // OrthographicCamera의 시야 범위를 사용하여 변환
      const worldX = mouseX * (camera.right - camera.left) * 0.5;
      launchFirework(selectedType, worldX);
    };

    renderer.domElement.addEventListener("click", handleClick);

    // Cleanup 함수: useEffect가 언마운트되거나 의존성이 변경될 때 실행
    const mountElement = mountRef.current;
    const domElement = renderer.domElement;

    return () => {
      // 이벤트 리스너 제거 (메모리 누수 방지)
      window.removeEventListener("resize", handleResize);
      domElement.removeEventListener("click", handleClick);

      // 애니메이션 프레임 취소 (무한 루프 중단)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // DOM에서 Canvas 요소 제거
      if (mountElement && mountElement.contains(domElement)) {
        mountElement.removeChild(domElement);
      }

      // Renderer 리소스 해제
      // WebGL 컨텍스트와 관련 리소스를 정리합니다
      renderer.dispose();

      // 남아있는 로켓들 정리
      rocketsRef.current.forEach((item) => {
        scene.remove(item.rocket); // Scene에서 제거
        disposeRocket(item.rocket); // Geometry/Material 메모리 해제
      });
    };
  }, [selectedType]);

  return (
    <div className="h-full w-full relative bg-black overflow-hidden">
      <div ref={mountRef} className="h-full w-full" />
      <div className="absolute top-4 left-4 text-white text-sm pointer-events-none select-none z-10">
        화면을 클릭하여 불꽃놀이 발사 (
        {fireworkConfigs[selectedType]?.name || selectedType})
      </div>
    </div>
  );
};
