import type { Metadata } from "next";
import "@/global.css";

export const metadata: Metadata = {
  title: "3D Fireworks Simulation",
  description: "A 3D fireworks simulation using Three.js and WASM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
