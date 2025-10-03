import { useEffect } from 'react';

import { isSafari } from '@proton/shared/lib/helpers/browser';

import { useRequestPermission } from './useRequestPermission';

export const useDevicePermissionChangeListener = (
    setDevicePermissions: ({ camera, microphone }: { camera?: PermissionState; microphone?: PermissionState }) => void,
    cameraId?: string
) => {
    const requestDevicePermission = useRequestPermission();

    const getPermissions = async () => {
        const [cameraStatus, micStatus] = await Promise.all([
            requestDevicePermission('camera', isSafari() ? cameraId : undefined),
            requestDevicePermission('microphone'),
        ]);

        setDevicePermissions({ camera: cameraStatus, microphone: micStatus });
    };
    const setup = async () => {
        let cameraStatus: PermissionStatus | null = null;
        let micStatus: PermissionStatus | null = null;

        if (isSafari()) {
            await getPermissions();
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
                    if (cameraStatus!.state === 'granted') {
                        navigator.mediaDevices?.dispatchEvent?.(new Event('devicechange'));
                    }
                };
                micStatus.onchange = () => {
                    setDevicePermissions({ microphone: micStatus!.state });
                    if (micStatus!.state === 'granted') {
                        navigator.mediaDevices?.dispatchEvent?.(new Event('devicechange'));
                    }
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
