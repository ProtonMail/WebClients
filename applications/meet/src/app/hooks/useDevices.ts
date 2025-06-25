import { useEffect, useState } from 'react';

import { useRequestPermissions } from './useRequestPermissions';

const getDevices = async (kind: MediaDeviceKind) => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === kind);
};

export const useDevices = () => {
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
    const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);

    const requestPermissions = useRequestPermissions();

    const updateAllDevices = async () => {
        setCameras(await getDevices('videoinput'));
        setMicrophones(await getDevices('audioinput'));
        setSpeakers(await getDevices('audiooutput'));
    };

    const setup = async () => {
        await requestPermissions();
        await updateAllDevices();
    };

    useEffect(() => {
        void setup();
    }, []);

    useEffect(() => {
        let cameraPerm: PermissionStatus | null = null;
        let micPerm: PermissionStatus | null = null;

        navigator.mediaDevices.addEventListener('devicechange', updateAllDevices);

        async function setupPermissions() {
            if (navigator.permissions) {
                try {
                    cameraPerm = await navigator.permissions.query({ name: 'camera' as PermissionName });
                    micPerm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                    cameraPerm.onchange = updateAllDevices;
                    micPerm.onchange = updateAllDevices;
                } catch (e) {
                    console.error(e);
                }
            }
        }

        void setupPermissions();

        return () => {
            if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
                navigator.mediaDevices.removeEventListener('devicechange', updateAllDevices);
            }

            if (cameraPerm) {
                cameraPerm.onchange = null;
            }
            if (micPerm) {
                micPerm.onchange = null;
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
