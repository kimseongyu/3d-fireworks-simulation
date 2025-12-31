"use client";

import { fireworkConfigs } from "@/model/firework-config";
import { useFireworkStore } from "@/store/useFireworkStore";

export const SavedFireworkList = () => {
  const { savedFireworks, removeFirework, clearAll } = useFireworkStore();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">저장된 불꽃놀이</h2>
        {savedFireworks.length > 0 && (
          <button
            onClick={clearAll}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            모두 삭제
          </button>
        )}
      </div>

      {savedFireworks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>저장된 불꽃놀이가 없습니다.</p>
          <p className="text-sm mt-2">
            불꽃놀이 종류 탭에서 불꽃놀이를 배치하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {savedFireworks.map((firework) => (
            <div
              key={firework.id}
              className="p-4 rounded-lg border-2 border-gray-200 bg-white"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {fireworkConfigs[firework.type]?.name || firework.type}
                  </h3>
                  <p className="text-sm text-gray-600">
                    위치: ({firework.x.toFixed(2)}, {firework.y.toFixed(2)})
                  </p>
                </div>
                <button
                  onClick={() => removeFirework(firework.id)}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
