import type { Participant } from 'livekit-client';

import clsx from '@proton/utils/clsx';

import { getParticipantDisplayColors } from '../../utils/getParticipantDisplayColors';

import './ParticipantPlaceholder.scss';

interface ParticipantPlaceholderProps {
    participant: Participant;
}

export const ParticipantPlaceholder = ({ participant }: ParticipantPlaceholderProps) => {
    const nameParts = participant.name?.split(' ');

    const { backgroundColor, profileColor } = getParticipantDisplayColors(participant);

    return (
        <div
            className={clsx(
                'flex items-center justify-center w-full h-full rounded-xl',
                backgroundColor,
                'participant-placeholder'
            )}
        >
            <div
                className={clsx(
                    'text-center align-middle rounded-50 flex items-center justify-center color-invert text-semibold text-3xl w-custom h-custom',
                    profileColor
                )}
                style={{
                    '--w-custom': '5rem',
                    '--h-custom': '5rem',
                }}
            >
                {nameParts?.[0]?.charAt(0)}
                {nameParts?.[1]?.charAt(0)}
            </div>
        </div>
    );
};
