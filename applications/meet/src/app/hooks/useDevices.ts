import { useEffect, useState } from 'react';

const getDevices = async (kind: MediaDeviceKind) => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === kind);
};

export const useDevices = () => {
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
    const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);

    const updateAllDevices = async () => {
        setCameras(await getDevices('videoinput'));
        setMicrophones(await getDevices('audioinput'));
        setSpeakers(await getDevices('audiooutput'));
    };

    const requestPermissions = async () => {
        // Helper to check permission state
        const checkPermission = async (name: PermissionName) => {
            if (navigator.permissions) {
                try {
                    const status = await navigator.permissions.query({ name });
                    return status.state;
                } catch {
                    return 'prompt';
                }
            }
            return 'prompt';
        };

        const cameraState = await checkPermission('camera' as PermissionName);
        if (cameraState !== 'granted') {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoStream.getTracks().forEach((track) => track.stop());
        }

        const micState = await checkPermission('microphone' as PermissionName);
        if (micState !== 'granted') {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getTracks().forEach((track) => track.stop());
        }
    };

    useEffect(() => {
        void requestPermissions();
    }, []);

    useEffect(() => {
        void updateAllDevices();
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
