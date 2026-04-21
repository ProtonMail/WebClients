import { useEffect, useState } from 'react';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import {
    PermissionsModalType,
    setPermissions,
    showPermissionsModal,
} from '@proton/meet/store/slices/deviceManagementSlice';
import { isFirefox } from '@proton/shared/lib/helpers/browser';

/**
 * Permission listener that:
 * 1. Queries the Permissions API on mount and syncs state to Redux
 * 2. Sets up onchange listeners for ongoing permission changes
 *
 * Dispatches a synthetic `devicechange` event when
 * permission transitions to 'granted' so LiveKit refreshes device labels.
 *
 * Permission requests are not triggered here — they are initiated by the user
 * via the DevicesNeededConfirmation modal.
 */
export const useDevicePermissionChangeListener = () => {
    const dispatch = useMeetDispatch();
    const [permissionsLoading, setPermissionsLoading] = useState(true);

    useEffect(() => {
        let cameraStatus: PermissionStatus | null = null;
        let micStatus: PermissionStatus | null = null;

        const setup = async () => {
            try {
                [cameraStatus, micStatus] = await Promise.all([
                    navigator.permissions.query({ name: 'camera' as PermissionName }),
                    navigator.permissions.query({ name: 'microphone' as PermissionName }),
                ]);

                dispatch(setPermissions({ camera: cameraStatus.state, microphone: micStatus.state }));

                if (cameraStatus.state === 'prompt' || micStatus.state === 'prompt') {
                    dispatch(showPermissionsModal({ modal: PermissionsModalType.PERMISSIONS_MODAL }));
                } else if (cameraStatus.state === 'denied' && micStatus.state === 'denied') {
                    dispatch(showPermissionsModal({ modal: PermissionsModalType.PERMISSIONS_BLOCKED_MODAL }));
                } else if (cameraStatus.state === 'denied') {
                    dispatch(showPermissionsModal({ modal: PermissionsModalType.PERMISSIONS_BLOCKED_CAMERA_MODAL }));
                } else if (micStatus.state === 'denied') {
                    dispatch(
                        showPermissionsModal({ modal: PermissionsModalType.PERMISSIONS_BLOCKED_MICROPHONE_MODAL })
                    );
                }

                // In Firefox, enumerateDevices() only returns device labels when
                // getUserMedia has been called in the current page session, even if
                // permissions are already stored. We do a brief getUserMedia call to
                // unlock labels and then dispatch devicechange so LiveKit re-enumerates.
                const alreadyGranted = cameraStatus.state === 'granted' || micStatus.state === 'granted';
                if (isFirefox() && alreadyGranted) {
                    try {
                        const constraints: MediaStreamConstraints = {
                            ...(micStatus.state === 'granted' && { audio: true }),
                            ...(cameraStatus.state === 'granted' && { video: true }),
                        };
                        const stream = await navigator.mediaDevices.getUserMedia(constraints);
                        stream.getTracks().forEach((track) => track.stop());
                        navigator.mediaDevices?.dispatchEvent?.(new Event('devicechange'));
                    } catch {
                        // If this fails (e.g. no devices attached), device labels won't be
                        // available but that's acceptable — same behavior as before.
                    }
                }

                cameraStatus.onchange = () => {
                    dispatch(setPermissions({ camera: cameraStatus!.state }));
                    if (cameraStatus!.state === 'granted') {
                        navigator.mediaDevices?.dispatchEvent?.(new Event('devicechange'));
                    }
                };
                micStatus.onchange = () => {
                    dispatch(setPermissions({ microphone: micStatus!.state }));
                    if (micStatus!.state === 'granted') {
                        navigator.mediaDevices?.dispatchEvent?.(new Event('devicechange'));
                    }
                };
            } catch {
                // Permissions API not supported — permission requests will be handled by DevicesNeededConfirmation
            }

            setPermissionsLoading(false);
        };

        void setup();

        return () => {
            if (cameraStatus) {
                cameraStatus.onchange = null;
            }
            if (micStatus) {
                micStatus.onchange = null;
            }
        };
    }, [dispatch]);

    return { permissionsLoading };
};
