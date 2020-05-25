import { useState, useMemo } from 'react';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';

interface Config<T> {
    key: keyof T;
    direction: SORT_DIRECTION;
}

/**
 * Handles sorting logic for lists.
 */
const useSortedList = <T>(list: T[], initialConfig?: Config<T>) => {
    const [config, setConfig] = useState(initialConfig);

    const sortedList = useMemo(() => {
        if (!config) {
            return list;
        }

        const comparator = (a: T, b: T) => {
            if (a[config.key] < b[config.key]) {
                return -1;
            }
            if (a[config.key] > b[config.key]) {
                return 1;
            }
            return 0;
        };
        return config.direction === SORT_DIRECTION.ASC
            ? [...list].sort(comparator)
            : [...list].sort((a, b) => comparator(b, a));
    }, [config, list]);

    const toggleSort = (key: keyof T) => {
        if (key === config?.key) {
            setConfig((config) => ({
                key,
                direction: config?.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC
            }));
        } else {
            setConfig({ key, direction: SORT_DIRECTION.ASC });
        }
    };

    const setSort = (key: keyof T, direction: SORT_DIRECTION) => {
        setConfig({ key, direction });
    };

    return { sortConfig: config, sortedList, setSort, toggleSort };
};

/**
 * Handles sorting logic, when data is async.
 */
export const useSortedListAsync = <T>(initialConfig: Config<T>) => useSortedList([], initialConfig);

export default useSortedList;
