import { useEffect, useState } from 'react';

import { isSafari } from '@proton/shared/lib/helpers/browser';

type PermissionState = 'granted' | 'denied' | 'prompt';

export function useMediaPermissionsStatus() {
    const [status, setStatus] = useState<{ camera: PermissionState; microphone: PermissionState }>({
        camera: 'prompt',
        microphone: 'prompt',
    });

    useEffect(() => {
        let cameraStatus: PermissionStatus | null = null;
        let micStatus: PermissionStatus | null = null;

        if (isSafari()) {
            setStatus({ camera: 'granted', microphone: 'granted' });
            return;
        }

        async function checkPermissions() {
            if (navigator.permissions) {
                cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

                setStatus({ camera: cameraStatus.state, microphone: micStatus.state });

                cameraStatus.onchange = () => {
                    setStatus((s) => ({ ...s, camera: cameraStatus!.state }));
                };
                micStatus.onchange = () => {
                    setStatus((s) => ({ ...s, microphone: micStatus!.state }));
                };
            }
        }

        void checkPermissions();

        return () => {
            if (cameraStatus) {
                cameraStatus.onchange = null;
            }
            if (micStatus) {
                micStatus.onchange = null;
            }
        };
    }, []);

    return status;
}
