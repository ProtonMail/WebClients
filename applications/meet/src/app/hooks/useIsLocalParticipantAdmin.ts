import { useLocalParticipant } from '@livekit/components-react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantsMap } from '@proton/meet/store/slices/meetingInfo';

import { isLocalParticipantAdmin } from '../utils/isLocalParticipantAdmin';

export const useIsLocalParticipantAdmin = () => {
    const participantsMap = useMeetSelector(selectParticipantsMap);
    const { localParticipant } = useLocalParticipant();

    const result = isLocalParticipantAdmin(participantsMap, localParticipant);

    return result;
};
