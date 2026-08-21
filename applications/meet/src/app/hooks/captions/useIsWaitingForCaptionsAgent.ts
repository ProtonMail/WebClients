import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectJoinedRoom } from '@proton/meet/store/slices/connectionSlice';
import { selectCaptionsAgentPresent } from '@proton/meet/store/slices/participants/agentParticipantsSlice';

import { useCaptionsPreference } from './useCaptionsPreference';

export const useIsWaitingForCaptionsAgent = (): boolean => {
    const { wantsCaptions } = useCaptionsPreference();
    const agentPresent = useMeetSelector(selectCaptionsAgentPresent);
    const joinedRoom = useMeetSelector(selectJoinedRoom);

    return joinedRoom && wantsCaptions && !agentPresent;
};
