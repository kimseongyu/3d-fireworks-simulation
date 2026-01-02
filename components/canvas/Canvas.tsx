"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { Firework } from "@/model/firework";
import { fireworkConfigs, FireworkType } from "@/model/firework-config";
import { useFireworkStore } from "@/store/useFireworkStore";
import { VIEW_SIZE } from "@/lib/three/constants";
import {
  updateRockets,
  updateParticles,
  RocketItem,
} from "@/lib/three/animation";
import { MARKER_GEOMETRY } from "@/lib/three/assets";
import { LaunchButton } from "./LaunchButton";
import { MAX_MARKERS } from "@/lib/three/constants";
import { TestModule } from "./TestModule";

interface CanvasProps {
  selectedType: FireworkType;
}

export const Canvas = ({ selectedType }: CanvasProps) => {
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
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
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
    if (!mountRef.current) return;

    const mountElement = mountRef.current;
    const width = mountElement.clientWidth;
    const height = mountElement.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
    sceneRef.current = scene;

    // 2. Camera
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

    // 4. Markers InstancedMesh
    const markerMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.8,
    });
    const markerMesh = new THREE.InstancedMesh(
      MARKER_GEOMETRY,
      markerMaterial,
      MAX_MARKERS
    );
    markerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(markerMesh);
    markerMeshRef.current = markerMesh;

    // 5. Event Handlers & Animation Loop
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current)
        return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;

      const aspect = w / h;
      cameraRef.current.left = -VIEW_SIZE * aspect;
      cameraRef.current.right = VIEW_SIZE * aspect;
      cameraRef.current.top = VIEW_SIZE;
      cameraRef.current.bottom = -VIEW_SIZE;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const handleClick = (event: MouseEvent) => {
      // Prevent adding firework when clicking on stats or UI buttons
      if (
        (event.target as HTMLElement).closest("button") ||
        (event.target as HTMLElement).closest("canvas") !== renderer.domElement
      )
        return;

      if (!rendererRef.current?.domElement || !cameraRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const cam = cameraRef.current;
      const worldX = mouseX * (cam.right - cam.left) * 0.5;
      const worldY = mouseY * (cam.top - cam.bottom) * 0.5;

      addFirework(selectedTypeRef.current, worldX, worldY);
    };

    const animate = () => {
      if (statsRef.current) statsRef.current.begin();

      animationFrameRef.current = requestAnimationFrame(animate);
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        updateRockets(rocketsRef, particlesRef, sceneRef.current);
        updateParticles(particlesRef, sceneRef.current);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      if (statsRef.current) statsRef.current.end();
    };

    window.addEventListener("resize", handleResize);
    renderer.domElement.addEventListener("click", handleClick);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", handleClick);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

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
  }, [addFirework]);

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

      dummy.position.set(firework.x, firework.y, 0.1);
      dummy.updateMatrix();
      markerMesh.setMatrixAt(i, dummy.matrix);
    });

    markerMesh.count = savedFireworks.length;
    markerMesh.instanceMatrix.needsUpdate = true;
    if (markerMesh.instanceColor) {
      markerMesh.instanceColor.needsUpdate = true;
    }
  }, [savedFireworks]);

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
