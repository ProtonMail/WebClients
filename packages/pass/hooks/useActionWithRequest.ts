import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { AnyAction } from 'redux';

import type { RequestOptions } from '@proton/pass/store/actions/with-request';
import { type WithRequest, withRevalidate } from '@proton/pass/store/actions/with-request';
import type { RequestEntry } from '@proton/pass/store/reducers';
import { selectRequest } from '@proton/pass/store/selectors';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

export type RequestEntryFromAction<A extends WithRequest<AnyAction, any>> = A['meta']['request'] extends RequestOptions<
    infer T,
    infer D
>
    ? RequestEntry<T, D>
    : never;

type UseActionWithRequestOptions<P extends any[], A extends WithRequest<AnyAction, 'start'>> = {
    action: (requestId: string, ...args: P) => A;
    onStart?: <R extends RequestEntry<'start', any>>(request: R) => void;
    onSuccess?: <R extends RequestEntry<'success', any>>(request: R) => void;
    onFailure?: <R extends RequestEntry<'failure', any>>(request: R) => void;
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
export const useActionWithRequest = <P extends any[], R extends WithRequest<AnyAction, 'start'>>(
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
    const req = useSelector(selectRequest(requestId));

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    useEffect(() => {
        if (req === undefined) return;

        switch (req.status) {
            case 'start':
                setLoading(true);
                return optionsRef.current.onStart?.(req);
            case 'success':
                setLoading(false);
                return optionsRef.current.onSuccess?.(req);
            case 'failure':
                setLoading(false);
                return optionsRef.current.onFailure?.(req);
        }
    }, [req]);

    const progress = req?.status === 'start' ? req.progress ?? 0 : 100;

    return useMemo(() => {
        const actionCreator = (...args: P) => {
            const nextRequestId = (() => {
                if (typeof options.requestId === 'function') return options.requestId(...args);
                return requestId;
            })();

            setRequestId(nextRequestId);
            return options.action(nextRequestId, ...args);
        };

        return {
            dispatch: (...args: P) => dispatch(actionCreator(...args)),
            revalidate: (...args: P) => dispatch(withRevalidate(actionCreator(...args))),
            status: req?.status,
            progress,
            loading,
        };
    }, [requestId, req?.status, progress, loading]);
};
