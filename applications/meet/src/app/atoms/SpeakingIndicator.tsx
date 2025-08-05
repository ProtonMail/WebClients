import type { Participant } from '@proton-meet/livekit-client';

import { SpeakerIndicator } from '../components/SpeakerIndicator/SpeakerIndicator';

interface SpeakingIndicatorProps {
    size: number;
    participant: Participant;
}

export const SpeakingIndicator = ({ size, participant }: SpeakingIndicatorProps) => {
    return (
        <div
            className="color-success bg-weak border-weak border-radius-full size-12 flex items-center justify-center rounded-full"
            style={{ width: size, height: size }}
        >
            <SpeakerIndicator size={24} participant={participant} />
        </div>
    );
};
