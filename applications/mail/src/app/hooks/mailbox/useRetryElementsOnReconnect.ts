import { useEffect, useRef } from 'react';

import useOnline from '@proton/components/hooks/useOnline';

import { retry } from '../../store/elements/elementsActions';
import { useMailDispatch } from '../../store/hooks';

/**
 * Once MAX_ELEMENT_LIST_LOAD_RETRIES failed load attempts pile up (e.g. while offline), `shouldLoadElements`
 * stays permanently false for that page since nothing ever brings the retry count back down. Clear it as soon
 * as the browser comes back online so the mailbox actually tries to fetch again instead of looking loaded forever.
 */
export const useRetryElementsOnReconnect = () => {
    const dispatch = useMailDispatch();
    const isOnline = useOnline();
    const isFirstOnlineRenderRef = useRef(true);

    useEffect(() => {
        if (isFirstOnlineRenderRef.current) {
            isFirstOnlineRenderRef.current = false;
            return;
        }
        if (isOnline) {
            dispatch(retry({ queryParameters: undefined, error: undefined }));
        }
    }, [isOnline, dispatch]);
};
