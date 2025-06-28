import { useCallback } from 'react';

import { useApi } from '@proton/components';

import { useDebouncedFunction } from '../_utils';

export default function useDebouncedRequest() {
    const api = useApi();
    const debouncedFunction = useDebouncedFunction();
    const debouncedRequest = useCallback(
        <T>(args: object, abortSignal?: AbortSignal): Promise<T> => {
            return debouncedFunction(
                (signal: AbortSignal) => {
                    return api<T>({ signal, ...args });
                },
                args,
                abortSignal
            );
            // DO NOT add debouncedFunction to the dependency array
            // debouncedFunction is returning a new reference each time the hook is called
            // eslint-disable-next-line
        },
        [api]
    );

    return debouncedRequest;
}
