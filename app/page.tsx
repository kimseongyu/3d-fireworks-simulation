"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { FireworkType, getDefaultFireworkType } from "@/model/firework-config";
import { Canvas } from "@/components/Canvas";

export default function Home() {
  const [selectedType, setSelectedType] = useState<FireworkType>(
    getDefaultFireworkType()
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-[25%] border-r border-gray-300 flex flex-col">
        <Sidebar
          selectedType={selectedType}
          onFireworkSelect={setSelectedType}
        />
      </div>
      <div className="w-[75%] relative">
        <Canvas selectedType={selectedType} />
      </div>
    </div>
  );
}
