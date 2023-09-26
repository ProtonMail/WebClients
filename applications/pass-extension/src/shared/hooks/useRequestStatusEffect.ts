import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectRequestStatus } from '@proton/pass/store';
import type { RequestType, WithRequest } from '@proton/pass/store/actions/with-request';
import type { Maybe } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string';

type Options = {
    onStart?: () => void;
    onSuccess?: () => void;
    onFailure?: () => void;
};

/* `options` is wrapped in a ref to avoid setting it as
 * a dependency to the status change effect. We only want
 * to trigger the callbacks once. */
export const useRequestStatusEffect = (requestId: string, options: Options): Maybe<RequestType> => {
    const status = useSelector(selectRequestStatus(requestId));
    const optionsRef = useRef<Options>(options);

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    useEffect(() => {
        switch (status) {
            case 'start':
                return optionsRef.current.onStart?.();
            case 'success':
                return optionsRef.current.onSuccess?.();
            case 'failure':
                return optionsRef.current.onFailure?.();
        }
    }, [status]);

    return status;
};

export const useActionWithRequest = <P extends any[], R extends WithRequest>(
    actionCreator: (requestId: string, ...args: P) => R,
    options: Options & { requestId?: string }
) => {
    const dispatch = useDispatch();
    const requestId = useMemo(() => options.requestId ?? uniqueId(12), []);
    const [loading, setLoading] = useState(false);

    const status = useSelector(selectRequestStatus(requestId));
    const optionsRef = useRef<Options>(options);

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
                dispatch(actionCreator(requestId, ...args));
            },
            status,
            loading,
        }),
        [requestId, status, loading]
    );
};
