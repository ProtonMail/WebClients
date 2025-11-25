import { useLocalParticipant } from '@livekit/components-react';

import { useMeetContext } from '../contexts/MeetContext';

export const useIsLocalParticipantAdmin = () => {
    const { participantsMap } = useMeetContext();
    const { localParticipant } = useLocalParticipant();

    const localParticipantFromArray = participantsMap[localParticipant?.identity ?? ''];

    const adminLevelUsers = Object.values(participantsMap).filter(
        (participant) => !!participant.IsAdmin || !!participant.IsHost
    );

    const hasAnotherAdmin = adminLevelUsers.length > 1;
    const hostIsPresent = adminLevelUsers.some((participant) => !!participant.IsHost);

    return {
        isLocalParticipantHost: !!localParticipantFromArray?.IsHost,
        isLocalParticipantAdmin: !!localParticipantFromArray?.IsAdmin,
        hasAnotherAdmin,
        hostIsPresent,
    };
};
