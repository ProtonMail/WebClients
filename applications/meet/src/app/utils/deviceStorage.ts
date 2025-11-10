export const STORAGE_KEYS = {
    AUDIO_DEVICE_ID: 'proton-meet-audio-device-id',
    VIDEO_DEVICE_ID: 'proton-meet-video-device-id',
    AUDIO_OUTPUT_DEVICE_ID: 'proton-meet-audio-output-device-id',
} as const;

export const clearStoredDevices = () => {
    localStorage.removeItem(STORAGE_KEYS.AUDIO_DEVICE_ID);
    localStorage.removeItem(STORAGE_KEYS.VIDEO_DEVICE_ID);
    localStorage.removeItem(STORAGE_KEYS.AUDIO_OUTPUT_DEVICE_ID);
};
