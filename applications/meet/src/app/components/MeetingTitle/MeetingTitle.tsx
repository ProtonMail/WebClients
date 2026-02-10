import { useMeetContext } from '../../contexts/MeetContext';
import { useIsLocalParticipantAdmin } from '../../hooks/useIsLocalParticipantAdmin';
import { MeetingDuration } from './MeetingDuration/MeetingDuration';

import './MeetingTitle.scss';

export const MeetingTitle = () => {
    const { isLocalParticipantAdmin, isLocalParticipantHost } = useIsLocalParticipantAdmin();
    const { roomName } = useMeetContext();

    return (
        <div className="flex items-center gap-2 flex-nowrap items-baseline">
            <div className="meeting-name flex-1 text-ellipsis overflow-hidden">{roomName}</div>
            {(isLocalParticipantAdmin || isLocalParticipantHost) && <MeetingDuration />}
        </div>
    );
};
