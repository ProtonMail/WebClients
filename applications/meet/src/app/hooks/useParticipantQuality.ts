import { useParticipants } from '@livekit/components-react';
import { RoomEvent, VideoQuality } from 'livekit-client';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsScreenShare } from '@proton/meet/store/slices/meetingInfo';

const updateOnlyOn = [
    RoomEvent.Connected,
    RoomEvent.Disconnected,
    RoomEvent.Reconnected,
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ConnectionStateChanged,
];

export const useParticipantQuality = () => {
    const participants = useParticipants({
        updateOnlyOn,
    });

    const isScreenShare = useMeetSelector(selectIsScreenShare);

    if (isScreenShare || participants.length > 8) {
        return VideoQuality.LOW;
    }

    if (participants.length <= 3) {
        return VideoQuality.HIGH;
    }

    return VideoQuality.MEDIUM;
};
