import clsx from '@proton/utils/clsx';

import { useParticipantDisplayColors } from '../../hooks/useParticipantDisplayColors';
import { getAgentDisplayInfo } from '../../utils/getAgentDisplayInfo';
import { getParticipantInitials } from '../../utils/getParticipantInitials';

interface Props {
    identity: string;
    /** Absent while the name is still being decrypted. */
    participantName?: string;
    /** An agent takes its initials and colors from the identity, so it needs no name. */
    isAgent?: boolean;
    /** CSS length used for both sides of the square. */
    size?: string;
    /** Rendered instead of the initials while the name is missing. */
    loadingNode?: React.ReactNode;
    className?: string;
}

export const ParticipantAvatar = ({
    identity,
    participantName,
    isAgent = false,
    size = '2.5rem',
    loadingNode,
    className,
}: Props) => {
    const {
        participantColors: { backgroundColor, profileTextColor },
    } = useParticipantDisplayColors(identity);

    const getContent = () => {
        if (isAgent) {
            return getAgentDisplayInfo(identity).initials;
        }

        if (!participantName && loadingNode) {
            return loadingNode;
        }

        return getParticipantInitials(participantName);
    };

    return (
        <div
            className={clsx(
                isAgent
                    ? 'agent-color color-invert rounded-lg'
                    : clsx(backgroundColor, profileTextColor, 'rounded-full'),
                'flex items-center justify-center w-custom h-custom shrink-0',
                className
            )}
            style={{ '--w-custom': size, '--h-custom': size }}
        >
            <div>{getContent()}</div>
        </div>
    );
};
