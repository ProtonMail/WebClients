import { useState } from 'react';

import { type SortConfig, useMultiSortedList } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import type { LinkShareUrl } from '../../_links/interface';

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
 * useSortingWithDefault sorts provided list based on `defaultSortParams`.
 */
export function useSortingWithDefault<T extends SortField, Item extends LinkSortFields>(
    list: Item[],
    defaultSortParams: SortParams<T>
) {
    const [sortParams] = useState(defaultSortParams);
    return useControlledSorting(list, sortParams);
}

/**
 * useControlledSorting sorts provided list based on `sortParams`.
 */
function useControlledSorting<T extends SortField, Item extends LinkSortFields>(
    list: Item[],
    sortParams: SortParams<T>
) {
    const { sortedList } = useMultiSortedList(list, sortParamsToSortConfig(sortParams));

    return { sortedList };
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
