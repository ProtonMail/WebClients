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

    // Actions
    setItem: (item: SidebarItem) => void;
    updateItem: (uid: string, updates: Partial<Omit<SidebarItem, 'uid'>>) => void;
    toggleExpanded: (uid: string) => void;
    removeItem: (uid: string) => void;
    reset: () => void;

    // Getters
    getItem: (uid: string) => SidebarItem | undefined;
    getChildren: (uid: string) => SidebarItem[];
};

const initialState = {
    items: new Map(),
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

        reset: () => set(initialState),
        getItem: (uid: string) => get().items.get(uid),
        getChildren: (parentUid: string) =>
            Array.from(get().items.values())
                .filter((node) => node.parentUid === parentUid)
                .sort((a, b) => a.name.localeCompare(b.name)),
    }))
);
