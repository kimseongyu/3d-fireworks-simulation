import { GRID_SIZE } from "@/lib/three/constants";

export const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
};

export const getColorVariation = (): number => {
  return 0.7 + Math.random() * 0.3;
};
