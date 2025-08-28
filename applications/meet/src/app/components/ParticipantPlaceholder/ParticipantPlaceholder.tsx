import { CircleLoader } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import { getParticipantInitials } from '../../utils/getParticipantInitials';

import './ParticipantPlaceholder.scss';

interface ParticipantPlaceholderProps {
    participantName?: string;
    smallView?: boolean;
    backgroundColor?: string;
    profileColor?: string;
    viewSize?: 'small' | 'medium' | 'large';
}

const sizeByViewSize = {
    small: 2.5,
    medium: 3,
    large: 5,
};

export const ParticipantPlaceholder = ({
    participantName,
    backgroundColor,
    profileColor,
    viewSize = 'large',
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
                    viewSize === 'large' ? 'text-3xl' : 'text-lg',
                    viewSize === 'large' ? 'radius-normal' : 'radius-small'
                )}
                style={{
                    '--w-custom': `${sizeByViewSize[viewSize]}rem`,
                    '--h-custom': `${sizeByViewSize[viewSize]}rem`,
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
