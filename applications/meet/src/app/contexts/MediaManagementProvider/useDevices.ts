import { useCallback, useState } from 'react';

import { useMediaDevices } from '@livekit/components-react';

import type { DeviceState } from '../../types';
import { filterDevices, getDefaultLabel, isDefaultDevice } from '../../utils/device-utils';

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

const getDeviceFromDevicesList = (devices: MediaDeviceInfo[], deviceId: string | null): MediaDeviceInfo | null => {
    if (deviceId === null) {
        return null;
    }
    return devices.find((d) => d.deviceId === deviceId) ?? null;
};

export const useDevices = () => {
    const cameras = useMediaDevices({ kind: 'videoinput' });
    const microphones = useMediaDevices({ kind: 'audioinput' });
    const speakers = useMediaDevices({ kind: 'audiooutput' });

    const systemDefaultCamera = getDefaultDevice(cameras);
    const [preferredCamera, setPreferredCamera] = useState<MediaDeviceInfo | null>(null);

    const systemDefaultMicrophone = getDefaultDevice(microphones);
    const [preferredMicrophone, setPreferredMicrophone] = useState<MediaDeviceInfo | null>(null);

    const systemDefaultSpeaker = getDefaultDevice(speakers);
    const [preferredSpeaker, setPreferredSpeaker] = useState<MediaDeviceInfo | null>(null);

    const setPreferredDevice = useCallback(
        (deviceId: string | null, type: 'audioinput' | 'audiooutput' | 'videoinput') => {
            switch (type) {
                case 'audioinput':
                    setPreferredMicrophone(getDeviceFromDevicesList(microphones, deviceId));
                    break;
                case 'audiooutput':
                    setPreferredSpeaker(getDeviceFromDevicesList(speakers, deviceId));
                    break;
                case 'videoinput':
                    setPreferredCamera(getDeviceFromDevicesList(cameras, deviceId));
                    break;
            }
        },
        [cameras, microphones, speakers]
    );

    const cameraState: DeviceState = {
        systemDefault: systemDefaultCamera,
        systemDefaultLabel: getDefaultLabel(systemDefaultCamera),
        useSystemDefault: preferredCamera === null,
        preferredAvailable: isDeviceAvailable(cameras, preferredCamera?.deviceId ?? null),
        preferredDevice: preferredCamera ?? null,
    };

    const microphoneState: DeviceState = {
        systemDefault: systemDefaultMicrophone,
        systemDefaultLabel: getDefaultLabel(systemDefaultMicrophone),
        useSystemDefault: preferredMicrophone === null,
        preferredAvailable: isDeviceAvailable(microphones, preferredMicrophone?.deviceId ?? null),
        preferredDevice: preferredMicrophone ?? null,
    };

    const speakerState: DeviceState = {
        systemDefault: systemDefaultSpeaker,
        systemDefaultLabel: getDefaultLabel(systemDefaultSpeaker),
        useSystemDefault: preferredSpeaker === null,
        preferredAvailable: isDeviceAvailable(speakers, preferredSpeaker?.deviceId ?? null),
        preferredDevice: preferredSpeaker ?? null,
    };

    return {
        cameras,
        microphones,
        speakers,
        cameraState,
        microphoneState,
        speakerState,
        setPreferredDevice,
        getDefaultDevice,
    };
};
