import type { Participant } from 'livekit-client';

import { CircleLoader } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import { useMeetContext } from '../../contexts/MeetContext';
import { getParticipantDisplayColors } from '../../utils/getParticipantDisplayColors';
import { getParticipantInitials } from '../../utils/getParticipantInitials';

import './ParticipantPlaceholder.scss';

interface ParticipantPlaceholderProps {
    participant: Participant;
    smallView?: boolean;
}

export const ParticipantPlaceholder = ({ participant, smallView = false }: ParticipantPlaceholderProps) => {
    const { backgroundColor, profileColor } = getParticipantDisplayColors(participant);

    const { participantNameMap } = useMeetContext();

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
                    'text-center align-middle rounded-50 flex items-center justify-center color-invert text-semibold w-custom h-custom',
                    profileColor,
                    smallView ? 'text-lg' : 'text-3xl',
                    smallView ? 'radius-small' : 'radius-normal'
                )}
                style={{
                    '--w-custom': smallView ? '4rem' : '5rem',
                    '--h-custom': smallView ? '4rem' : '5rem',
                }}
            >
                {participantNameMap[participant.identity] ? (
                    getParticipantInitials(participantNameMap[participant.identity])
                ) : (
                    <CircleLoader
                        className="color-primary w-custom h-custom"
                        style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                    />
                )}
                {}
            </div>
        </div>
    );
};
