import { useParticipants } from '@livekit/components-react';
import { RoomEvent, VideoQuality } from 'livekit-client';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsCpuLoadDropActive } from '@proton/meet/store/slices/cpuLoadSlice';
import { selectIsScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';

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
    const isReducedForCpuLoad = useMeetSelector((state) => selectIsCpuLoadDropActive(state, 'incomingVideoQuality'));

    if (isScreenShare || participants.length > 8) {
        return VideoQuality.LOW;
    }

    if (participants.length <= 3) {
        return isReducedForCpuLoad ? VideoQuality.MEDIUM : VideoQuality.HIGH;
    }

    return isReducedForCpuLoad ? VideoQuality.LOW : VideoQuality.MEDIUM;
};
