import type { DeviceKind } from './types';

export const LAST_USED_CAMERA_ID_KEY = 'lastUsedCameraId';
export const LAST_USED_MICROPHONE_ID_KEY = 'lastUsedMicrophoneId';
export const LAST_USED_SPEAKER_ID_KEY = 'lastUsedSpeakerId';

export const getLastUsedDeviceIdKey = (deviceType: DeviceKind) => {
    switch (deviceType) {
        case 'videoinput':
            return LAST_USED_CAMERA_ID_KEY;
        case 'audioinput':
            return LAST_USED_MICROPHONE_ID_KEY;
        case 'audiooutput':
            return LAST_USED_SPEAKER_ID_KEY;
    }
};
