import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import type { RequestEntry } from '@proton/pass/store/reducers';
import { selectRequest } from '@proton/pass/store/selectors';
import type { MaybePromise } from '@proton/pass/types';

export type UseActionRequestEffectOptions = {
    onStart?: <R extends RequestEntry<'start', any>>(request: R) => MaybePromise<void>;
    onSuccess?: <R extends RequestEntry<'success', any>>(request: R) => MaybePromise<void>;
    onFailure?: <R extends RequestEntry<'failure', any>>(request: R) => MaybePromise<void>;
};

/* `options` is wrapped in a ref to avoid setting it as
 * a dependency to the status change effect. We only want
 * to trigger the callbacks once. */
export const useActionRequestEffect = (requestId: string, options: UseActionRequestEffectOptions) => {
    const request = useSelector(selectRequest(requestId));
    const optionsRef = useRef<UseActionRequestEffectOptions>(options);
    optionsRef.current = options;

    const [loading, setLoading] = useState(false);
    const progress = (() => {
        if (!request) return 0;
        return request?.status === 'start' ? request.progress ?? 0 : 100;
    })();

    useEffect(() => {
        if (!request) return setLoading(false);

        switch (request.status) {
            case 'start':
                setLoading(true);
                void optionsRef.current.onStart?.(request);
                break;
            case 'success':
                setLoading(false);
                void optionsRef.current.onSuccess?.(request);
                break;
            case 'failure':
                setLoading(false);
                void optionsRef.current.onFailure?.(request);
                break;
        }
    }, [request]);

    return useMemo(() => ({ request, loading, progress }), [request, loading, progress]);
};
