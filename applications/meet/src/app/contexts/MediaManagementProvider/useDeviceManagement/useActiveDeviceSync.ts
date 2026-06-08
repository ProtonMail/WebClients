import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setActiveDevice } from '@proton/meet/store/slices/deviceManagementSlice';

/**
 * Bridges LiveKit's active device state to the Redux store by subscribing to
 * `RoomEvent.ActiveDeviceChanged`.
 *
 * The previous `useMediaDeviceSelect` + useEffect approach was unreliable: the
 * effect intermittently didn't run on initial load, leaving the active deviceId
 * unset in Redux.
 */
export const useActiveDeviceSync = () => {
    const dispatch = useMeetDispatch();
    const room = useRoomContext();

    useEffect(() => {
        const handleActiveDeviceChanged = (kind: MediaDeviceKind, deviceId: string) => {
            // 'default' is not a real enumerated videoinput id
            const normalizedDeviceId = kind === 'videoinput' && deviceId === 'default' ? '' : deviceId;
            dispatch(setActiveDevice({ kind, deviceId: normalizedDeviceId }));
        };

        room.on(RoomEvent.ActiveDeviceChanged, handleActiveDeviceChanged);

        return () => {
            room.off(RoomEvent.ActiveDeviceChanged, handleActiveDeviceChanged);
        };
    }, [room, dispatch]);
};
