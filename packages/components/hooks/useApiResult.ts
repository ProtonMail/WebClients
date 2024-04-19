import { useCallback, useEffect, useState } from 'react';

import useApi from './useApi';
import useAsync from './useAsync';

export type QueryFunction = (...args: any[]) => { method: string; url: string };

interface Result<R, U extends any[]> {
    result: R | undefined;
    error: Error;
    loading: boolean;
    request: (...args: U) => Promise<R>;
}

const useApiResult = <R, F extends QueryFunction = QueryFunction>(
    fn: QueryFunction,
    dependencies?: any[],
    throwOnError = true,
    lazy = false
): Result<R, Parameters<F>> => {
    const request = useApi();
    const { loading, result, error, run } = useAsync(true);
    const [calledManually, setCalledManually] = useState(!lazy);

    // Either user specified dependencies or empty array to always cancel requests on unmount.
    const hookDependencies = dependencies || [];

    // Callback updates
    const requestAndSetResults = useCallback(
        (...args: Parameters<F>) => {
            const promise = request<R>(fn(...args));
            void run(promise);
            setCalledManually(true);
            return promise;
        },
        [request, run, fn]
    );

    useEffect(() => {
        if (!calledManually) {
            return;
        }

        // If user has specified any dependencies, auto request
        if (dependencies) {
            requestAndSetResults(...([] as unknown as Parameters<F>)).catch(() => {
                // catch the error to stop the "uncaught exception error"
            });
        }
    }, [...hookDependencies]);

    if (error && throwOnError) {
        // Throw in render to allow the error boundary to catch it
        throw error;
    }

    return {
        result,
        error,
        loading,
        request: requestAndSetResults,
    };
};

export default useApiResult;
