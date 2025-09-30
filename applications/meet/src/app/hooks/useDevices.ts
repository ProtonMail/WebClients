import { useMediaDevices } from '@livekit/components-react';

import { getStoredDevices } from '../utils/deviceStorage';
import { filterDevices } from '../utils/filterDevices';

export const useDevices = () => {
    const cameras = filterDevices(useMediaDevices({ kind: 'videoinput' }));
    const microphones = filterDevices(useMediaDevices({ kind: 'audioinput' }));
    const speakers = filterDevices(useMediaDevices({ kind: 'audiooutput' }));

    const storedDevices = getStoredDevices();

    const defaultMicrophone =
        microphones.find((m) => m.deviceId === storedDevices.audioDeviceId) ??
        microphones.find((m) => m.deviceId === 'default') ??
        microphones[0];
    const defaultCamera =
        cameras.find((c) => c.deviceId === storedDevices.videoDeviceId) ??
        cameras.find((c) => c.deviceId === 'default') ??
        cameras[0];
    const defaultSpeaker =
        speakers.find((s) => s.deviceId === storedDevices.audioOutputDeviceId) ??
        speakers.find((s) => s.deviceId === 'default') ??
        speakers[0];

    return {
        cameras,
        microphones,
        speakers,
        defaultMicrophone,
        defaultCamera,
        defaultSpeaker,
    };
};
