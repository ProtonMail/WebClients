import { CircleLoader } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import { getParticipantInitials } from '../../utils/getParticipantInitials';

import './ParticipantPlaceholder.scss';

interface ParticipantPlaceholderProps {
    participantName?: string;
    smallView?: boolean;
    backgroundColor?: string;
    profileColor?: string;
}

export const ParticipantPlaceholder = ({
    participantName,
    smallView = false,
    backgroundColor,
    profileColor,
}: ParticipantPlaceholderProps) => {
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
                    '--w-custom': smallView ? '3rem' : '5rem',
                    '--h-custom': smallView ? '3rem' : '5rem',
                }}
            >
                {participantName ? (
                    getParticipantInitials(participantName)
                ) : (
                    <CircleLoader
                        className="color-primary w-custom h-custom"
                        style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                    />
                )}
            </div>
        </div>
    );
};
