import { useEffect, useState } from 'react';

import { type SortConfig, useMultiSortedList } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { type LinkShareUrl } from '../../store';
import { logError } from '../../utils/errorHandling';

export enum SortField {
    name = 'name',
    mimeType = 'mimeType',
    metaDataModifyTime = 'metaDataModifyTime',
    fileModifyTime = 'fileModifyTime',
    size = 'size',
    linkCreateTime = 'linkCreateTime',
    linkExpireTime = 'linkExpireTime',
    numAccesses = 'numAccesses',
    trashed = 'trashed',
    sharedOn = 'sharedOn',
    sharedBy = 'sharedBy',
    uploadedBy = 'uploadedBy',
}

export interface SortParams<T extends SortField = SortField> {
    sortField: T;
    sortOrder: SORT_DIRECTION;
}

interface LinkSortFields {
    isFile: boolean;
    name: string;
    mimeType: string;
    size: number;
    metaDataModifyTime: number;
    fileModifyTime: number;
    trashed: number | null;
    shareUrl?: LinkShareUrl;
    sharedOn?: number;
    sharedBy?: string;
    signatureEmail?: string;
}

/**
 * useSorting sorts provided list based on `sortParams`.
 */
export function useSorting<T extends SortField, Item extends LinkSortFields>(list: Item[], sortParams: SortParams<T>) {
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
export function useSortingWithDefault<T extends SortField, Item extends LinkSortFields>(
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
export function useControlledSorting<T extends SortField, Item extends LinkSortFields>(
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
        [key in SortField]: SortConfig<LinkSortFields>[];
    } = {
        name: [{ key: 'isFile', direction: SORT_DIRECTION.ASC }, getNameSortConfig(direction)],
        mimeType: [{ key: 'mimeType', direction }, { key: 'isFile', direction }, getNameSortConfig()],
        metaDataModifyTime: [{ key: 'metaDataModifyTime', direction }, getNameSortConfig()],
        fileModifyTime: [{ key: 'fileModifyTime', direction }, getNameSortConfig()],
        size: [{ key: 'isFile', direction }, { key: 'size', direction }, getNameSortConfig()],
        linkCreateTime: [getShareLinkCreatedSortConfig(direction), { key: 'isFile', direction }, getNameSortConfig()],
        linkExpireTime: [getShareLinkExpiresSortConfig(direction), { key: 'isFile', direction }, getNameSortConfig()],
        numAccesses: [getShareLinkNumAccessesSortConfig(direction), { key: 'isFile', direction }, getNameSortConfig()],
        trashed: [{ key: 'trashed', direction }, getNameSortConfig()],
        sharedOn: [{ key: 'sharedOn', direction }, getNameSortConfig()],
        sharedBy: [{ key: 'sharedBy', direction }, getNameSortConfig()],
        uploadedBy: [{ key: 'signatureEmail', direction }, getNameSortConfig()],
    };
    return configs[sortField];
}

function getNameSortConfig(direction = SORT_DIRECTION.ASC) {
    return {
        key: 'name' as keyof LinkSortFields,
        direction,
        compare: (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }),
    };
}

function getShareLinkCreatedSortConfig(direction = SORT_DIRECTION.ASC) {
    return {
        key: 'shareUrl' as keyof LinkSortFields,
        direction,
        compare: (a?: LinkShareUrl, b?: LinkShareUrl) => {
            return (a?.createTime || Infinity) - (b?.createTime || Infinity);
        },
    };
}

function getShareLinkExpiresSortConfig(direction = SORT_DIRECTION.ASC) {
    return {
        key: 'shareUrl' as keyof LinkSortFields,
        direction,
        compare: (a?: LinkShareUrl, b?: LinkShareUrl) => {
            return (a?.expireTime || Infinity) - (b?.expireTime || Infinity);
        },
    };
}

function getShareLinkNumAccessesSortConfig(direction = SORT_DIRECTION.ASC) {
    return {
        key: 'shareUrl' as keyof LinkSortFields,
        direction,
        compare: (a?: LinkShareUrl, b?: LinkShareUrl) => {
            return (a?.numAccesses || 0) - (b?.numAccesses || 0);
        },
    };
}
