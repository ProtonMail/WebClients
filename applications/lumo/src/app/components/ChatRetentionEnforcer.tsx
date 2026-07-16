import { useEffect } from 'react';

import { useLumoPlan } from '../hooks/useLumoPlan';
import { useIsGuest } from '../providers/IsGuestProvider';
import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { expireConversationsRequest } from '../redux/slices/core/conversations';

/**
 * Triggers client-side deletion of free-user chats that are past the retention grace period.
 * Runs after each successful spaces pull so expired chats are removed locally and on the server.
 */
export const ChatRetentionEnforcer = () => {
    const dispatch = useLumoDispatch();
    const isGuest = useIsGuest();
    const { hasLumoPlus, isLumoPlanLoading } = useLumoPlan();
    const reduxLoadedFromIdb = useLumoSelector((state) => state.initialization.reduxLoadedFromIdb);
    const lastSpacesPullAt = useLumoSelector((state) => state.initialization.lastSpacesPullAt);

    useEffect(() => {
        if (isGuest || isLumoPlanLoading || hasLumoPlus || !reduxLoadedFromIdb || lastSpacesPullAt === 0) {
            return;
        }

        console.log('Dispatching check for expireConversationsRequest');
        dispatch(expireConversationsRequest({ hasLumoPlus }));
    }, [dispatch, hasLumoPlus, isGuest, isLumoPlanLoading, lastSpacesPullAt, reduxLoadedFromIdb]);

    return null;
};

export default ChatRetentionEnforcer;
