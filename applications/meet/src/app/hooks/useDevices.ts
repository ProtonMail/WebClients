import { useEffect, useState } from 'react';

import { useDevicePermissionsContext } from '../contexts/DevicePermissionsContext';

const getDevices = async (kind: MediaDeviceKind) => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        return devices
            .filter((d) => d.kind === kind && !d.label?.toLocaleLowerCase()?.includes('zoom'))
            .sort((a) => {
                return a.deviceId === 'default' ? -1 : 1;
            });
    } catch (err) {
        return [];
    }
};

export const useDevices = () => {
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
    const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);

    const {
        devicePermissions: { camera: cameraPermission, microphone: microphonePermission },
    } = useDevicePermissionsContext();

    const updateAllDevices = async () => {
        setCameras(await getDevices('videoinput'));
        setMicrophones(await getDevices('audioinput'));
        setSpeakers(await getDevices('audiooutput'));
    };

    useEffect(() => {
        void updateAllDevices();
    }, [cameraPermission, microphonePermission]);

    useEffect(() => {
        navigator.mediaDevices.addEventListener('devicechange', updateAllDevices);

        return () => {
            if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
                navigator.mediaDevices.removeEventListener('devicechange', updateAllDevices);
            }
        };
    }, []);

    const defaultMicrophone = microphones.find((m) => m.deviceId === 'default') ?? microphones[0];
    const defaultCamera = cameras.find((c) => c.deviceId === 'default') ?? cameras[0];
    const defaultSpeaker = speakers.find((s) => s.deviceId === 'default') ?? speakers[0];

    return {
        cameras,
        microphones,
        speakers,
        defaultMicrophone,
        defaultCamera,
        defaultSpeaker,
    };
};
