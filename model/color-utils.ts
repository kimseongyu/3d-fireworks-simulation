import * as THREE from "three";

export function pastelColor(r: number, g: number, b: number): THREE.Color {
  const pastelR = (r / 255) * 0.6 + 0.4;
  const pastelG = (g / 255) * 0.6 + 0.4;
  const pastelB = (b / 255) * 0.6 + 0.4;
  return new THREE.Color(pastelR, pastelG, pastelB);
}
