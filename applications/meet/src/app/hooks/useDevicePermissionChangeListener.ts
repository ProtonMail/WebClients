import { useEffect } from 'react';

import { isSafari } from '@proton/shared/lib/helpers/browser';

import { useRequestPermission } from './useRequestPermission';

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

export const useDevicePermissionChangeListener = (
    setDevicePermissions: ({ camera, microphone }: { camera?: PermissionState; microphone?: PermissionState }) => void
) => {
    const requestDevicePermission = useRequestPermission();

    const getPermissions = async () => {
        const cameraStatus = await requestDevicePermission('camera');
        const micStatus = await requestDevicePermission('microphone');

        setDevicePermissions({ camera: cameraStatus, microphone: micStatus });
    };

    const setup = async () => {
        let cameraStatus: PermissionStatus | null = null;
        let micStatus: PermissionStatus | null = null;

        const currentCameraStatus = await checkPermission('camera' as PermissionName);
        const currentMicStatus = await checkPermission('microphone' as PermissionName);

        if (currentCameraStatus === 'prompt' || currentMicStatus === 'prompt') {
            void getPermissions();
        }

        if (isSafari()) {
            return;
        }

        async function listenToPermissions() {
            if (navigator.permissions) {
                cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

                setDevicePermissions({ camera: cameraStatus.state, microphone: micStatus.state });

                cameraStatus.onchange = () => {
                    setDevicePermissions({ camera: cameraStatus!.state });
                };
                micStatus.onchange = () => {
                    setDevicePermissions({ microphone: micStatus!.state });
                };
            }
        }

        void listenToPermissions();

        return () => {
            if (cameraStatus) {
                cameraStatus.onchange = null;
            }
            if (micStatus) {
                micStatus.onchange = null;
            }
        };
    };

    useEffect(() => {
        void setup();
    }, []);
};
