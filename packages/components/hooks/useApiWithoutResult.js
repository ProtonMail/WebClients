import { useEffect, useCallback } from 'react';

import useAsync from './useAsync';
import useApiRequest from './useApiRequest';

const useApiWithoutResult = (fn) => {
    const { request, cancel } = useApiRequest();
    const { loading, run } = useAsync(false);

    const requestAndSetLoading = useCallback(
        (...args) => {
            cancel();
            const promise = request(fn(...args));
            run(promise);
            return promise;
        },
        [request, run, fn]
    );

    useEffect(() => {
        return cancel;
    }, []);

    return {
        loading,
        request: requestAndSetLoading
    };
};

export default useApiWithoutResult;
