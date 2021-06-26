import { useCallback } from 'react';
import useAsync from './useAsync';
import useApi from './useApi';
import { QueryFunction } from './useApiResult';

interface Result<R, U extends any[]> {
    loading: boolean;
    request: (...args: U) => Promise<R>;
}

const useApiWithoutResult = <R, F extends QueryFunction = QueryFunction>(fn: F): Result<R, Parameters<F>> => {
    const request = useApi();
    const { loading, run } = useAsync(false);

    const requestAndSetLoading = useCallback(
        (...args) => {
            const promise = request<R>(fn(...args));
            run(promise);
            return promise;
        },
        [request, run, fn]
    );

    return {
        loading,
        request: requestAndSetLoading,
    };
};

export default useApiWithoutResult;
