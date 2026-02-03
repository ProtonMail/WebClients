import { useEffect } from 'react';

import { isSafari } from '@proton/shared/lib/helpers/browser';

import { useRequestPermission } from '../../hooks/useRequestPermission';

export const useDevicePermissionChangeListener = (
    handleDevicePermissionChange: ({
        camera,
        microphone,
    }: {
        camera?: PermissionState;
        microphone?: PermissionState;
    }) => void,
    cameraId?: string
) => {
    const requestDevicePermission = useRequestPermission();

    const setup = async () => {
        const [cameraStatus, micStatus] = await Promise.all([
            navigator.permissions.query({ name: 'camera' as PermissionName }),
            navigator.permissions.query({ name: 'microphone' as PermissionName }),
        ]);

        let cameraState = cameraStatus?.state;
        let micState = micStatus?.state;

        if (cameraState !== 'granted') {
            cameraState = await requestDevicePermission('camera', isSafari() ? cameraId : undefined);
        }

        if (micState !== 'granted') {
            micState = await requestDevicePermission('microphone');
        }

        handleDevicePermissionChange({ camera: cameraState, microphone: micState });

        async function listenToPermissions() {
            if (navigator.permissions) {
                cameraStatus.onchange = () => {
                    handleDevicePermissionChange({ camera: cameraStatus!.state });
                    if (cameraStatus!.state === 'granted') {
                        navigator.mediaDevices?.dispatchEvent?.(new Event('devicechange'));
                    }
                };
                micStatus.onchange = () => {
                    handleDevicePermissionChange({ microphone: micStatus!.state });
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
        let cleanup: (() => void) | undefined;

        setup()
            .then((cleanupFn) => {
                cleanup = cleanupFn;
            })
            .catch(() => {
                // Silently handle errors during setup
            });

        return () => {
            cleanup?.();
        };
    }, []);
};
