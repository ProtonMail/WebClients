import { useEffect, useState } from 'react';

import { useSpeakingParticipants } from '@livekit/components-react';
import type { Participant } from '@proton-meet/livekit-client';

import { useHandler } from '@proton/components/hooks/useHandler';

export const useDebouncedSpeakingStatus = (participant: Participant) => {
    const speakingParticipants = useSpeakingParticipants();

    const isCurrentlySpeaking = speakingParticipants.some((p) => p.identity === participant.identity);

    const [isSpeaking, setIsSpeaking] = useState(false);

    const debouncedSetFalse = useHandler(() => setIsSpeaking(false), { debounce: 1000 });

    // The speaking status is debounced to avoid flickering
    useEffect(() => {
        if (isCurrentlySpeaking) {
            setIsSpeaking(true);
            debouncedSetFalse.cancel?.();
        } else {
            debouncedSetFalse();
        }
    }, [isCurrentlySpeaking, debouncedSetFalse]);

    return isSpeaking;
};
