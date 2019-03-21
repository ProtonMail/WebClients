import { useReducer, useCallback, useRef, useEffect } from 'react';
import { useIsMounted } from 'react-components';

const id = (x) => x;
const defaultMerge = (oldState, newState) => newState;

const init = (data) => {
    return {
        data,
        loading: false,
        initialized: !!data
    };
};

const reducer = (state, action) => {
    if (action.type === 'loading') {
        return {
            ...state,
            loading: true
        };
    }

    if (action.type === 'success') {
        return init(action.payload);
    }

    if (action.type === 'error') {
        return {
            data: state.data,
            error: action.payload,
            loading: false,
            initialized: state.initialized
        };
    }
};

/**
 * Creates an async fn model hook.
 * @param {function} async fn
 * @param {function} transform
 * @param {function} merge
 * @return {function} the created hook
 */
const createUseModelHook = ({ useAsyncFn, transform = id, merge = defaultMerge }) => {
    return ({ initialValue } = {}) => {
        const [state, dispatch] = useReducer(reducer, transform(initialValue), init);
        const promiseRef = useRef({});
        const stateRef = useRef();
        const isMounted = useIsMounted();
        const asyncFn = useAsyncFn();

        /**
         * stateRef to make sure the latest state value is always used for the merge fn.
         * It's needed because the update function is initialized when creating e.g. the event manager
         * and so it wouldn't get updates.
         */
        stateRef.current = state;

        const load = useCallback(() => {
            const currentPromise = promiseRef.current.promise;
            if (currentPromise) {
                return currentPromise;
            }

            dispatch({ type: 'loading' });

            const abortController = new AbortController();

            const promise = asyncFn(abortController.signal)
                .then((data) => {
                    promiseRef.current = {};
                    const payload = transform(data);
                    if (isMounted()) {
                        dispatch({ type: 'success', payload });
                    }
                    return payload;
                })
                .catch((error) => {
                    promiseRef.current = {};
                    if (isMounted()) {
                        dispatch({ type: 'error', payload: error });
                    }
                    throw error;
                });

            promiseRef.current = {
                abortController,
                promise
            };

            return promise;
        }, []);

        const update = useCallback((data) => {
            const currentState = stateRef.current;
            if (!currentState.initialized) {
                return;
            }
            const payload = transform(merge(currentState, data));
            dispatch({ type: 'success', payload });
            return payload;
        }, []);

        useEffect(() => {
            return () => {
                const abortController = promiseRef.current.abortController;
                if (!abortController) {
                    return;
                }
                abortController.abort();
                promiseRef.current = {};
            };
        }, []);

        return [state, load, update];
    };
};

export default createUseModelHook;
