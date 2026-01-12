import * as THREE from "three";

function pastelColor(r: number, g: number, b: number): THREE.Color {
  const pastelR = (r / 255) * 0.6 + 0.4;
  const pastelG = (g / 255) * 0.6 + 0.4;
  const pastelB = (b / 255) * 0.6 + 0.4;
  return new THREE.Color(pastelR, pastelG, pastelB);
}

export interface FireworkConfig {
  name: string;
  description: string;
  baseColor: THREE.Color;
  getVelocity: (
    dir: THREE.Vector3,
    radius: number
  ) => { vx: number; vy: number; vz: number };
}

export const fireworkConfigs = {
  peony: {
    name: "Peony",
    description: "둥근 형태의 불꽃놀이",
    baseColor: pastelColor(255, 107, 107),
    getVelocity: (dir: THREE.Vector3, radius: number) => {
      const speed = radius * (0.4 + Math.random() * 0.3);
      return {
        vx: dir.x * speed,
        vy: dir.y * speed,
        vz: dir.z * speed,
      };
    },
  },
  chrysanthemum: {
    name: "Chrysanthemum",
    description: "국화 형태의 불꽃놀이",
    baseColor: pastelColor(78, 205, 196),
    getVelocity: (dir: THREE.Vector3, radius: number) => {
      const speed = radius * (0.5 + Math.random() * 0.4);
      return {
        vx: dir.x * speed,
        vy: dir.y * speed,
        vz: dir.z * speed,
      };
    },
  },
  willow: {
    name: "Willow",
    description: "버드나무 형태의 불꽃놀이",
    baseColor: pastelColor(255, 230, 109),
    getVelocity: (dir: THREE.Vector3, radius: number) => {
      const speed = radius * (0.3 + Math.random() * 0.4);
      return {
        vx: dir.x * speed * 0.3,
        vy: dir.y * speed * 0.3,
        vz: dir.z * speed * 0.3,
      };
    },
  },
  ring: {
    name: "Ring",
    description: "고리 형태의 불꽃놀이",
    baseColor: pastelColor(149, 225, 211),
    getVelocity: (dir: THREE.Vector3) => {
      const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
      const nx = dir.x / length;
      const ny = dir.y / length;

      const ringRadius = 2.5;
      const speed = ringRadius * 0.2;
      return {
        vx: nx * speed,
        vy: ny * speed,
        vz: 0,
      };
    },
  },
  palm: {
    name: "Palm",
    description: "야자수 형태의 불꽃놀이",
    baseColor: pastelColor(243, 129, 129),
    getVelocity: (dir: THREE.Vector3, radius: number) => {
      const speed = radius * (0.3 + Math.random() * 0.4);
      return {
        vx: dir.x * speed * 0.4,
        vy: dir.y * speed * 0.4,
        vz: dir.z * speed * 0.4,
      };
    },
  },
  "multi-break": {
    name: "Multi-Break",
    description: "다단계 폭발 불꽃놀이",
    baseColor: pastelColor(170, 150, 218),
    getVelocity: (dir: THREE.Vector3, radius: number) => {
      const breakLevel = Math.floor(Math.random() * 3);
      const speed = radius * (0.3 + breakLevel * 0.25);
      return {
        vx: dir.x * speed,
        vy: dir.y * speed,
        vz: dir.z * speed,
      };
    },
  },
} as const;

export type FireworkType = keyof typeof fireworkConfigs;

export const getDefaultFireworkType = (): FireworkType => {
  return Object.keys(fireworkConfigs)[0] as FireworkType;
};
