import { useEffect, useMemo, useState } from 'react';

import { createMediaDeviceObserver } from '@livekit/components-core';

const useMediaDevicesWithoutPermissionRequest = (kind: MediaDeviceKind): MediaDeviceInfo[] => {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const observer = useMemo(() => createMediaDeviceObserver(kind, undefined, false), [kind]);

    useEffect(() => {
        const subscription = observer.subscribe(setDevices);
        return () => subscription.unsubscribe();
    }, [observer]);

    return devices;
};

/**
 * Subscribes to device lists via LiveKit's observable with `requestPermissions: false`
 * so that LiveKit's internal DeviceManager never calls getUserMedia on its own.
 *
 * Preferred device tracking and DeviceState computation have moved to the
 * deviceManagement Redux slice.
 */
export const useDevices = () => {
    const cameras = useMediaDevicesWithoutPermissionRequest('videoinput');
    const microphones = useMediaDevicesWithoutPermissionRequest('audioinput');
    const speakers = useMediaDevicesWithoutPermissionRequest('audiooutput');

    return {
        cameras,
        microphones,
        speakers,
    };
};
