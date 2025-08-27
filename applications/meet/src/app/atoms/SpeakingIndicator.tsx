import type { Participant } from '@proton-meet/livekit-client';

import { SpeakerIndicator } from '../components/SpeakerIndicator/SpeakerIndicator';

interface SpeakingIndicatorProps {
    size: number;
    participant: Participant;
    indicatorSize?: number;
}

export const SpeakingIndicator = ({ size, participant, indicatorSize = 24 }: SpeakingIndicatorProps) => {
    return (
        <div
            className="color-success bg-weak border-weak border-radius-full size-12 flex items-center justify-center rounded-full"
            style={{ width: size, height: size }}
        >
            <SpeakerIndicator size={indicatorSize} participant={participant} />
        </div>
    );
};
