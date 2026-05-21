import { useEffect } from 'react';

import { useMediaDeviceSelect } from '@livekit/components-react';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setActiveDevice } from '@proton/meet/store/slices/deviceManagementSlice';

/**
 * Bridges LiveKit device hooks to the Redux store.
 *
 * Subscribes to device lists from useDevices (LiveKit, with requestPermissions=false)
 * and active device IDs from useMediaDeviceSelect, dispatching updates to the
 * deviceManagement slice.
 *
 * Permission observation is handled by useDevicePermissionChangeListener
 * (called from MediaManagementProvider), not here.
 */
export const useDeviceData = () => {
    const dispatch = useMeetDispatch();

    const { activeDeviceId: activeMicrophoneDeviceId } = useMediaDeviceSelect({
        kind: 'audioinput',
        requestPermissions: false,
    });

    const { activeDeviceId: activeAudioOutputDeviceId } = useMediaDeviceSelect({
        kind: 'audiooutput',
        requestPermissions: false,
    });

    const { activeDeviceId: activeCameraDeviceId } = useMediaDeviceSelect({
        kind: 'videoinput',
        requestPermissions: false,
    });

    useEffect(() => {
        dispatch(setActiveDevice({ kind: 'audioinput', deviceId: activeMicrophoneDeviceId }));
    }, [activeMicrophoneDeviceId, dispatch]);

    useEffect(() => {
        dispatch(setActiveDevice({ kind: 'audiooutput', deviceId: activeAudioOutputDeviceId }));
    }, [activeAudioOutputDeviceId, dispatch]);

    useEffect(() => {
        dispatch(setActiveDevice({ kind: 'videoinput', deviceId: activeCameraDeviceId }));
    }, [activeCameraDeviceId, dispatch]);
};
