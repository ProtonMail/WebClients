import { useCallback } from 'react';

import { useEventManager } from '@proton/components/index';
import { updateLastUnseenEventId } from '@proton/mail/store/labels/actions';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';

export const useMarkCategorySeen = () => {
    const dispatch = useDispatch();
    const { getEventID } = useEventManager();

    return useCallback(
        (labelID: string) => {
            const lastEventID = getEventID();
            if (!lastEventID) {
                return;
            }
            void dispatch(updateLastUnseenEventId({ labelID, lastEventID }));
        },
        [dispatch, getEventID]
    );
};
