import { useLocalParticipant } from '@livekit/components-react';

import { useMeetContext } from '../contexts/MeetContext';
import { isLocalParticipantAdmin } from '../utils/isLocalParticipantAdmin';

export const useIsLocalParticipantAdmin = () => {
    const { participantsMap } = useMeetContext();
    const { localParticipant } = useLocalParticipant();

    const result = isLocalParticipantAdmin(participantsMap, localParticipant);

    return result;
};
