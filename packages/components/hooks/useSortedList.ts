import { useState, useMemo } from 'react';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';

interface Config<T> {
    key: keyof T;
    direction: SORT_DIRECTION;
}

/**
 * Handles multi-parameter sorting logic for lists
 */
export const useMultiSortedList = <T>(list: T[], initialConfig: Config<T>[] = []) => {
    const [configs, setConfigs] = useState(initialConfig);

    const sortedList = useMemo(() => {
        if (!configs.length) {
            return list;
        }

        const comparator = (a: T, b: T) => {
            const compare = (key: keyof T, a: T, b: T) => {
                if (a[key] < b[key]) {
                    return -1;
                }
                if (a[key] > b[key]) {
                    return 1;
                }
                return 0;
            };

            for (let i = 0; i < configs.length; i++) {
                const result =
                    configs[i].direction === SORT_DIRECTION.ASC
                        ? compare(configs[i].key, a, b)
                        : compare(configs[i].key, b, a);
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
const useSortedList = <T>(list: T[], initialConfig?: Config<T>) => {
    const { setConfigs, sortConfigs, sortedList } = useMultiSortedList(list, initialConfig && [initialConfig]);

    const toggleSort = (key: keyof T) => {
        if (key === sortConfigs[0]?.key) {
            setConfigs((configs) => [
                {
                    key,
                    direction: configs[0]?.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC
                }
            ]);
        } else {
            setConfigs([{ key, direction: SORT_DIRECTION.ASC }]);
        }
    };

    const setSort = (key: keyof T, direction: SORT_DIRECTION) => {
        setConfigs([{ key, direction }]);
    };

    return { sortConfig: sortConfigs[0], sortedList, setSort, toggleSort };
};

/**
 * Handles sorting logic, when data is async.
 */
export const useSortedListAsync = <T>(initialConfig: Config<T>) => useSortedList([], initialConfig);

export default useSortedList;
