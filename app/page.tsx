"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { FireworkType, getDefaultFireworkType } from "@/model/firework-config";
import { Canvas } from "@/components/Canvas";

export default function Home() {
  const [selectedType, setSelectedType] = useState<FireworkType>(
    getDefaultFireworkType()
  );

  const handleFireworkSelect = (type: FireworkType) => {
    setSelectedType(type);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-[25%] border-r border-gray-300">
        <Sidebar
          selectedType={selectedType}
          onFireworkSelect={handleFireworkSelect}
        />
      </div>
      <div className="w-[75%]">
        <Canvas selectedType={selectedType} />
      </div>
    </div>
  );
}
