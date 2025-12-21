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

const createScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);
  return scene;
};

const createCamera = (
  width: number,
  height: number
): THREE.OrthographicCamera => {
  const aspect = width / height;
  const camera = new THREE.OrthographicCamera(
    -VIEW_SIZE * aspect,
    VIEW_SIZE * aspect,
    VIEW_SIZE,
    -VIEW_SIZE,
    0.1,
    1000
  );
  camera.position.set(0, 0, 50);
  camera.lookAt(0, 0, 0);
  return camera;
};

const createRenderer = (width: number, height: number): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.cursor = "pointer";
  return renderer;
};

const updateCameraOnResize = (
  camera: THREE.OrthographicCamera,
  width: number,
  height: number
) => {
  const aspect = width / height;
  camera.left = -VIEW_SIZE * aspect;
  camera.right = VIEW_SIZE * aspect;
  camera.top = VIEW_SIZE;
  camera.bottom = -VIEW_SIZE;
  camera.updateProjectionMatrix();
};

const updateRockets = (
  rocketsRef: { current: RocketItem[] },
  particlesRef: { current: THREE.Group[] },
  scene: THREE.Scene
) => {
  for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
    const item = rocketsRef.current[i];

    item.rocket.userData.truePos.x += item.velocity.vx;
    item.rocket.userData.truePos.y += item.velocity.vy;
    item.rocket.userData.truePos.z += item.velocity.vz;

    item.rocket.position.x =
      Math.round(item.rocket.userData.truePos.x / GRID_SIZE) * GRID_SIZE;
    item.rocket.position.y =
      Math.round(item.rocket.userData.truePos.y / GRID_SIZE) * GRID_SIZE;
    item.rocket.position.z = 0;

    const fireworkModel = new Firework(fireworkConfigs[item.type]);

    if (item.rocket.userData.truePos.y >= fireworkModel.explosionHeight) {
      const { group, velocities } = fireworkModel.createExplosion(
        item.rocket.position.x,
        item.rocket.position.y,
        0
      );

      group.userData.velocities = velocities;
      group.userData.alpha = 1.0;

      scene.add(group);
      particlesRef.current.push(group);

      scene.remove(item.rocket);
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
  for (let i = particlesRef.current.length - 1; i >= 0; i--) {
    const group = particlesRef.current[i];
    const velocities = group.userData.velocities as Float32Array;

    const alpha = group.userData.alpha || 1.0;
    group.userData.alpha = alpha * ALPHA_DECAY;

    const children = group.children as THREE.Mesh[];
    children.forEach((mesh, idx) => {
      const vIdx = idx * 3;
      if (vIdx + 2 < velocities.length) {
        velocities[vIdx + 1] -= GRAVITY;

        mesh.userData.truePos.x += velocities[vIdx];
        mesh.userData.truePos.y += velocities[vIdx + 1];

        mesh.position.x =
          Math.round(mesh.userData.truePos.x / GRID_SIZE) * GRID_SIZE;
        mesh.position.y =
          Math.round(mesh.userData.truePos.y / GRID_SIZE) * GRID_SIZE;
        mesh.position.z = 0;

        const mat = mesh.material as THREE.Material;
        if (mat) {
          mat.transparent = true;
          mat.opacity =
            (mesh.userData.initialOpacity || 1.0) * group.userData.alpha;
        }
      }
    });

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

const disposeRocket = (rocket: THREE.Mesh) => {
  rocket.geometry.dispose();
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

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      updateRockets(rocketsRef, particlesRef, scene);
      updateParticles(particlesRef, scene);
      renderer.render(scene, camera);
    };
    animate();

    const launchFirework = (type: FireworkType, x: number) => {
      const fireworkModel = new Firework(fireworkConfigs[type]);
      const { rocket, velocity } = fireworkModel.createRocket(x, INITIAL_Y, 0);
      scene.add(rocket);
      rocketsRef.current.push({ rocket, velocity, type });
    };

    const handleClick = (event: MouseEvent) => {
      if (!renderer.domElement || !camera) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const worldX = mouseX * (camera.right - camera.left) * 0.5;
      launchFirework(selectedType, worldX);
    };

    renderer.domElement.addEventListener("click", handleClick);

    const mountElement = mountRef.current;
    const domElement = renderer.domElement;

    return () => {
      window.removeEventListener("resize", handleResize);
      domElement.removeEventListener("click", handleClick);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (mountElement && mountElement.contains(domElement)) {
        mountElement.removeChild(domElement);
      }

      renderer.dispose();

      rocketsRef.current.forEach((item) => {
        scene.remove(item.rocket);
        disposeRocket(item.rocket);
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
