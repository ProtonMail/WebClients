import { useEffect, useState } from 'react';

import { useIsSpeaking } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import { useHandler } from '@proton/components/hooks/useHandler';

export const useDebouncedSpeakingStatus = (participant: Participant) => {
    const isCurrentlySpeaking = useIsSpeaking(participant);
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
