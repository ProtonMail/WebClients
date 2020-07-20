import { useEffect, useReducer, useRef } from 'react';
import { STATUS } from 'proton-shared/lib/models/cache';

const getState = ({ value, status } = { status: STATUS.PENDING }) => {
    return [
        status === STATUS.PENDING || status === STATUS.RESOLVED ? value : undefined,
        status === STATUS.PENDING || status === STATUS.REJECTED,
        status === STATUS.REJECTED ? value : undefined,
    ];
};

const reducer = (oldValue, record = { status: STATUS.PENDING }) => {
    const newValue = getState(record);
    if (newValue.every((value, i) => value === oldValue[i])) {
        return oldValue;
    }
    return newValue;
};

/**
 * The difference with this hook vs `useCachedModelResult` is that this hook does not cache the result in the cache.
 * This hook stores it per component, which means the promise will always be re-run on initial mount.
 * @param {Function} miss
 * @param {Array} dependencies
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
        };
        ref.current = record;
        dispatch(record);

        promise
            .then((value) => {
                return {
                    status: STATUS.RESOLVED,
                    value,
                };
            })
            .catch((error) => {
                return {
                    status: STATUS.REJECTED,
                    value: error,
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
