import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Device } from '@proton/drive';

import { getDeviceName } from '../../utils/sdk/getNodeName';
import { sortDeviceItems } from './devices.sorting';

// SDK Device has a more complex type for "name" prop than what we need
export type StoreDevice = Omit<Device, 'name'> & {
    name: string;
};

interface DeviceStore {
    items: Map<string, StoreDevice>;
    sortedItemUids: string[];

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

function resort(items: Map<string, StoreDevice>): string[] {
    return sortDeviceItems(Array.from(items.values()));
}

export const useDevicesStore = create<DeviceStore>()(
    devtools((set, get) => ({
        items: new Map(),
        sortedItemUids: [],

        isLoading: true,
        hasEverLoaded: false,

        getItem: (uid: string) => get().items.get(uid),

        setItem: (device: Device) =>
            set((state) => {
                const items = new Map(state.items);
                items.set(device.uid, { ...device, name: getDeviceName(device) });
                return { items, sortedItemUids: resort(items) };
            }),

        updateItem: (uid: string, updates: Partial<StoreDevice>) =>
            set((state) => {
                const existing = state.items.get(uid);
                if (!existing) {
                    return state;
                }
                const items = new Map(state.items);
                items.set(uid, { ...existing, ...updates });
                return { items, sortedItemUids: resort(items) };
            }),

        removeItem: (uid: string) =>
            set((state) => {
                const items = new Map(state.items);
                items.delete(uid);
                return { items, sortedItemUids: resort(items) };
            }),

        setLoading: (isLoading: boolean) =>
            set((state) => ({
                isLoading,
                hasEverLoaded: state.hasEverLoaded || !isLoading,
            })),

        renameDevice: (uid: string, name: string) =>
            set((state) => {
                const existing = state.items.get(uid);
                if (!existing) {
                    return state;
                }
                const items = new Map(state.items);
                items.set(uid, { ...existing, name });
                return { items, sortedItemUids: resort(items) };
            }),

        clearAll: () => set({ items: new Map(), sortedItemUids: [] }),

        getByRootFolderUid: (rootFolderUid: string) =>
            Array.from(get().items.values()).find((device) => device.rootFolderUid === rootFolderUid),
    }))
);
