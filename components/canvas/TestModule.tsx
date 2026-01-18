import { useFireworkStore } from "@/store/useFireworkStore";
import { VIEW_SIZE } from "@/lib/three/constants";
import { fireworkConfigs, FireworkType } from "@/model/firework-config";
import { useEffect, useState, useRef } from "react";
import Stats from "three/examples/jsm/libs/stats.module.js";

interface TestModuleProps {
  mountRef: React.RefObject<HTMLDivElement | null>;
  statsRef: React.RefObject<Stats | null>;
}

export const TestModule = ({ mountRef, statsRef }: TestModuleProps) => {
  const { addFirework, clearAll } = useFireworkStore();

  const [isTestMode, setIsTestMode] = useState(false);
  const statsInstanceRef = useRef<Stats | null>(null);

  const handleStressTest = (count: number) => {
    if (!mountRef.current) return;

    const maxRadius = VIEW_SIZE * 5;

    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(Math.random()) * maxRadius;
      const theta = Math.random() * Math.PI * 2;

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);

      const types = Object.keys(fireworkConfigs) as FireworkType[];
      const randomType = types[Math.floor(Math.random() * types.length)];

      addFirework(randomType, x, y);
    }
  };

  useEffect(() => {
    if (!statsInstanceRef.current) {
      const stats = new Stats();
      stats.showPanel(0); // 0: fps, 1: ms, 2: mb
      stats.dom.style.position = "absolute";
      stats.dom.style.left = "4px";
      stats.dom.style.bottom = "4px";
      stats.dom.style.top = "auto";
      stats.dom.style.right = "auto";
      stats.dom.style.zIndex = "20";
      statsInstanceRef.current = stats;
      statsRef.current = stats;
    }

    return () => {
      const currentMountElement = mountRef.current;
      if (statsInstanceRef.current && currentMountElement) {
        if (currentMountElement.contains(statsInstanceRef.current.dom)) {
          currentMountElement.removeChild(statsInstanceRef.current.dom);
        }
      }
      statsInstanceRef.current = null;
      statsRef.current = null;
    };
  }, [mountRef, statsRef]);

  useEffect(() => {
    const mountElement = mountRef.current;
    const stats = statsInstanceRef.current;

    if (!mountElement || !stats) return;

    if (isTestMode) {
      if (!mountElement.contains(stats.dom)) {
        mountElement.appendChild(stats.dom);
      }
    } else {
      if (mountElement.contains(stats.dom)) {
        mountElement.removeChild(stats.dom);
      }
    }
  }, [isTestMode, mountRef]);

  return (
    <div className="absolute top-4 right-4 z-30 bg-gray-900/80 rounded-lg border border-gray-700 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-center px-3 py-2 border-b border-gray-700">
        <h3
          onClick={() => setIsTestMode(!isTestMode)}
          className="text-white text-xs font-bold uppercase tracking-wider"
        >
          Test Mode
        </h3>
      </div>
      {isTestMode && (
        <div className={"p-3"}>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleStressTest(1000)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +1000
            </button>
            <button
              onClick={() => handleStressTest(10)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +10
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
