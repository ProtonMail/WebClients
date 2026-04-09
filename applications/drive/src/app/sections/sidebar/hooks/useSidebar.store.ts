import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { getNodeUidFromTreeItemId } from '../../../modules/directoryTree/helpers';

type SidebarStore = {
    isCollapsed: boolean;
    sidebarLevel: number;
    setCollapsed: (isCollapsed: boolean) => void;
    expandLevel: (treeItemId: string, level: number) => void;
    collapseLevel: (treeItemId: string) => void;
};

// Not reactive state — only sidebarLevel (the derived max) needs to trigger re-renders
const levelMap = new Map<string, number>();

export const useSidebarStore = create<SidebarStore>()(
    devtools((set) => ({
        isCollapsed: false,
        sidebarLevel: 0,

        setCollapsed: (isCollapsed: boolean) => set({ isCollapsed }),

        expandLevel: (treeItemId: string, level: number) => {
            levelMap.set(treeItemId, level);
            set({ sidebarLevel: Math.max(...levelMap.values()) });
        },

        collapseLevel: (treeItemId: string) => {
            const nodeUid = getNodeUidFromTreeItemId(treeItemId);
            for (const key of levelMap.keys()) {
                if (key === treeItemId || key.startsWith(`${nodeUid}___`)) {
                    levelMap.delete(key);
                }
            }
            set({ sidebarLevel: levelMap.size > 0 ? Math.max(...levelMap.values()) : 0 });
        },
    }))
);
