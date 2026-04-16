import { useEffect } from 'react';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { requestPermission, setPermissions } from '@proton/meet/store/slices/deviceManagementSlice';
import { isSafari } from '@proton/shared/lib/helpers/browser';

/**
 * Permission listener that:
 * 1. Queries the Permissions API on mount
 * 2. Auto-requests permissions via the unified thunk if not already granted
 * 3. Sets up onchange listeners for ongoing permission changes
 *
 * Preserves workaround #17: dispatches a synthetic `devicechange` event when
 * permission transitions to 'granted' so LiveKit refreshes device labels.
 */
export const useDevicePermissionChangeListener = (cameraId?: string) => {
    const dispatch = useMeetDispatch();

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

                // Auto-request permissions on mount if not already granted
                if (cameraStatus.state === 'prompt') {
                    await dispatch(requestPermission('camera', isSafari() ? cameraId : undefined));
                }
                if (micStatus.state === 'prompt') {
                    await dispatch(requestPermission('microphone'));
                }

                // In Firefox, enumerateDevices() only returns device labels when
                // getUserMedia has been called in the current page session, even if
                // permissions are already stored. We do a brief getUserMedia call to
                // unlock labels and then dispatch devicechange so LiveKit re-enumerates.
                const alreadyGranted = cameraStatus.state === 'granted' || micStatus.state === 'granted';
                if (alreadyGranted) {
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
                // Permissions API not supported — request directly
                await dispatch(requestPermission('camera', isSafari() ? cameraId : undefined));
                await dispatch(requestPermission('microphone'));
            }
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
};
