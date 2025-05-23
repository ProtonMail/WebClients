import type { Participant } from 'livekit-client';

import clsx from '@proton/utils/clsx';

import './ParticipantPlaceholder.scss';

interface ParticipantPlaceholderProps {
    participant: Participant;
    index: number;
}

export const ParticipantPlaceholder = ({ participant, index }: ParticipantPlaceholderProps) => {
    const nameParts = participant.name?.split(' ');

    return (
        <div
            className={clsx(
                'flex items-center justify-center w-full h-full rounded-xl',
                `meet-background-${(index % 6) + 1}`,
                'participant-placeholder'
            )}
        >
            <div
                className={clsx(
                    'text-center align-middle rounded-50 flex items-center justify-center color-invert text-semibold text-3xl w-custom h-custom',
                    `profile-background-${(index % 6) + 1}`
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
