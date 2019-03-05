import { useCallback, useReducer } from 'react';
import useIsMounted from './useIsMounted';

const DEFAULT_STATE = {
    loading: false
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'loading':
            return {
                ...state,
                loading: true
            };
        case 'success':
            return {
                error: undefined,
                loading: false,
                result: action.payload
            };
        case 'error':
            return {
                result: undefined,
                loading: false,
                error: action.payload
            };
    }
};

const useAsync = () => {
    const [{ loading, result, error }, dispatch] = useReducer(reducer, DEFAULT_STATE);
    const isMounted = useIsMounted();

    const run = useCallback(async (promise) => {
        dispatch({ type: 'loading' });
        try {
            const data = await promise;
            if (isMounted()) {
                dispatch({ type: 'success', payload: data });
            }
            return data;
        } catch (e) {
            if (isMounted() && e.name !== 'AbortError') {
                dispatch({ type: 'error', payload: e });
            }
            throw e;
        }
    }, []);

    return {
        result,
        error,
        loading,
        run
    };
};

export default useAsync;
