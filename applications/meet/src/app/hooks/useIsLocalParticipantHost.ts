import { useMemo } from 'react';

import { useLocalParticipant } from '@livekit/components-react';

import { useMeetContext } from '../contexts/MeetContext';

export const useIsLocalParticipantHost = () => {
    const { participantsMap } = useMeetContext();
    const { localParticipant } = useLocalParticipant();

    const isLocalParticipantHost = useMemo(() => {
        const localParticipantFromArray = participantsMap[localParticipant?.identity ?? ''];

        return !!localParticipantFromArray?.IsHost || !!localParticipantFromArray?.IsAdmin;
    }, [participantsMap, localParticipant]);

    return isLocalParticipantHost;
};
