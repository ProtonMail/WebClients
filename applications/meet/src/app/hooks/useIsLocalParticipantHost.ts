import { useLocalParticipant } from '@livekit/components-react';

import { useMeetContext } from '../contexts/MeetContext';

export const useIsLocalParticipantHost = () => {
    const { participantsMap } = useMeetContext();
    const { localParticipant } = useLocalParticipant();

    const localParticipantFromArray = participantsMap[localParticipant?.identity ?? ''];
    const isLocalParticipantHost = !!localParticipantFromArray?.IsHost || !!localParticipantFromArray?.IsAdmin;

    return isLocalParticipantHost;
};
