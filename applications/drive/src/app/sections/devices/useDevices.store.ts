import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Device } from '@proton/drive';

import { getDeviceName } from '../../utils/sdk/getNodeName';

// SDK Device has a more complex type for "name" prop than what we need
export type StoreDevice = Omit<Device, 'name'> & {
    name: string;
};

interface DeviceStore {
    items: Map<string, StoreDevice>;
    sortedItemUids: Set<string>;

    isLoading: boolean;
    hasEverLoaded: boolean;

    setItem: (device: Device) => void;
    updateItem: (uid: string, updates: Partial<StoreDevice>) => void;
    removeItem: (uid: string) => void;
    clearAll: () => void;

    getItem: (uid: string) => StoreDevice | undefined;

    setLoading: (isLoading: boolean) => void;

    renameDevice: (uid: string, name: string) => void;
    getByRootFolderUid: (rootFolderUid: string) => StoreDevice | undefined;
}

export const useDevicesStore = create<DeviceStore>()(
    devtools((set, get) => ({
        items: new Map(),
        sortedItemUids: new Set(),

        isLoading: true,
        hasEverLoaded: false,

        getItem: (uid: string) => get().items.get(uid),

        setItem: (device: Device) =>
            set((state) => {
                const items = new Map(state.items);
                const storeDevice: StoreDevice = {
                    ...device,
                    name: getDeviceName(device),
                };
                items.set(device.uid, storeDevice);
                const sortedItemUids = new Set(state.sortedItemUids);
                sortedItemUids.add(device.uid);
                return { items, sortedItemUids };
            }),

        updateItem: (uid: string, updates: Partial<StoreDevice>) =>
            set((state) => {
                const existing = state.items.get(uid);
                if (!existing) {
                    return state;
                }
                const items = new Map(state.items);
                items.set(uid, { ...existing, ...updates });
                return { items };
            }),

        removeItem: (uid: string) =>
            set((state) => {
                const items = new Map(state.items);
                items.delete(uid);
                const sortedItemUids = new Set<string>();
                for (const id of state.sortedItemUids) {
                    if (id !== uid) {
                        sortedItemUids.add(id);
                    }
                }
                return { items, sortedItemUids };
            }),

        setLoading: (isLoading: boolean) => {
            set((state) => ({
                isLoading,
                hasEverLoaded: state.hasEverLoaded || !isLoading,
            }));
        },

        renameDevice: (uid: string, name: string) =>
            set((state) => {
                const existing = state.items.get(uid);
                if (!existing) {
                    return state;
                }
                const items = new Map(state.items);
                items.set(uid, { ...existing, name });
                return { items };
            }),

        clearAll: () => set({ items: new Map(), sortedItemUids: new Set() }),

        getByRootFolderUid: (rootFolderUid: string) =>
            Array.from(get().items.values()).find((device) => device.rootFolderUid === rootFolderUid),
    }))
);
