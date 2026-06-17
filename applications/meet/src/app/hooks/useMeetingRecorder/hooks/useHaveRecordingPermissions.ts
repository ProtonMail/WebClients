import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';

import { useIsLocalParticipantAdmin } from '../../useIsLocalParticipantAdmin';

export const useHaveRecordingPermissions = (): boolean => {
    const { isPaidUser } = useMeetSelector(selectSubscriptionStatus);
    const { isLocalParticipantAdmin, isLocalParticipantHost } = useIsLocalParticipantAdmin();

    return isPaidUser && (isLocalParticipantAdmin || isLocalParticipantHost);
};
