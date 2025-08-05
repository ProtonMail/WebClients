import { useEffect, useState } from 'react';

import type { Participant } from '@proton-meet/livekit-client';

export const useParticipantAudioLevel = (participant: Participant) => {
    const [audioLevel, setAudioLevel] = useState(participant.audioLevel);

    useEffect(() => {
        const interval = setInterval(() => {
            setAudioLevel(participant.audioLevel ?? 0);
        }, 100);

        return () => {
            clearInterval(interval);
        };
    }, [participant]);

    return audioLevel;
};
