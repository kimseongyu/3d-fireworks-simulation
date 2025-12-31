"use client";

import { useState } from "react";
import { FireworkType } from "@/model/firework-config";
import { FireworkTypeList } from "./FireworkTypeList";
import { SavedFireworkList } from "./SavedFireworkList";

type TabType = "types" | "saved";

interface SidebarProps {
  selectedType: FireworkType;
  onFireworkSelect: (type: FireworkType) => void;
}

export const Sidebar = ({ selectedType, onFireworkSelect }: SidebarProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("types");

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="p-4 border-b border-gray-300">
        <h1 className="text-xl font-bold text-gray-800 mb-4">
          불꽃놀이 시뮬레이션
        </h1>
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
