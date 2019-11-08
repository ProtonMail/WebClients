import { useEffect, useCallback } from 'react';

import useAsync from './useAsync';
import useApi from '../containers/api/useApi';

type QueryFunction<U extends any[]> = (...args: U) => { method: string; url: string };

interface Result<R, U extends any[]> {
    result: R | undefined;
    error: Error;
    loading: boolean;
    request: (...args: U) => Promise<R>;
}

const useApiResult = <R, U extends any[]>(fn: QueryFunction<U>, dependencies?: any[]): Result<R, U> => {
    const request = useApi();
    const { loading, result, error, run } = useAsync(true);

    // Either user specified dependencies or empty array to always cancel requests on unmount.
    const hookDependencies = dependencies || [];

    // Callback updates
    const requestAndSetResults = useCallback(
        (...args: U) => {
            const promise = request(fn(...args));
            run(promise);
            return promise;
        },
        [request, run, fn]
    );

    useEffect(() => {
        // If user has specified any dependencies, auto request
        if (dependencies) {
            requestAndSetResults(...(([] as unknown) as U)).catch(() => {
                // catch the error to stop the "uncaught exception error"
            });
        }
    }, [...hookDependencies]);

    if (error) {
        // Throw in render to allow the error boundary to catch it
        throw error;
    }

    return {
        result,
        error,
        loading,
        request: requestAndSetResults
    };
};

export default useApiResult;
