import { useEffect, useReducer, useRef } from 'react';
import { STATUS } from 'proton-shared/lib/models/cache';

/**
 * Shallowly compare the values of the dependency arrays
 * @param {Array} a
 * @param {Array} b
 * @return {boolean}
 */
const areDependenciesEqual = (a, b) => {
    if (!a) {
        return false;
    }
    for (let i = 0; i < a.length && i < b.length; i++) {
        if (a[i] === b[i]) {
            continue;
        }
        return false;
    }
    return true;
};

const getState = ({ value, status } = { status: STATUS.PENDING }) => {
    return [
        status === STATUS.PENDING || status === STATUS.RESOLVED ? value : undefined,
        status === STATUS.PENDING || status === STATUS.REJECTED
    ];
};

const reducer = (oldValue, record = { status: STATUS.PENDING }) => {
    if (record.status === STATUS.REJECTED) {
        /**
         * Throw an error if the promise is rejected.
         * 1) When it throws, the ErrorBoundary will be rendered
         * 2) When the component is re-rendered, the async fn will be retried
         */
        throw record.value;
    }
    const newValue = getState(record);
    if (areDependenciesEqual(oldValue, newValue)) {
        return oldValue;
    }
    return newValue;
};

/**
 * The difference with this hook vs `useCachedAsyncResult` is that this hook does not cache the result in the cache.
 * This hook stores it per component, which means the promise will always be re-run on initial mount.
 * @param miss
 * @param dependencies
 * @return {React.ReducerState<reducer>}
 */
const usePromiseResult = (miss, dependencies) => {
    const ref = useRef();
    const unmountedRef = useRef(false);
    const [state, dispatch] = useReducer(reducer, undefined, getState);

    useEffect(() => {
        return () => {
            unmountedRef.current = true;
        };
    }, []);

    useEffect(() => {
        const promise = miss();

        const record = {
            status: STATUS.PENDING,
            value: ref.current ? ref.current.value : undefined,
            promise,
            dependencies
        };
        ref.current = record;
        dispatch(record);

        promise
            .then((value) => {
                return {
                    status: STATUS.RESOLVED,
                    value,
                    dependencies
                };
            })
            .catch((error) => {
                return {
                    status: STATUS.REJECTED,
                    value: error,
                    dependencies
                };
            })
            .then((record) => {
                if (unmountedRef.current) {
                    ref.current = undefined;
                    return;
                }
                const oldRecord = ref.current;
                // Ensure it's the latest promise that is running
                if (oldRecord.promise !== promise) {
                    return;
                }
                ref.current = record;
                dispatch(record);
            });
    }, dependencies);

    return state;
};

export default usePromiseResult;
