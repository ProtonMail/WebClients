import { useContext, useRef, useEffect, useCallback, useReducer } from 'react';
import ContextApi from 'proton-shared/lib/context/api';

import useIsMounted from './useIsMounted';

const defaultState = {
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
                data: action.payload
            };
        case 'error':
            return {
                data: undefined,
                loading: false,
                error: action.payload
            };
    }
};

const useApi = (fn, dependencies = []) => {
    const [{ loading, data, error }, dispatch] = useReducer(reducer, defaultState);
    const isMounted = useIsMounted();
    const { api } = useContext(ContextApi);
    const abortRef = useRef();

    const cancel = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = undefined;
        }
    }, []);

    const call = useCallback(
        (config) => {
            cancel();

            const abortController = new AbortController();
            abortRef.current = abortController;

            const promise = api({
                signal: abortController.signal,
                ...config
            });

            dispatch({ type: 'loading' });
            return promise
                .then((data) => {
                    if (!isMounted()) {
                        return;
                    }
                    dispatch({ type: 'success', payload: data });
                })
                .catch((error) => {
                    if (error.name === 'AbortError' || !isMounted()) {
                        return;
                    }
                    dispatch({ type: 'error', payload: error });
                    throw error;
                });
        },
        [api, dispatch]
    );

    const request = useCallback(
        (args) => {
            return call(fn(args));
        },
        [call, ...dependencies]
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
    }, [...dependencies]);

    return {
        data,
        error,
        loading,
        request,
        cancel
    };
};

export default useApi;
