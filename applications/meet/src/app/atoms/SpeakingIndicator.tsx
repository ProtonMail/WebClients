import type { Participant } from 'livekit-client';

import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';
import clsx from '@proton/utils/clsx';

import { SpeakerIndicator } from '../components/SpeakerIndicator/SpeakerIndicator';

interface SpeakingIndicatorProps {
    size: number;
    participant: Participant;
    indicatorSize?: number;
    stopped?: boolean;
    /**
     * Set opacity of SpeakingIndicator to opacity-80
     * More info: https://design-system.protontech.ch/?path=/docs/css-utilities-opacity--opacity
     *
     * @default false
     */
    opacity?: boolean;
}

export const SpeakingIndicator = ({
    size,
    participant,
    indicatorSize = 24,
    stopped = false,
    opacity = false,
}: SpeakingIndicatorProps) => {
    return (
        <div
            className={clsx(
                'speaking-indicator-body color-success bg-weak border-weak border-radius-full flex items-center justify-center rounded-full',
                'w-custom h-custom',
                opacity && 'opacity-80'
            )}
            style={{ '--w-custom': `${size}px`, '--h-custom': `${size}px` }}
        >
            {stopped ? (
                <IcThreeDotsHorizontal size={6} />
            ) : (
                <SpeakerIndicator size={indicatorSize} participant={participant} />
            )}
        </div>
    );
};
