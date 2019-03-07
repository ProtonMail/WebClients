import { useEffect, useCallback } from 'react';

import useAsync from './useAsync';
import useApiRequest from './useApiRequest';

const useApi = (fn, dependencies) => {
    const { request, cancel } = useApiRequest();
    const { loading, result, error, run } = useAsync(true);

    // Either user specified dependencies or empty array to always cancel requests on unmount.
    const hookDependencies = dependencies || [];

    // Callback updates
    const requestAndSetResults = useCallback(
        (...args) => {
            cancel();
            const promise = request(fn(...args));
            run(promise);
            return promise;
        },
        [request, run, fn]
    );

    useEffect(() => {
        // If user has specified any dependencies, auto request
        if (dependencies) {
            requestAndSetResults().catch(() => {
                // catch the error to stop the "uncaught exception error"
            });
        }
        return cancel;
    }, [...hookDependencies]);

    return {
        result,
        error,
        loading,
        request: requestAndSetResults
    };
};

export default useApi;
