import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectRequestStatus } from '@proton/pass/store';
import type { WithRequest } from '@proton/pass/store/actions/with-request';
import { uniqueId } from '@proton/pass/utils/string';

type UseActionWithRequestOptions<P extends any[], R extends WithRequest> = {
    action: (requestId: string, ...args: P) => R;
    onStart?: () => void;
    onSuccess?: () => void;
    onFailure?: () => void;
    requestId?: ((...args: P) => string) | string;
};

/**
 * `useActionWithRequest` is a versatile hook designed for tracking and responding to actions
 * containing request metadata. It provides flexibility in generating unique request IDs.
 *
 * If `options.requestId` is not provided, the hook generates a random unique ID by default.
 * You can further tailor the request ID creation process by passing either a string or a
 * function that dynamically computes the request ID based on the action creator parameters.
 * This is especially valuable when you need to guarantee deterministic request IDs, such as
 * preventing the inadvertent resending of an action while it's already in progress.
 *
 * Returns:
 * - `dispatch`: A function that dispatches actions with the generated request ID.
 * - `status`: The current status of the request (start, success, failure).
 * - `loading`: A boolean indicating whether the request is currently in progress.
 *
 * ⚠️ Ensure that your action creators accept a `requestId` as their first parameter or
 * utilize the `withRequestStart|Failure|Success` action preparators when building the
 * action creators.
 */
export const useActionWithRequest = <P extends any[], R extends WithRequest>(
    options: UseActionWithRequestOptions<P, R>
) => {
    const optionsRef = useRef<UseActionWithRequestOptions<P, R>>(options);
    const [loading, setLoading] = useState(false);

    const [requestId, setRequestId] = useState<string>(
        (() => {
            if (options.requestId && typeof options.requestId === 'string') return options.requestId;
            if (!options.requestId) return uniqueId(12);
            return '';
        })()
    );

    const dispatch = useDispatch();
    const status = useSelector(selectRequestStatus(requestId));

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    useEffect(() => {
        switch (status) {
            case 'start':
                setLoading(true);
                return optionsRef.current.onStart?.();
            case 'success':
                setLoading(false);
                return optionsRef.current.onSuccess?.();
            case 'failure':
                setLoading(false);
                return optionsRef.current.onFailure?.();
        }
    }, [status]);

    return useMemo(
        () => ({
            dispatch: (...args: P) => {
                const nextRequestId = (() => {
                    if (typeof options.requestId === 'function') return options.requestId(...args);
                    return requestId;
                })();

                setRequestId(nextRequestId);
                dispatch(options.action(nextRequestId, ...args));
            },
            status,
            loading,
        }),
        [requestId, status, loading]
    );
};
