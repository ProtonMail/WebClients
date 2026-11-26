import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

import { COMMUNICATIONS_DEVICE_ID } from '@proton/meet/constants';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setActiveDevice } from '@proton/meet/store/slices/deviceManagementSlice';
import { getDeviceBehindCommunications } from '@proton/meet/utils/deviceUtils';

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
    const { reportMeetError } = useMeetErrorReporting();

    useEffect(() => {
        const pinOutputBehindCommunications = async () => {
            const output = getDeviceBehindCommunications(
                await navigator.mediaDevices.enumerateDevices(),
                'audiooutput'
            );

            if (output && room.getActiveDevice('audiooutput') === COMMUNICATIONS_DEVICE_ID) {
                await room.switchActiveDevice('audiooutput', output.deviceId);
            }
        };

        const handleActiveDeviceChanged = (kind: MediaDeviceKind, deviceId: string) => {
            if (kind === 'audiooutput' && deviceId === COMMUNICATIONS_DEVICE_ID) {
                pinOutputBehindCommunications().catch((error) =>
                    reportMeetError('Error pinning the output behind communications', { context: { error } })
                );
            }

            // 'default' is not a real enumerated videoinput id
            const normalizedDeviceId = kind === 'videoinput' && deviceId === 'default' ? '' : deviceId;
            dispatch(setActiveDevice({ kind, deviceId: normalizedDeviceId }));
        };

        room.on(RoomEvent.ActiveDeviceChanged, handleActiveDeviceChanged);

        return () => {
            room.off(RoomEvent.ActiveDeviceChanged, handleActiveDeviceChanged);
        };
    }, [room, dispatch, reportMeetError]);
};
