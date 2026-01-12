import * as THREE from "three";
import { GRID_SIZE } from "./constants";

export const ROCKET_GEOMETRY = new THREE.BoxGeometry(
  GRID_SIZE,
  GRID_SIZE,
  GRID_SIZE * 2
);
export const PIXEL_GEOMETRY = new THREE.BoxGeometry(GRID_SIZE, GRID_SIZE, GRID_SIZE);
export const MARKER_GEOMETRY = new THREE.SphereGeometry(0.3, 16, 16);

