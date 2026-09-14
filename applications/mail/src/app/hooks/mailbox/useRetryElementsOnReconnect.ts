import { useEffect, useRef } from 'react';

import useOnline from '@proton/components/hooks/useOnline';
import { useFlag } from '@proton/unleash/useFlag';

import { MAX_ELEMENT_LIST_LOAD_RETRIES } from '../../constants';
import { retry } from '../../store/elements/elementsActions';
import { selectPendingRequest, selectRetry } from '../../store/elements/elementsSelectors';
import { useMailDispatch, useMailSelector } from '../../store/hooks';

/**
 * Once MAX_ELEMENT_LIST_LOAD_RETRIES failed load attempts pile up (while offline for example), `shouldLoadElements`
 * stays permanently false for that page since nothing ever brings the retry count back down.
 *
 * This hooks clear it as soon as the browser comes back online so the mailbox actually
 * tries to fetch again instead of looking loaded forever.
 */
export const useRetryElementsOnReconnect = () => {
    const retryElementsOnReconnectDisabled = useFlag('RetryElementsOnReconnectDisabled');
    const dispatch = useMailDispatch();
    const isOnline = useOnline();
    const wasOnlineRef = useRef(isOnline);
    const pendingRequest = useMailSelector(selectPendingRequest);
    const retryState = useMailSelector(selectRetry);

    useEffect(() => {
        const wasOffline = !wasOnlineRef.current;
        wasOnlineRef.current = isOnline;

        if (retryElementsOnReconnectDisabled) {
            return;
        }

        // Only retry the query when we have no pending request and try more than `MAX_ELEMENT_LIST_LOAD_RETRIES`
        // Prevent concurrent retries while a request is still in flight
        if (isOnline && wasOffline && !pendingRequest && retryState.count >= MAX_ELEMENT_LIST_LOAD_RETRIES) {
            dispatch(retry({ queryParameters: undefined, error: undefined }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the online/offline transition itself
    }, [isOnline]);
};
