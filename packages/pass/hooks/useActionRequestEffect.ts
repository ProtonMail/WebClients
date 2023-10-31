import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import type { RequestEntry } from '@proton/pass/store/reducers';
import { selectRequest } from '@proton/pass/store/selectors';

type Options = {
    onStart?: <R extends RequestEntry<'start', any>>(request: R) => void;
    onSuccess?: <R extends RequestEntry<'success', any>>(request: R) => void;
    onFailure?: <R extends RequestEntry<'failure', any>>(request: R) => void;
};

/* `options` is wrapped in a ref to avoid setting it as
 * a dependency to the status change effect. We only want
 * to trigger the callbacks once. */
export const useActionRequestEffect = (requestId: string, options: Options) => {
    const request = useSelector(selectRequest(requestId));
    const optionsRef = useRef<Options>(options);
    optionsRef.current = options;

    const [loading, setLoading] = useState(false);
    const progress = (() => {
        if (!request) return 0;
        return request?.status === 'start' ? request.progress ?? 0 : 100;
    })();

    useEffect(() => {
        if (!request) return;

        switch (request.status) {
            case 'start':
                setLoading(true);
                return optionsRef.current.onStart?.(request);
            case 'success':
                setLoading(false);
                return optionsRef.current.onSuccess?.(request);
            case 'failure':
                setLoading(false);
                return optionsRef.current.onFailure?.(request);
        }
    }, [request]);

    return useMemo(() => ({ request, loading, progress }), [request, loading, progress]);
};
