"use client";

import { useState } from "react";
import { FireworkType } from "@/model/firework-config";
import { FireworkTypeList } from "./FireworkTypeList";
import { SavedFireworkList } from "./SavedFireworkList";
import { CanvasType } from "@/app/page";

type TabType = "types" | "saved";

interface SidebarProps {
  selectedType: FireworkType;
  canvasType: CanvasType;
  onFireworkSelect: (type: FireworkType) => void;
  onCanvasTypeChange: (type: CanvasType) => void;
}

export const Sidebar = ({
  selectedType,
  canvasType,
  onFireworkSelect,
  onCanvasTypeChange,
}: SidebarProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("types");

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="p-4 border-b border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">
            불꽃놀이 시뮬레이션
          </h1>
          <div
            className="px-4 py-2 rounded-lg font-semibold transition-all bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
            onClick={() =>
              onCanvasTypeChange(canvasType === "js" ? "wasm" : "js")
            }
          >
            {canvasType === "js" ? "JS" : "WASM"}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("types")}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "types"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            불꽃놀이 종류
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "saved"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            저장된 불꽃놀이
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "types" && (
          <FireworkTypeList
            selectedType={selectedType}
            onFireworkSelect={onFireworkSelect}
          />
        )}

        {activeTab === "saved" && <SavedFireworkList />}
      </div>
    </div>
  );
};
