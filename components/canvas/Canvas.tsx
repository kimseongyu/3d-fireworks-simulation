"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Firework } from "@/model/firework";
import { fireworkConfigs, FireworkType } from "@/model/firework-config";
import { useFireworkStore } from "@/store/useFireworkStore";
import {
  updateRockets as updateRocketsJs,
  updateParticles as updateParticlesJs,
  RocketItem,
} from "@/lib/three/animation-js";
import {
  updateRockets as updateRocketsWasm,
  updateParticles as updateParticlesWasm,
} from "@/lib/three/animation-wasm";
import { MARKER_GEOMETRY } from "@/lib/three/assets";
import { LaunchButton } from "./LaunchButton";
import { MAX_MARKERS } from "@/lib/three/constants";
import { TestModule } from "./TestModule";
import { CanvasType } from "@/app/page";
import * as wasm from "wasm-lib";

interface CanvasProps {
  selectedType: FireworkType;
  canvasType: CanvasType;
}

export const Canvas = ({ selectedType, canvasType }: CanvasProps) => {
  const { addFirework, savedFireworks } = useFireworkStore();
  const [launchTrigger, setLaunchTrigger] = useState(0);

  const handleLaunch = useCallback(() => {
    if (savedFireworks.length > 0) {
      setLaunchTrigger((prev) => prev + 1);
    }
  }, [savedFireworks.length]);

  const mountRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const statsRef = useRef<Stats | null>(null);

  const rocketsRef = useRef<RocketItem[]>([]);
  const particlesRef = useRef<THREE.InstancedMesh[]>([]);
  const markerMeshRef = useRef<THREE.InstancedMesh | null>(null);

  const selectedTypeRef = useRef(selectedType);
  useEffect(() => {
    selectedTypeRef.current = selectedType;
  }, [selectedType]);

  useEffect(() => {
    if (canvasType === "wasm") {
      wasm.default().then(() => {
        wasm.init();
      });
    }
  }, [canvasType]);

  useEffect(() => {
    if (!mountRef.current) return;

    const mountElement = mountRef.current;
    const width = mountElement.clientWidth;
    const height = mountElement.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(20, -40, 60);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    sceneRef.current = scene;

    // 2. Camera - Changed to PerspectiveCamera
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000);
    camera.position.set(0, -80, 40);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.cursor = "pointer";
    rendererRef.current = renderer;

    mountElement.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 20);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.update();

    // 5. Markers InstancedMesh
    const markerMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.3,
    });
    const markerMesh = new THREE.InstancedMesh(
      MARKER_GEOMETRY,
      markerMaterial,
      MAX_MARKERS
    );
    markerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    markerMesh.frustumCulled = false;
    scene.add(markerMesh);
    markerMeshRef.current = markerMesh;

    // 6. Event Handlers & Animation Loop
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current)
        return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;

      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    let mouseDownPos = { x: 0, y: 0 };
    const handleMouseDown = (event: MouseEvent) => {
      mouseDownPos = { x: event.clientX, y: event.clientY };
    };

    const handleClick = (event: MouseEvent) => {
      if (
        (event.target as HTMLElement).closest("button") ||
        (event.target as HTMLElement).closest("canvas") !== renderer.domElement
      )
        return;

      const dx = event.clientX - mouseDownPos.x;
      const dy = event.clientY - mouseDownPos.y;
      if (Math.hypot(dx, dy) > 5) return;

      if (!rendererRef.current?.domElement || !cameraRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(
        new THREE.Vector2(mouseX, mouseY),
        cameraRef.current
      );
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const target = new THREE.Vector3();
      const intersection = raycaster.ray.intersectPlane(plane, target);

      if (intersection) {
        addFirework(selectedTypeRef.current, target.x, target.y);
      }
    };

    const animate = () => {
      if (statsRef.current) statsRef.current.begin();

      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();

      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        if (canvasType === "wasm") {
          updateRocketsWasm(rocketsRef, particlesRef, sceneRef.current);
          updateParticlesWasm(particlesRef, sceneRef.current);
        } else {
          updateRocketsJs(rocketsRef, particlesRef, sceneRef.current);
          updateParticlesJs(particlesRef, sceneRef.current);
        }

        if (markerMeshRef.current) {
          const isSimulationActive =
            rocketsRef.current.length > 0 || particlesRef.current.length > 0;
          markerMeshRef.current.visible = !isSimulationActive;
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      if (statsRef.current) statsRef.current.end();
    };

    window.addEventListener("resize", handleResize);
    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    renderer.domElement.addEventListener("click", handleClick);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      renderer.domElement.removeEventListener("click", handleClick);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      controls.dispose();

      // Dispose Three.js objects
      if (sceneRef.current) {
        rocketsRef.current.forEach((item) => {
          sceneRef.current?.remove(item.rocket);
          if (item.rocket.material instanceof THREE.Material) {
            item.rocket.material.dispose();
          }
        });
        particlesRef.current.forEach((mesh) => {
          sceneRef.current?.remove(mesh);
          if (mesh.material instanceof THREE.Material) {
            mesh.material.dispose();
          }
        });
        if (markerMeshRef.current) {
          sceneRef.current.remove(markerMeshRef.current);
        }
      }
      rocketsRef.current = [];
      particlesRef.current = [];

      if (mountElement?.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
      markerMaterial.dispose();
    };
  }, [addFirework, canvasType]);

  useEffect(() => {
    if (launchTrigger > 0 && sceneRef.current) {
      const scene = sceneRef.current;
      const fireworksToLaunch = useFireworkStore.getState().savedFireworks;

      if (fireworksToLaunch.length > 0) {
        fireworksToLaunch.forEach((firework) => {
          const fireworkModel = new Firework(fireworkConfigs[firework.type]);
          const { rocket, velocity } = fireworkModel.createRocket(
            firework.x,
            firework.y,
            0
          );
          rocket.userData.launchY = firework.y;
          scene.add(rocket);
          rocketsRef.current.push({
            rocket,
            velocity,
            type: firework.type,
            launchY: firework.y,
          });
        });
      }
    }
  }, [launchTrigger]);

  useEffect(() => {
    const markerMesh = markerMeshRef.current;
    if (!markerMesh) return;

    const dummy = new THREE.Object3D();
    savedFireworks.forEach((firework, i) => {
      if (i >= MAX_MARKERS) return;

      const config = fireworkConfigs[firework.type];
      if (config) {
        markerMesh.setColorAt(i, config.baseColor);
      }

      dummy.position.set(firework.x, firework.y, 0.3);
      dummy.updateMatrix();
      markerMesh.setMatrixAt(i, dummy.matrix);
    });

    markerMesh.count = savedFireworks.length;
    markerMesh.instanceMatrix.needsUpdate = true;
    if (markerMesh.instanceColor) {
      markerMesh.instanceColor.needsUpdate = true;
    }
  }, [savedFireworks, canvasType]);

  return (
    <div className="h-full w-full relative bg-black overflow-hidden">
      <div ref={mountRef} className="h-full w-full" />

      <div className="absolute top-4 left-4 text-white text-sm pointer-events-none select-none z-10">
        화면을 클릭하여 불꽃놀이 위치 저장 (
        {fireworkConfigs[selectedType]?.name || selectedType})
      </div>

      <TestModule mountRef={mountRef} statsRef={statsRef} />

      {savedFireworks.length > 0 && (
        <LaunchButton count={savedFireworks.length} onLaunch={handleLaunch} />
      )}
    </div>
  );
};
