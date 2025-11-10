import { useMediaDevices } from '@livekit/components-react';

import { useStoredDevices } from '../contexts/StoredDevicesContext';
import type { DeviceState } from '../types';
import { filterDevices, getDefaultLabel, isDefaultDevice } from '../utils/device-utils';

const getDefaultDevice = (devices: MediaDeviceInfo[]): MediaDeviceInfo => {
    const defaultDevice = devices.find((d) => isDefaultDevice(d.deviceId));
    if (defaultDevice) {
        const duplicatedDevice = devices.find(
            (d) => d.groupId === defaultDevice.groupId && !isDefaultDevice(d.deviceId)
        );
        return duplicatedDevice ?? filterDevices(devices)[0] ?? devices[0];
    }
    return devices[0];
};

const isDeviceAvailable = (devices: MediaDeviceInfo[], deviceId: string | null): boolean => {
    return !!devices.find((d) => d.deviceId === deviceId);
};

export const useDevices = () => {
    const cameras = useMediaDevices({ kind: 'videoinput' });
    const microphones = useMediaDevices({ kind: 'audioinput' });
    const speakers = useMediaDevices({ kind: 'audiooutput' });

    const { storedDevices } = useStoredDevices();

    const systemDefaultMicrophone = getDefaultDevice(microphones);
    const defaultMicrophone =
        microphones.find((m) => m.deviceId === storedDevices.audioDeviceId) ?? systemDefaultMicrophone;

    const systemDefaultCamera = getDefaultDevice(cameras);
    const defaultCamera = cameras.find((m) => m.deviceId === storedDevices.videoDeviceId) ?? systemDefaultCamera;

    const systemDefaultSpeaker = getDefaultDevice(speakers);
    const defaultSpeaker =
        speakers.find((m) => m.deviceId === storedDevices.audioOutputDeviceId) ?? systemDefaultSpeaker;

    const microphoneState: DeviceState = {
        systemDefault: systemDefaultMicrophone,
        systemDefaultLabel: getDefaultLabel(systemDefaultMicrophone),
        useSystemDefault: storedDevices.audioDeviceId === null,
        cachedAvailable: isDeviceAvailable(microphones, storedDevices.audioDeviceId),
        cachedDeviceId: storedDevices.audioDeviceId,
    };

    const cameraState: DeviceState = {
        systemDefault: systemDefaultCamera,
        systemDefaultLabel: getDefaultLabel(systemDefaultCamera),
        useSystemDefault: storedDevices.videoDeviceId === null,
        cachedAvailable: isDeviceAvailable(cameras, storedDevices.videoDeviceId),
        cachedDeviceId: storedDevices.videoDeviceId,
    };

    const speakerState: DeviceState = {
        systemDefault: systemDefaultSpeaker,
        systemDefaultLabel: getDefaultLabel(systemDefaultSpeaker),
        useSystemDefault: storedDevices.audioOutputDeviceId === null,
        cachedAvailable: isDeviceAvailable(speakers, storedDevices.audioOutputDeviceId),
        cachedDeviceId: storedDevices.audioOutputDeviceId,
    };

    return {
        cameras,
        microphones,
        speakers,
        defaultMicrophone,
        defaultCamera,
        defaultSpeaker,
        microphoneState,
        cameraState,
        speakerState,
        getDefaultDevice,
    };
};
