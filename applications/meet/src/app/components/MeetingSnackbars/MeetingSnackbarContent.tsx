import type { ReactNode } from 'react';

import { ParticipantAvatar } from '../../atoms/ParticipantAvatar/ParticipantAvatar';

interface Props {
    identity: string;
    participantName?: string;
    isAgent?: boolean;
    title: ReactNode;
    body: ReactNode;
}

export const MeetingSnackbarContent = ({ identity, participantName, isAgent, title, body }: Props) => (
    <div className="flex flex-nowrap items-center gap-2 flex-1 min-w-0">
        <ParticipantAvatar
            identity={identity}
            participantName={participantName}
            isAgent={isAgent}
            className="color-invert self-start"
        />
        <div className="flex flex-column flex-nowrap flex-1 min-w-0">
            <div className="text-semibold color-norm text-ellipsis">{title}</div>
            <div className="color-weak text-break text-ellipsis-two-lines">{body}</div>
        </div>
    </div>
);
