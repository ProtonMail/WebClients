import { useContext, useRef, useEffect, useCallback } from 'react';
import ContextApi from 'proton-shared/lib/context/api';

import useAsync from './useAsync';

const useApi = (fn, dependencies) => {
    const { api } = useContext(ContextApi);
    const abortRef = useRef();

    const cancel = useCallback(() => {
        if (!abortRef.current) {
            return;
        }
        abortRef.current.abort();
        abortRef.current = undefined;
    }, []);

    const { result, error, loading, run } = useAsync();

    const call = useCallback(
        (config) => {
            cancel();

            const abortController = new AbortController();
            abortRef.current = abortController;

            const promise = api({
                signal: abortController.signal,
                ...config
            });

            return run(promise);
        },
        [api, run]
    );

    const request = useCallback(
        (...args) => {
            return call(fn(...args));
        },
        [call, ...(dependencies || [])]
    );

    /**
     * If dependencies are specified, or if any dependency is changed, call the request.
     * Always set up the cancel function on unmount.
     */
    useEffect(() => {
        if (dependencies) {
            request().catch(() => {
                // catch the error to stop the "uncaught exception error"
            });
        }
        return cancel;
    }, [...(dependencies || [])]);

    return {
        result,
        error,
        loading,
        request
    };
};

export default useApi;
