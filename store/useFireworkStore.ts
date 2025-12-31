import { create } from "zustand";
import { FireworkType } from "@/model/firework-config";

export interface SavedFirework {
  id: string;
  type: FireworkType;
  x: number;
  y: number;
}

interface FireworkStore {
  savedFireworks: SavedFirework[];
  addFirework: (type: FireworkType, x: number, y: number) => void;
  removeFirework: (id: string) => void;
  clearAll: () => void;
}

export const useFireworkStore = create<FireworkStore>((set) => ({
  savedFireworks: [],
  addFirework: (type: FireworkType, x: number, y: number) => {
    const firework: SavedFirework = {
      id: `firework-${Date.now()}-${Math.random()}`,
      type,
      x,
      y,
    };
    set((state) => ({
      savedFireworks: [...state.savedFireworks, firework],
    }));
  },
  removeFirework: (id: string) => {
    set((state) => ({
      savedFireworks: state.savedFireworks.filter((f) => f.id !== id),
    }));
  },
  clearAll: () => {
    set({ savedFireworks: [] });
  },
}));
