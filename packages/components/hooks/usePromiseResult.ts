import React, { useEffect, useReducer, useRef, Reducer } from 'react';
import { STATUS } from 'proton-shared/lib/models/cache';

type ResolvedRecord<T> = {
    status: STATUS.RESOLVED;
    value?: T;
};

type PendingRecord<T> = {
    status: STATUS.PENDING;
    value?: any;
    promise?: Promise<T>;
};

type RejectedRecord = { status: STATUS.REJECTED; value?: Error };

type Record<T> = ResolvedRecord<T> | PendingRecord<T> | RejectedRecord;

type State<T> = [T | undefined, boolean, Error | undefined];

const getState = <T>(record: Record<T> = { status: STATUS.PENDING }): State<T> => {
    return [
        record.status === STATUS.PENDING || record.status === STATUS.RESOLVED ? record.value : undefined,
        record.status === STATUS.PENDING || record.status === STATUS.REJECTED,
        record.status === STATUS.REJECTED ? record.value : undefined,
    ];
};

const reducer = <T>(oldValue: State<T>, record: Record<T> = { status: STATUS.PENDING }) => {
    const newValue = getState(record);
    if (newValue.every((value, i) => value === oldValue[i])) {
        return oldValue;
    }
    return newValue;
};

/**
 * The difference with this hook vs `useCachedModelResult` is that this hook does not cache the result in the cache.
 * This hook stores it per component, which means the promise will always be re-run on initial mount.
 */
const usePromiseResult = <T>(miss: () => Promise<T>, dependencies: React.DependencyList) => {
    const ref = useRef<Record<T>>();
    const unmountedRef = useRef(false);
    const [state, dispatch] = useReducer<Reducer<State<T>, Record<T>>, undefined>(reducer, undefined, getState);

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
        } as const;
        ref.current = record;
        dispatch(record);

        promise
            .then(
                (value): ResolvedRecord<T> => {
                    return {
                        status: STATUS.RESOLVED,
                        value,
                    };
                }
            )
            .catch(
                (error): RejectedRecord => {
                    return {
                        status: STATUS.REJECTED,
                        value: error,
                    };
                }
            )
            .then((record) => {
                if (unmountedRef.current) {
                    ref.current = undefined;
                    return;
                }
                const oldRecord = ref.current;
                // Ensure it's the latest promise that is running
                if (!oldRecord || ('promise' in oldRecord && oldRecord.promise !== promise)) {
                    return;
                }
                ref.current = record;
                dispatch(record);
            });
    }, dependencies);

    return state;
};

export default usePromiseResult;
