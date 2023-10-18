import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import type { RequestType } from '@proton/pass/store/actions/with-request';
import type { RequestEntry } from '@proton/pass/store/reducers';
import { selectRequest } from '@proton/pass/store/selectors';
import type { Maybe } from '@proton/pass/types';

type Options = {
    onStart?: <R extends RequestEntry<'start', any>>(request: R) => void;
    onSuccess?: <R extends RequestEntry<'success', any>>(request: R) => void;
    onFailure?: <R extends RequestEntry<'failure', any>>(request: R) => void;
};

/* `options` is wrapped in a ref to avoid setting it as
 * a dependency to the status change effect. We only want
 * to trigger the callbacks once. */
export const useRequestStatusEffect = (requestId: string, options: Options): Maybe<RequestType> => {
    const req = useSelector(selectRequest(requestId));
    const optionsRef = useRef<Options>(options);

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    useEffect(() => {
        if (!req) return;

        switch (req.status) {
            case 'start':
                return optionsRef.current.onStart?.(req);
            case 'success':
                return optionsRef.current.onSuccess?.(req);
            case 'failure':
                return optionsRef.current.onFailure?.(req);
        }
    }, [req]);

    return req?.status;
};
