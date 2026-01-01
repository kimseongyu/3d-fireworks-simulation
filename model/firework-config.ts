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
    angle: number,
    radius: number,
    index: number
  ) => { vx: number; vy: number; vz: number };
}

export const fireworkConfigs = {
  peony: {
    name: "Peony",
    description: "둥근 형태의 불꽃놀이",
    baseColor: pastelColor(255, 107, 107),
    getVelocity: (angle: number, radius: number) => {
      const speed = radius * (0.4 + Math.random() * 0.3);
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0,
      };
    },
  },
  chrysanthemum: {
    name: "Chrysanthemum",
    description: "국화 형태의 불꽃놀이",
    baseColor: pastelColor(78, 205, 196),
    getVelocity: (angle: number, radius: number) => {
      const speed = radius * (0.5 + Math.random() * 0.4);
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0,
      };
    },
  },
  willow: {
    name: "Willow",
    description: "버드나무 형태의 불꽃놀이",
    baseColor: pastelColor(255, 230, 109),
    getVelocity: (angle: number, radius: number) => {
      const speed = radius * (0.3 + Math.random() * 0.4);
      return {
        vx: Math.cos(angle) * speed * 0.3,
        vy: -Math.abs(Math.sin(angle)) * speed * (0.6 + Math.random() * 0.4),
        vz: 0,
      };
    },
  },
  ring: {
    name: "Ring",
    description: "고리 형태의 불꽃놀이",
    baseColor: pastelColor(149, 225, 211),
    getVelocity: (angle: number) => {
      const ringRadius = 2.5;
      const speed = ringRadius * 0.2;
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0,
      };
    },
  },
  palm: {
    name: "Palm",
    description: "야자수 형태의 불꽃놀이",
    baseColor: pastelColor(243, 129, 129),
    getVelocity: (angle: number, radius: number) => {
      const speed = radius * (0.3 + Math.random() * 0.4);
      return {
        vx: Math.cos(angle) * speed * 0.4,
        vy: Math.abs(Math.sin(angle)) * speed * (0.5 + Math.random() * 0.3),
        vz: 0,
      };
    },
  },
  "multi-break": {
    name: "Multi-Break",
    description: "다단계 폭발 불꽃놀이",
    baseColor: pastelColor(170, 150, 218),
    getVelocity: (angle: number, radius: number) => {
      const breakLevel = Math.floor(Math.random() * 3);
      const speed = radius * (0.3 + breakLevel * 0.25);
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0,
      };
    },
  },
} as const;

export type FireworkType = keyof typeof fireworkConfigs;

export const getDefaultFireworkType = (): FireworkType => {
  return Object.keys(fireworkConfigs)[0] as FireworkType;
};
