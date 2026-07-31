import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import clsx from '@proton/utils/clsx';

import { useParticipantDisplayColors } from '../../../hooks/useParticipantDisplayColors';
import { getParticipantInitials } from '../../../utils/getParticipantInitials';

const getInitials = (participantName: string) => {
    return participantName ? (
        getParticipantInitials(participantName)
    ) : (
        <CircleLoader
            aria-hidden="true"
            className="color-primary w-custom h-custom"
            style={{ '--w-custom': '1rem', '--h-custom': '1rem' }}
        />
    );
};

type Props = {
    participantName: string;
    identity: string;
    isLocal?: boolean;
    statusNode: React.ReactNode;
    children?: React.ReactNode;
};

export const ParticipantNameWithInitials = ({
    participantName,
    identity,
    isLocal = false,
    statusNode,
    children,
}: Props) => {
    const {
        participantColors: { backgroundColor, profileTextColor },
    } = useParticipantDisplayColors(identity);

    const displayName = participantName ?? c('Info').t`Loading...`;

    return (
        <div className="flex flex-nowrap gap-2 h-custom" style={{ '--h-custom': 'fit-content', flexShrink: 0 }}>
            <div
                className={clsx(
                    backgroundColor,
                    profileTextColor,
                    'rounded-full flex items-center justify-center w-custom h-custom shrink-0'
                )}
                style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
            >
                <div>{getInitials(participantName)}</div>
            </div>
            <div className="flex flex-column justify-center">
                <div className="text-ellipsis w-full" title={displayName}>
                    {displayName} {isLocal ? c('Info').t`(You)` : null}
                </div>
                {statusNode}
            </div>
            <div className="flex flex-nowrap items-center ml-auto gap-1 shrink-0">{children}</div>
        </div>
    );
};
