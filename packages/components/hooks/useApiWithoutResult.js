import { useCallback } from 'react';

import useAsync from './useAsync';
import useApi from './useApi';

const useApiWithoutResult = (fn) => {
    const request = useApi();
    const { loading, run } = useAsync(false);

    const requestAndSetLoading = useCallback(
        (...args) => {
            const promise = request(fn(...args));
            run(promise);
            return promise;
        },
        [request, run, fn]
    );

    return {
        loading,
        request: requestAndSetLoading
    };
};

export default useApiWithoutResult;
