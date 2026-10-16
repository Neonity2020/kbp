import { create } from "zustand";
import { persist } from "zustand/middleware";
interface Preferences {
  theme: "light" | "dark" | "system";
  collapsed: boolean;
  setTheme: (theme: Preferences["theme"]) => void;
  toggleSidebar: () => void;
}
export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      theme: "light",
      collapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    {
      name: "forma.preferences.v1",
      version: 1,
      partialize: (s) => ({ theme: s.theme, collapsed: s.collapsed }),
    },
  ),
);
