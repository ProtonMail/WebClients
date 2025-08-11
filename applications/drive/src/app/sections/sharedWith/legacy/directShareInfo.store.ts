import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type SharedInfo = {
    sharedOn: number;
    sharedBy: string;
};

type DirectShareInfoStore = {
    cache: Map<string, SharedInfo | null>;

    setSharedInfo: (shareId: string, sharedInfo: SharedInfo | null) => void;
    getSharedInfo: (shareId: string) => SharedInfo | null | undefined;
    hasSharedInfo: (shareId: string) => boolean;
    clearCache: () => void;
};

export const useDirectShareInfoStore = create<DirectShareInfoStore>()(
    devtools((set, get) => ({
        cache: new Map(),

        setSharedInfo: (shareId: string, sharedInfo: SharedInfo | null) => {
            set((state) => {
                const newCache = new Map(state.cache);
                newCache.set(shareId, sharedInfo);
                return { cache: newCache };
            });
        },

        getSharedInfo: (shareId: string) => {
            return get().cache.get(shareId);
        },

        hasSharedInfo: (shareId: string) => {
            return get().cache.has(shareId);
        },

        clearCache: () => {
            set({ cache: new Map() });
        },
    }))
);
