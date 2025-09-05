import { useEffect } from 'react';

import { isFirefox, isSafari } from '@proton/shared/lib/helpers/browser';

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
        const [cameraStatus, micStatus] = await Promise.all([
            requestDevicePermission('camera'),
            requestDevicePermission('microphone'),
        ]);

        setDevicePermissions({ camera: cameraStatus, microphone: micStatus });
    };

    const setup = async () => {
        let cameraStatus: PermissionStatus | null = null;
        let micStatus: PermissionStatus | null = null;

        const [currentCameraStatus, currentMicStatus] = await Promise.all([
            checkPermission('camera' as PermissionName),
            checkPermission('microphone' as PermissionName),
        ]);

        if (currentCameraStatus === 'prompt' || currentMicStatus === 'prompt' || isFirefox()) {
            await getPermissions();
        }

        if (isSafari()) {
            return;
        }

        async function listenToPermissions() {
            if (navigator.permissions) {
                [cameraStatus, micStatus] = await Promise.all([
                    navigator.permissions.query({ name: 'camera' as PermissionName }),
                    navigator.permissions.query({ name: 'microphone' as PermissionName }),
                ]);

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
