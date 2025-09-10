import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type SidebarItem = {
    uid: string;
    name: string;
    parentUid: string | undefined;
    isLoading: boolean;
    isExpanded: boolean;
    level: number;
    hasLoadedChildren: boolean;
};

type SidebarStore = {
    // State
    items: Map<string, SidebarItem>;
    isCollapsed: boolean;
    sidebarLevel: number;

    // Actions
    setItem: (item: SidebarItem) => void;
    updateItem: (uid: string, updates: Partial<Omit<SidebarItem, 'uid'>>) => void;
    toggleExpanded: (uid: string) => void;
    removeItem: (uid: string) => void;
    reset: () => void;
    setCollapsed: (isCollapsed: boolean) => void;
    setSidebarLevel: (level: number) => void;

    // Getters
    getItem: (uid: string) => SidebarItem | undefined;
    getChildren: (uid: string) => SidebarItem[];
    getRootFolder: () => SidebarItem | undefined;
};

const initialState = {
    items: new Map(),
    isCollapsed: false,
    sidebarLevel: 0,
};

export const useSidebarStore = create<SidebarStore>()(
    devtools((set, get) => ({
        ...initialState,
        setItem: (item: SidebarItem) =>
            set((state) => {
                const newItems = new Map(state.items);
                newItems.set(item.uid, item);
                return { items: newItems };
            }),

        updateItem: (uid: string, updates: Partial<Omit<SidebarItem, 'uid'>>) =>
            set((state) => {
                const existingItem = state.items.get(uid);
                if (!existingItem) {
                    return state;
                }

                const newItems = new Map(state.items);
                newItems.set(uid, {
                    ...existingItem,
                    ...updates,
                });
                return { items: newItems };
            }),

        toggleExpanded: (uid: string) =>
            set((state) => {
                const item = state.items.get(uid);
                if (!item) {
                    return state;
                }

                const newItems = new Map(state.items);
                newItems.set(uid, {
                    ...item,
                    isExpanded: !item.isExpanded,
                });
                return { items: newItems };
            }),

        removeItem: (uid: string) =>
            set((state) => {
                const newItems = new Map(state.items);
                newItems.delete(uid);
                return { items: newItems };
            }),

        setCollapsed: (isCollapsed: boolean) => set({ isCollapsed }),
        setSidebarLevel: (sidebarLevel: number) => set({ sidebarLevel }),
        reset: () => set(initialState),
        getItem: (uid: string) => get().items.get(uid),
        getRootFolder: () => Array.from(get().items.values()).find((item) => !item.parentUid),
        getChildren: (parentUid: string) =>
            Array.from(get().items.values())
                .filter((node) => node.parentUid === parentUid)
                .sort((a, b) => a.name.localeCompare(b.name)),
    }))
);
