import { noop } from '@proton/shared/lib/helpers/function';
import { LoadingMap, SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { useRef, useState, useEffect, useCallback } from 'react';

type WithLoadingMap = (promiseMap: { [key: string]: Promise<void> }) => Promise<void>;

const useLoadingMap = (initialState = {}): [LoadingMap, WithLoadingMap] => {
    const [loadingMap, setLoadingMap] = useState<LoadingMap>(initialState);
    const unmountedRef = useRef(false);
    const counterMapRef = useRef<SimpleMap<number>>({});

    useEffect(() => {
        return () => {
            unmountedRef.current = true;
        };
    }, []);

    const withLoadingMap = useCallback<WithLoadingMap>((promiseMap) => {
        if (!promiseMap) {
            setLoadingMap({});
            return Promise.resolve();
        }
        const counterMapNext = Object.keys(promiseMap).reduce<SimpleMap<number>>(
            (acc, key) => {
                const currentCounter = acc[key] || 0;
                acc[key] = currentCounter + 1;
                return acc;
            },
            { ...counterMapRef.current }
        );
        counterMapRef.current = counterMapNext;
        const initialMap = Object.fromEntries(Object.keys(promiseMap).map((key) => [key, true]));
        setLoadingMap(initialMap);
        return Promise.all(
            Object.entries(promiseMap).map(([key, promise]) => {
                return promise.catch(noop).finally(() => {
                    // Ensure that the latest promise is setting the new state
                    if (counterMapRef.current[key] !== counterMapNext[key] || unmountedRef.current) {
                        return;
                    }
                    setLoadingMap((loadingMap) => ({
                        ...loadingMap,
                        [key]: false,
                    }));
                });
            })
        ).then(noop);
    }, []);

    return [loadingMap, withLoadingMap];
};

export default useLoadingMap;
