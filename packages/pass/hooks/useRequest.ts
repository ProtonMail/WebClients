import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ActionCreatorWithPreparedPayload, PayloadAction } from '@reduxjs/toolkit';

import { useEnsureMounted } from '@proton/pass/hooks/useEnsureMounted';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { withAsyncRequest, withRevalidate } from '@proton/pass/store/request/enhancers';
import type { RequestFlow } from '@proton/pass/store/request/flow';
import type { RequestAsyncResult, RequestMeta, RequestSuccessDTO, WithRequest } from '@proton/pass/store/request/types';
import { selectRequest } from '@proton/pass/store/selectors';
import type { MaybeNull, MaybePromise } from '@proton/pass/types/utils';
import { pipe } from '@proton/pass/utils/fp/pipe';

export const useActionRequestDispatch = <
    IntentActionPA extends ActionCreatorWithPreparedPayload<any[], any, string, never, RequestMeta<'start', any>>,
    SuccessActionPA extends ActionCreatorWithPreparedPayload<any[], any, string, never, RequestMeta<'success', any>>,
    FailureActionPA extends ActionCreatorWithPreparedPayload<any[], any, string, never, RequestMeta<'failure', any>>,
>(
    intent: IntentActionPA
) => {
    type SuccessAction = ReturnType<SuccessActionPA>;
    type FailureAction = ReturnType<FailureActionPA>;
    const dispatch = useDispatch();

    return (...params: Parameters<IntentActionPA>): Promise<RequestAsyncResult<SuccessAction, FailureAction>> =>
        dispatch(withAsyncRequest(intent.apply(null, params))) as any;
};

export const useRequestDispatch = <T extends RequestFlow<any, any, any>>({ intent }: T) =>
    useActionRequestDispatch<T['intent'], T['success'], T['failure']>(intent);

export type UseActionRequestOptions<
    IntentAction extends WithRequest<PayloadAction, 'start', any> = any,
    SuccessAction extends WithRequest<PayloadAction, 'success', any> = any,
    FailureAction extends WithRequest<PayloadAction, 'failure', any> = any,
> = {
    loading?: boolean;
    requestId?: string;
    onStart?: (data: IntentAction['payload']) => MaybePromise<void>;
    onSuccess?: (data: RequestSuccessDTO<SuccessAction>) => MaybePromise<void>;
    onFailure?: (error: 'error' extends keyof FailureAction ? FailureAction['error'] : undefined) => MaybePromise<void>;
};

/* `options` is wrapped in a ref to avoid setting it as
 * a dependency to the status change effect. We only want
 * to trigger the callbacks once. */
export const useActionRequest = <
    IntentActionPA extends ActionCreatorWithPreparedPayload<any[], any, string, never, RequestMeta<'start', any>>,
    SuccessActionPA extends ActionCreatorWithPreparedPayload<any[], any, string, never, RequestMeta<'success', any>>,
    FailureActionPA extends ActionCreatorWithPreparedPayload<any[], any, string, never, RequestMeta<'failure', any>>,
>(
    intent: IntentActionPA,
    options?: UseActionRequestOptions<
        ReturnType<IntentActionPA>,
        ReturnType<SuccessActionPA>,
        ReturnType<FailureActionPA>
    >
) => {
    type Params = Parameters<IntentActionPA>;
    type IntentAction = ReturnType<IntentActionPA>;
    type SuccessAction = ReturnType<SuccessActionPA>;
    type FailureAction = ReturnType<FailureActionPA>;
    type Result = RequestAsyncResult<SuccessAction, FailureAction>;

    const dispatch = useDispatch();
    const ensureMounted = useEnsureMounted();

    const [requestID, setRequestID] = useState<MaybeNull<string>>(options?.requestId ?? null);
    const pending = useRef<MaybeNull<Promise<any>>>(null);

    const request = useSelector(selectRequest(requestID ?? ''));
    const [loading, setLoading] = useState(options?.loading ?? request?.status === 'start');
    const [error, setError] = useState(false);

    const progress = (() => {
        if (request?.status === 'start') return request.progress ?? 0;
        return 0;
    })();

    const optionsRef = useStatefulRef(options);

    useEffect(() => {
        if (!request) return setLoading(false);
    }, [request]);

    return useMemo(() => {
        const actionCreator = (...args: Params) => intent(...args) as IntentAction;

        const onResult = ensureMounted((result: Result) => {
            setLoading(false);

            switch (result.type) {
                case 'success':
                    setError(false);
                    void optionsRef.current?.onSuccess?.(result.data);
                    break;

                case 'failure':
                    setError(true);
                    void optionsRef.current?.onFailure?.(result.error);
                    break;
            }

            pending.current = null;
        });

        const onError = ensureMounted(() => {
            setLoading(false);
            setError(true);
            pending.current = null;
        });

        const dispatchAsync = (action: IntentAction): void => {
            const request = action.meta.request;

            setRequestID(request.id);
            setLoading(true);
            setError(false);

            try {
                const job = dispatch(action) as unknown as Promise<Result>;

                if (job !== pending.current) {
                    void optionsRef.current?.onStart?.(action.payload);
                    pending.current = job;
                    void job.then(onResult).catch(onError);
                }
            } catch {}
        };

        return {
            dispatch: pipe(actionCreator, withAsyncRequest, dispatchAsync),
            revalidate: pipe(actionCreator, withRevalidate, withAsyncRequest, dispatchAsync),
            progress,
            loading,
            error,
        };
    }, [progress, loading, error]);
};

type UseRequestOptions<T extends RequestFlow<any, any, any>> = {
    /** Initial loading state */
    loading?: boolean;
    /** Initial request parameters
     * - Pass `IntentDTO` if request key preparator requires parameters
     * - Pass true to start tracking immediately if no parameters needed
     * - Omit to skip initial tracking */
    initial?: Parameters<T['requestID']>[0] extends infer U ? (U extends void ? true : U) : never;
    /** Called when request is initiated. Receives intent action request metadata */
    onStart?: (data: ReturnType<T['intent']>['payload']) => MaybePromise<void>;
    /** Called when request fails. Receives failure action request metadata */
    onFailure?: (
        error: 'error' extends keyof ReturnType<T['failure']> ? ReturnType<T['failure']>['error'] : undefined
    ) => MaybePromise<void>;
    /** Called when request succeeds. Receives success action request metadata */
    onSuccess?: (data: ReturnType<T['success']>['payload']) => MaybePromise<void>;
};

export const useRequest = <T extends RequestFlow<any, any, any>>(
    actions: T,
    { initial, ...options }: UseRequestOptions<T> = {}
) => {
    const requestId = (() => {
        if (!initial) return;
        return actions.requestID(initial === true ? undefined : initial);
    })();

    return useActionRequest<T['intent'], T['success'], T['failure']>(actions.intent, {
        ...options,
        requestId,
    });
};
