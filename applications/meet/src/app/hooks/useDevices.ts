import { useEffect, useState } from 'react';

import { useDevicePermissionsContext } from '../contexts/DevicePermissionsContext';

const getDevices = async (kind: MediaDeviceKind) => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((d) => d.kind === kind);
    } catch (err) {
        console.log(err);

        return [];
    }
};

export const useDevices = () => {
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
    const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);

    const { devicePermissions } = useDevicePermissionsContext();

    const updateAllDevices = async () => {
        setCameras(await getDevices('videoinput'));
        setMicrophones(await getDevices('audioinput'));
        setSpeakers(await getDevices('audiooutput'));
    };

    useEffect(() => {
        void updateAllDevices();
    }, [devicePermissions]);

    useEffect(() => {
        navigator.mediaDevices.addEventListener('devicechange', updateAllDevices);

        return () => {
            if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
                navigator.mediaDevices.removeEventListener('devicechange', updateAllDevices);
            }
        };
    }, []);

    const defaultMicrophone = microphones[0];
    const defaultCamera = cameras[0];
    const defaultSpeaker = speakers[0];

    return {
        cameras,
        microphones,
        speakers,
        defaultMicrophone,
        defaultCamera,
        defaultSpeaker,
    };
};
