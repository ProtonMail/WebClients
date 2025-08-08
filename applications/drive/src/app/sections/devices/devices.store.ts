import { create } from 'zustand';

import { type Device } from '@proton/drive';

import { getDeviceName } from './getDeviceName';

// SDK Device has a more complex type for "name" prop than what we need
export type StoreDevice = Omit<Device, 'name'> & {
    name: string;
};

interface DeviceStore {
    devices: Map<string, StoreDevice>;
    deviceList: StoreDevice[];
    isLoading: boolean;
    setLoading: (isLoading: boolean) => void;
    setDevice: (device: Device) => void;
    removeDevice: (id: string) => void;
    renameDevice: (id: string, name: string) => void;
    reset: () => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
    devices: new Map(),
    deviceList: [],
    isLoading: true,
    setLoading: (isLoading: boolean) =>
        set((state) => {
            return {
                ...state,
                isLoading,
            };
        }),
    setDevice: (device: Device) =>
        set((state) => {
            const newDevices = new Map(state.devices);
            const storeDevice: StoreDevice = {
                ...device,
                name: getDeviceName(device), // Convert complex name to string
            };
            newDevices.set(device.uid, storeDevice);

            return {
                ...state,
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
                ...state,
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
                ...state,
                devices: devicesCopy,
                deviceList: Array.from(devicesCopy.values()),
            };
        }),

    reset: () => set({ devices: new Map(), deviceList: [] }),
}));
