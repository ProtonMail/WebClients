import { useParticipants } from '@livekit/components-react';
import { VideoQuality } from '@proton-meet/livekit-client';

import { useMeetContext } from '../contexts/MeetContext';

export const useParticipantQuality = () => {
    const participants = useParticipants();

    const { isScreenShare } = useMeetContext();

    if (isScreenShare || participants.length > 8) {
        return VideoQuality.LOW;
    }

    if (participants.length <= 3) {
        return VideoQuality.HIGH;
    }

    return VideoQuality.MEDIUM;
};
