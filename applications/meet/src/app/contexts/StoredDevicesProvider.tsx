import React, { type ReactNode, useCallback, useState } from 'react';

import { STORAGE_KEYS } from '../utils/deviceStorage';
import type { StoredDevices } from './StoredDevicesContext';
import { StoredDevicesContext } from './StoredDevicesContext';

const getStoredDevicesFromLocalStorage = () => {
    return {
        audioDeviceId: localStorage.getItem(STORAGE_KEYS.AUDIO_DEVICE_ID) || null,
        videoDeviceId: localStorage.getItem(STORAGE_KEYS.VIDEO_DEVICE_ID) || null,
        audioOutputDeviceId: localStorage.getItem(STORAGE_KEYS.AUDIO_OUTPUT_DEVICE_ID) || null,
    };
};

export const StoredDevicesProvider = ({ children }: { children: ReactNode }) => {
    const [storedDevices, setStoredDevices] = useState<StoredDevices>(() => getStoredDevicesFromLocalStorage());

    const saveAudioDevice = useCallback((deviceId: string | null) => {
        if (deviceId) {
            localStorage.setItem(STORAGE_KEYS.AUDIO_DEVICE_ID, deviceId);
        } else {
            localStorage.removeItem(STORAGE_KEYS.AUDIO_DEVICE_ID);
        }
        setStoredDevices((prev) => ({ ...prev, audioDeviceId: deviceId }));
    }, []);

    const saveVideoDevice = useCallback((deviceId: string | null) => {
        if (deviceId) {
            localStorage.setItem(STORAGE_KEYS.VIDEO_DEVICE_ID, deviceId);
        } else {
            localStorage.removeItem(STORAGE_KEYS.VIDEO_DEVICE_ID);
        }
        setStoredDevices((prev) => ({ ...prev, videoDeviceId: deviceId }));
    }, []);

    const saveAudioOutputDevice = useCallback((deviceId: string | null) => {
        if (deviceId) {
            localStorage.setItem(STORAGE_KEYS.AUDIO_OUTPUT_DEVICE_ID, deviceId);
        } else {
            localStorage.removeItem(STORAGE_KEYS.AUDIO_OUTPUT_DEVICE_ID);
        }
        setStoredDevices((prev) => ({ ...prev, audioOutputDeviceId: deviceId }));
    }, []);

    return (
        <StoredDevicesContext.Provider
            value={{
                storedDevices,
                saveAudioDevice,
                saveVideoDevice,
                saveAudioOutputDevice,
            }}
        >
            {children}
        </StoredDevicesContext.Provider>
    );
};
