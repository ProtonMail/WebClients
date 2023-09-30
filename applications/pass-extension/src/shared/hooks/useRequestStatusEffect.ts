import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectRequestStatus } from '@proton/pass/store';
import type { RequestType } from '@proton/pass/store/actions/with-request';
import type { Maybe } from '@proton/pass/types';

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
