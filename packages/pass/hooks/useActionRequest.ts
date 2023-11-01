import { useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import type { AnyAction } from 'redux';

import type { RequestOptions } from '@proton/pass/store/actions/with-request';
import { type WithRequest, withRevalidate } from '@proton/pass/store/actions/with-request';
import type { RequestEntry } from '@proton/pass/store/reducers';

import { useActionRequestEffect } from './useActionRequestEffect';

export type RequestEntryFromAction<A extends WithRequest<AnyAction, any>> = A['meta']['request'] extends RequestOptions<
    infer T,
    infer D
>
    ? RequestEntry<T, D>
    : never;

type UseActionWithRequestOptions<P extends any[], A extends WithRequest<AnyAction, 'start'>> = {
    action: (...args: P) => A;
    initialRequestId?: string;
    onStart?: <R extends RequestEntry<'start', any>>(request: R) => void;
    onSuccess?: <R extends RequestEntry<'success', any>>(request: R) => void;
    onFailure?: <R extends RequestEntry<'failure', any>>(request: R) => void;
};

/*
 * Passing `initialRequestId` allows tracking the action request immediately before any dispatch.
 * The passed-in callbacks `onStart`, `onSuccess`, and `onFailure`, can be used to perform tasks
 * like controlling loading spinners or handling request responses or errors.
 */
export const useActionRequest = <P extends any[], R extends WithRequest<AnyAction, 'start'>>(
    options: UseActionWithRequestOptions<P, R>
) => {
    const dispatch = useDispatch();
    const optionsRef = useRef<UseActionWithRequestOptions<P, R>>(options);
    optionsRef.current = options;

    const [requestId, setRequestId] = useState<string>(options.initialRequestId ?? '');

    const { request, loading, progress } = useActionRequestEffect(requestId, {
        onStart: optionsRef.current.onStart,
        onSuccess: optionsRef.current.onSuccess,
        onFailure: optionsRef.current.onFailure,
    });

    return useMemo(() => {
        const actionCreator = (...args: P) => {
            const action = options.action(...args);
            setRequestId(action.meta.request.id);
            return action;
        };

        return {
            dispatch: (...args: P) => dispatch(actionCreator(...args)),
            revalidate: (...args: P) => dispatch(withRevalidate(actionCreator(...args))),
            progress,
            loading,
        };
    }, [request, progress, loading]);
};
