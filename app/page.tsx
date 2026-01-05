"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { FireworkType, getDefaultFireworkType } from "@/model/firework-config";
import { Canvas } from "@/components/canvas/Canvas";

export type CanvasType = "js" | "wasm";

export default function Home() {
  const [canvasType, setCanvasType] = useState<CanvasType>("js");
  const [selectedType, setSelectedType] = useState<FireworkType>(
    getDefaultFireworkType()
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-[25%] border-r border-gray-300 flex flex-col">
        <Sidebar
          selectedType={selectedType}
          canvasType={canvasType}
          onFireworkSelect={setSelectedType}
          onCanvasTypeChange={setCanvasType}
        />
      </div>
      <div className="w-[75%] relative">
        <Canvas selectedType={selectedType} canvasType={canvasType} />
      </div>
    </div>
  );
}
