import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

import { useStableCallback } from '../useStableCallback';

const SCREEN_SHARE_ROOM_EVENTS: RoomEvent[] = [
    RoomEvent.ConnectionStateChanged,
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.TrackPublished,
    RoomEvent.TrackUnpublished,
    RoomEvent.TrackSubscriptionStatusChanged,
    RoomEvent.LocalTrackPublished,
    RoomEvent.LocalTrackUnpublished,
];

export const useScreenShareRoomEvents = (onScreenShareChange: () => void) => {
    const room = useRoomContext();

    const handleScreenShareChange = useStableCallback(onScreenShareChange);

    useEffect(() => {
        SCREEN_SHARE_ROOM_EVENTS.forEach((event) => room.on(event, handleScreenShareChange));
        handleScreenShareChange();

        return () => {
            SCREEN_SHARE_ROOM_EVENTS.forEach((event) => room.off(event, handleScreenShareChange));
        };
    }, [room, handleScreenShareChange]);
};
