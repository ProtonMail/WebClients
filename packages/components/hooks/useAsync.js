import { useCallback, useReducer, useRef } from 'react';
import useIsMounted from './useIsMounted';

const DEFAULT_STATE = {
    loading: false,
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'loading':
            return {
                ...state,
                loading: true,
            };
        case 'success':
            return {
                error: undefined,
                loading: false,
                result: action.payload,
            };
        default:
        case 'error':
            return {
                result: undefined,
                loading: false,
                error: action.payload,
            };
    }
};

const useAsync = (setResults = true) => {
    const [{ loading, result, error }, dispatch] = useReducer(reducer, DEFAULT_STATE);
    const isMounted = useIsMounted();
    const promiseRef = useRef();

    const run = useCallback(async (promise) => {
        const isCurrentPromise = () => promiseRef.current === promise;
        promiseRef.current = promise;

        dispatch({ type: 'loading' });
        try {
            const data = await promise;
            if (isMounted() && isCurrentPromise()) {
                dispatch({ type: 'success', payload: setResults ? data : undefined });
            }
            return data;
        } catch (e) {
            if (isMounted() && isCurrentPromise() && e.name !== 'AbortError') {
                dispatch({ type: 'error', payload: setResults ? e : undefined });
            }
            throw e;
        }
    }, []);

    return {
        result,
        error,
        loading,
        run,
    };
};

export default useAsync;
