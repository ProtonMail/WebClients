import { createContext, useContext } from 'react';

export interface StoredDevices {
    audioDeviceId: string | null;
    videoDeviceId: string | null;
    audioOutputDeviceId: string | null;
}

interface StoredDevicesContextType {
    storedDevices: StoredDevices;
    saveAudioDevice: (deviceId: string | null) => void;
    saveVideoDevice: (deviceId: string | null) => void;
    saveAudioOutputDevice: (deviceId: string | null) => void;
}

const defaultValues: StoredDevicesContextType = {
    storedDevices: {
        audioDeviceId: null,
        videoDeviceId: null,
        audioOutputDeviceId: null,
    },
    saveAudioDevice: () => {},
    saveVideoDevice: () => {},
    saveAudioOutputDevice: () => {},
};

export const StoredDevicesContext = createContext<StoredDevicesContextType>(defaultValues);

export const useStoredDevices = () => {
    const context = useContext(StoredDevicesContext);
    if (!context) {
        throw new Error('useStoredDevices must be used within a StoredDevicesContext');
    }
    return context;
};
