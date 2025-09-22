const STORAGE_KEYS = {
    AUDIO_DEVICE_ID: 'proton-meet-audio-device-id',
    VIDEO_DEVICE_ID: 'proton-meet-video-device-id',
    AUDIO_OUTPUT_DEVICE_ID: 'proton-meet-audio-output-device-id',
} as const;

export interface StoredDevices {
    audioDeviceId?: string;
    videoDeviceId?: string;
    audioOutputDeviceId?: string;
}

const saveDevice = (deviceId: string | null, storageKey: string) => {
    if (deviceId) {
        localStorage.setItem(storageKey, deviceId);
    } else {
        localStorage.removeItem(storageKey);
    }
};

export const saveAudioDevice = (deviceId: string | null) => saveDevice(deviceId, STORAGE_KEYS.AUDIO_DEVICE_ID);

export const saveVideoDevice = (deviceId: string | null) => saveDevice(deviceId, STORAGE_KEYS.VIDEO_DEVICE_ID);

export const saveAudioOutputDevice = (deviceId: string | null) =>
    saveDevice(deviceId, STORAGE_KEYS.AUDIO_OUTPUT_DEVICE_ID);

export const getStoredDevices = (): StoredDevices => {
    return {
        audioDeviceId: localStorage.getItem(STORAGE_KEYS.AUDIO_DEVICE_ID) || undefined,
        videoDeviceId: localStorage.getItem(STORAGE_KEYS.VIDEO_DEVICE_ID) || undefined,
        audioOutputDeviceId: localStorage.getItem(STORAGE_KEYS.AUDIO_OUTPUT_DEVICE_ID) || undefined,
    };
};

export const clearStoredDevices = () => {
    localStorage.removeItem(STORAGE_KEYS.AUDIO_DEVICE_ID);
    localStorage.removeItem(STORAGE_KEYS.VIDEO_DEVICE_ID);
    localStorage.removeItem(STORAGE_KEYS.AUDIO_OUTPUT_DEVICE_ID);
};
