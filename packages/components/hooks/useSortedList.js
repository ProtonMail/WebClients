import { useState } from 'react';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';

/**
 * Handles sorting logic for lists that are used in sortable tables.
 *
 * @param {Array} list
 * @param {{ key: string, direction: string }} [initialConfig]
 */
const useSortedList = (list, initialConfig) => {
    const [config, setConfig] = useState(initialConfig);

    const comparator = (a, b) => {
        if (a[config.key] < b[config.key]) {
            return -1;
        }
        if (a[config.key] > b[config.key]) {
            return 1;
        }
        return 0;
    };

    const sortedList = config
        ? config.direction === SORT_DIRECTION.ASC
            ? [...list].sort(comparator)
            : [...list].sort((a, b) => comparator(b, a))
        : list;

    const toggleSort = (key) => {
        if (config && key === config.key) {
            setConfig((config) => ({
                key,
                direction: config.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC
            }));
        } else {
            setConfig({ key, direction: SORT_DIRECTION.ASC });
        }
    };

    return { sortedList, toggleSort, sortConfig: config };
};

/**
 * Handles sorting logic, when data is async
 *
 * @param {{ key: string, direction: string }} [initialConfig]
 */
export const useSortedListAsync = (initialConfig) => useSortedList([], initialConfig);

export default useSortedList;
