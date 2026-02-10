import { useMemo, useRef, useState } from 'react';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';

export interface SortConfig<T> {
    key: keyof T;
    direction: SORT_DIRECTION;
    compare?: (a: any, b: any) => number;
}

/**
 * Handles multi-parameter sorting logic for lists
 */
export const useMultiSortedList = <T>(list: T[], initialConfig: SortConfig<T>[] = []) => {
    const [configs, setConfigs] = useState(initialConfig);

    const sortedList = useMemo(() => {
        if (!configs.length) {
            return list;
        }

        const comparator = (a: T, b: T) => {
            const defaultCompare = (a: T[keyof T], b: T[keyof T]) => {
                if (typeof a === 'string' && typeof b === 'string') {
                    return a.localeCompare(b);
                }
                if (a < b) {
                    return -1;
                }
                if (a > b) {
                    return 1;
                }
                return 0;
            };

            for (let i = 0; i < configs.length; i++) {
                const config = configs[i];
                const { key } = config;
                const compare = ('compare' in config && config.compare) || defaultCompare;
                const result =
                    config.direction === SORT_DIRECTION.ASC ? compare(a[key], b[key]) : compare(b[key], a[key]);

                if (result !== 0) {
                    return result;
                }
            }
            return 0;
        };

        return [...list].sort(comparator);
    }, [configs, list]);

    return { sortConfigs: configs, sortedList, setConfigs };
};

/**
 * Handles sorting logic for lists.
 */
const useSortedList = <T>(list: T[], initialConfig?: SortConfig<T>) => {
    const initialConfigRef = useRef(initialConfig);
    initialConfigRef.current = initialConfig;

    const { setConfigs, sortConfigs, sortedList } = useMultiSortedList(list, initialConfig && [initialConfig]);

    const configForKey = (key: keyof T, direction: SORT_DIRECTION): SortConfig<T> => {
        const initial = initialConfigRef.current;
        const useInitialCompare = initial?.key === key && initial?.compare;
        return useInitialCompare ? { key, direction, compare: initial.compare } : { key, direction };
    };

    const toggleSort = (key: keyof T) => {
        if (key === sortConfigs[0]?.key) {
            setConfigs((configs) => [
                {
                    ...configs[0],
                    key,
                    direction: configs[0]?.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC,
                },
            ]);
        } else {
            setConfigs([configForKey(key, SORT_DIRECTION.ASC)]);
        }
    };

    const setSort = (key: keyof T, direction: SORT_DIRECTION) => {
        setConfigs((configs) => {
            const existing = configs[0];
            if (existing?.key === key && existing.compare) {
                return [{ ...existing, key, direction }];
            }
            return [configForKey(key, direction)];
        });
    };

    return { sortConfig: sortConfigs[0], sortedList, setSort, toggleSort };
};

/**
 * Handles sorting logic, when data is async.
 */
export const useSortedListAsync = <T>(initialConfig: SortConfig<T>) => useSortedList([], initialConfig);

export default useSortedList;
