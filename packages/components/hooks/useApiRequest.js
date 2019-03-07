import { useContext, useRef, useCallback } from 'react';
import ContextApi from 'proton-shared/lib/context/api';

const useApiRequest = () => {
    const { api } = useContext(ContextApi);
    const abortRef = useRef();

    const cancel = useCallback(() => {
        if (!abortRef.current) {
            return;
        }
        abortRef.current.abort();
        abortRef.current = undefined;
    }, []);

    const request = useCallback(
        (config) => {
            const abortController = new AbortController();
            abortRef.current = abortController;

            return api({
                signal: abortController.signal,
                ...config
            });
        },
        [api]
    );

    return {
        cancel,
        request
    };
};

export default useApiRequest;
