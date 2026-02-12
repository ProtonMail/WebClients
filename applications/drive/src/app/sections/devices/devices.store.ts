import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Device } from '@proton/drive';

import { getDeviceName } from '../../utils/sdk/getNodeName';

// SDK Device has a more complex type for "name" prop than what we need
export type StoreDevice = Omit<Device, 'name'> & {
    name: string;
};

interface DeviceStore {
    devices: Map<string, StoreDevice>;
    deviceList: StoreDevice[];
    isLoading: boolean;
    hasEverLoaded: boolean;
    updateDevice: (deviceUid: string, device: Partial<StoreDevice>) => void;
    setLoading: (isLoading: boolean) => void;
    setDevice: (device: Device) => void;
    removeDevice: (id: string) => void;
    renameDevice: (id: string, name: string) => void;
    reset: () => void;
    getByRootFolderUid: (rootFolderUid: string) => StoreDevice | undefined;
    setHasEverLoaded: () => void;
    checkAndSetHasEverLoaded: () => void;
}

export const useDeviceStore = create<DeviceStore>()(
    devtools((set, get) => ({
        devices: new Map(),
        deviceList: [],
        isLoading: true,
        hasEverLoaded: false,
        updateDevice: (deviceUid: string, item: Partial<StoreDevice>) =>
            set((state) => {
                const updatedDevices = new Map(state.devices);
                const existingDevice = updatedDevices.get(deviceUid);
                if (existingDevice) {
                    updatedDevices.set(deviceUid, {
                        ...existingDevice,
                        ...item,
                    });
                    return {
                        devices: updatedDevices,
                        deviceList: Array.from(updatedDevices.values()),
                    };
                }
                return {};
            }),
        setLoading: (isLoading: boolean) => {
            set({ isLoading });
            get().checkAndSetHasEverLoaded();
        },
        setDevice: (device: Device) =>
            set((state) => {
                const newDevices = new Map(state.devices);
                const storeDevice: StoreDevice = {
                    ...device,
                    name: getDeviceName(device), // Convert complex name to string
                };
                newDevices.set(device.uid, storeDevice);

                return {
                    devices: newDevices,
                    deviceList: Array.from(newDevices.values()),
                };
            }),
        removeDevice: (id: string) =>
            set((state) => {
                const devicesCopy = new Map(state.devices);
                const hasDevice = devicesCopy.has(id);
                if (hasDevice) {
                    devicesCopy.delete(id);
                } else {
                    throw new Error(`Device not found ${id}`);
                }
                return {
                    devices: devicesCopy,
                    deviceList: Array.from(devicesCopy.values()),
                };
            }),
        renameDevice: (id: string, name: string) =>
            set((state) => {
                const devicesCopy = new Map(state.devices);
                const oldDevice = devicesCopy.get(id);
                if (oldDevice) {
                    devicesCopy.set(id, { ...oldDevice, name });
                } else {
                    throw new Error(`Device not found ${id}`);
                }
                return {
                    devices: devicesCopy,
                    deviceList: Array.from(devicesCopy.values()),
                };
            }),

        reset: () => set({ devices: new Map(), deviceList: [], hasEverLoaded: false }),
        getByRootFolderUid: (rootFolderUid: string) =>
            Array.from(get().deviceList).find((device) => device.rootFolderUid === rootFolderUid),
        setHasEverLoaded: () => set({ hasEverLoaded: true }),
        checkAndSetHasEverLoaded: () => {
            const state = get();
            if (!state.isLoading && !state.hasEverLoaded) {
                state.setHasEverLoaded();
            }
        },
    }))
);
