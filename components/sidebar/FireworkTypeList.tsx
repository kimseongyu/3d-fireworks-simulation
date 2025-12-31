"use client";

import { useMemo } from "react";
import { Firework } from "@/model/firework";
import { fireworkConfigs, FireworkType } from "@/model/firework-config";

interface FireworkTypeListProps {
  selectedType: FireworkType;
  onFireworkSelect: (type: FireworkType) => void;
}

export const FireworkTypeList = ({
  selectedType,
  onFireworkSelect,
}: FireworkTypeListProps) => {
  const fireworkTypes: Array<{ type: FireworkType; firework: Firework }> =
    useMemo(() => {
      return (Object.keys(fireworkConfigs) as FireworkType[]).map((type) => ({
        type,
        firework: new Firework(fireworkConfigs[type]),
      }));
    }, []);

  return (
    <div>
      <div className="space-y-3">
        {fireworkTypes.map(({ type, firework }) => (
          <button
            key={type}
            onClick={() => onFireworkSelect(type)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedType === type
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
            }`}
          >
            <h3 className="font-semibold text-gray-800 mb-1">
              {firework.name}
            </h3>
            <p className="text-sm text-gray-600">{firework.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
