import type { Participant } from '@proton-meet/livekit-client';

import { IcThreeDotsHorizontal } from '@proton/icons';

import { SpeakerIndicator } from '../components/SpeakerIndicator/SpeakerIndicator';

interface SpeakingIndicatorProps {
    size: number;
    participant: Participant;
    indicatorSize?: number;
    stopped?: boolean;
}

export const SpeakingIndicator = ({
    size,
    participant,
    indicatorSize = 24,
    stopped = false,
}: SpeakingIndicatorProps) => {
    return (
        <div
            className="speaking-indicator-body color-success bg-weak border-weak border-radius-full size-12 flex items-center justify-center rounded-full"
            style={{ width: size, height: size }}
        >
            {stopped ? (
                <IcThreeDotsHorizontal size={6} />
            ) : (
                <SpeakerIndicator size={indicatorSize} participant={participant} />
            )}
        </div>
    );
};
