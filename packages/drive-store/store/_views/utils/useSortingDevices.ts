import { useEffect, useState } from 'react';

import { useMultiSortedList } from '@proton/components';
import { SortConfig } from '@proton/components/hooks/useSortedList';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { logError } from '../../../utils/errorHandling';

export enum SortField {
    name = 'name',
    modificationTime = 'modificationTime',
}

// TODO: check later and maybe merge two files somehow
interface SortParams<T extends SortField = SortField> {
    sortField: T;
    sortOrder: SORT_DIRECTION;
}

interface DeviceSortFields {
    name: string;
    modificationTime: number;
}

/**
 * useSorting sorts provided list based on `sortParams`.
 */
export function useSorting<T extends SortField, Item extends DeviceSortFields>(
    list: Item[],
    sortParams: SortParams<T>
) {
    const { sortedList, setSorting } = useControlledSorting(list, sortParams, async () => undefined);
    useEffect(() => {
        void setSorting(sortParams);
    }, [sortParams]);
    return sortedList;
}

/**
 * useSortingWithDefault sorts provided list based on `defaultSortParams`
 * which can be changed by returned `setSorting` callback.
 */
export function useSortingWithDefault<T extends SortField, Item extends DeviceSortFields>(
    list: Item[],
    defaultSortParams: SortParams<T>
) {
    const [sortParams, setSortParams] = useState(defaultSortParams);
    return useControlledSorting(list, sortParams, async (newSortParams) => setSortParams(newSortParams));
}

/**
 * useControlledSorting sorts provided list based on `sortParams`
 * which can be changed by returned `setSorting` callback. Whenever
 * the sort changes, `changeSort` callback is called.
 */
export function useControlledSorting<T extends SortField, Item extends DeviceSortFields>(
    list: Item[],
    sortParams: SortParams<T>,
    changeSort: (sortParams: SortParams<T>) => Promise<void>
) {
    const { sortedList, setConfigs } = useMultiSortedList(list, sortParamsToSortConfig(sortParams));

    const setSorting = async (sortParams: SortParams<T>) => {
        setConfigs(sortParamsToSortConfig(sortParams));
        changeSort(sortParams).catch(logError);
    };

    return {
        sortedList,
        sortParams,
        setSorting,
    };
}

function sortParamsToSortConfig({ sortField, sortOrder: direction }: SortParams) {
    const configs: {
        [key in SortField]: SortConfig<DeviceSortFields>[];
    } = {
        name: [getNameSortConfig(direction)],
        modificationTime: [{ key: 'modificationTime', direction }, getNameSortConfig()],
    };
    return configs[sortField];
}

function getNameSortConfig(direction = SORT_DIRECTION.ASC) {
    return {
        key: 'name' as SortField,
        direction,
        compare: (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }),
    };
}
