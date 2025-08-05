import { useEffect, useRef, useState } from 'react';

import { useSpeakingParticipants } from '@livekit/components-react';
import type { Participant } from '@proton-meet/livekit-client';

export const useDebouncedSpeakingStatus = (participant: Participant) => {
    const speakingParticipants = useSpeakingParticipants();

    const isCurrentlySpeaking = speakingParticipants.some((p) => p.identity === participant.identity);

    const [isSpeaking, setIsSpeaking] = useState(false);
    const speakingTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isCurrentlySpeaking) {
            setIsSpeaking(true);
            if (speakingTimeout.current) {
                clearTimeout(speakingTimeout.current);
                speakingTimeout.current = null;
            }
        } else {
            if (speakingTimeout.current) {
                clearTimeout(speakingTimeout.current);
            }
            speakingTimeout.current = setTimeout(() => {
                setIsSpeaking(false);
            }, 1000);
        }
        return () => {
            if (speakingTimeout.current) {
                clearTimeout(speakingTimeout.current);
            }
        };
    }, [isCurrentlySpeaking]);

    return isSpeaking;
};
