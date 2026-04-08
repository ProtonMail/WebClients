import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type SidebarStore = {
    // State
    isCollapsed: boolean;
    sidebarLevel: number;

    // Actions
    setCollapsed: (isCollapsed: boolean) => void;
    setSidebarLevel: (level: number) => void;
};

const initialState = {
    items: new Map(),
    isCollapsed: false,
    sidebarLevel: 0,
};

export const useSidebarStore = create<SidebarStore>()(
    devtools((set) => ({
        ...initialState,

        setCollapsed: (isCollapsed: boolean) => set({ isCollapsed }),
        setSidebarLevel: (sidebarLevel: number) => set({ sidebarLevel }),
    }))
);
