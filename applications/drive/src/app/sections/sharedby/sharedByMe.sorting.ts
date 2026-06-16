import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { nodeTypeComparator, stringComparator } from '../../modules/sorting/comparators';
import { type SortConfig, SortField } from '../../modules/sorting/types';
import type { SharedByMeItem } from './useSharedByMe.store';

export const defaultSharedByMeSortConfig: SortConfig = [
    { field: SortField.nodeType, comparator: nodeTypeComparator, direction: SORT_DIRECTION.ASC },
    { field: SortField.name, comparator: stringComparator },
];

export function getSharedByMeSortValue(item: SharedByMeItem, field: SortField) {
    switch (field) {
        case SortField.name:
            return item.name;
        case SortField.nodeType:
            return item.type;
        case SortField.creationTime:
            return item.creationTime;
        case SortField.expirationTime:
            return item.publicLink?.expirationTime;
        case SortField.numberOfInitializedDownloads:
            return item.publicLink?.numberOfInitializedDownloads;
        default:
            return undefined;
    }
}
