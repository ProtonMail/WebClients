import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { dateComparator, stringComparator } from '../../modules/sorting/comparators';
import { type SortConfig, SortField } from '../../modules/sorting/types';
import { ItemType, type SharedWithMeItem } from './types';

export const defaultSharedWithMeSortConfig: SortConfig = [
    { field: SortField.sharedOn, comparator: dateComparator },
    { field: SortField.name, comparator: stringComparator, direction: SORT_DIRECTION.ASC },
];

export function getSharedWithMeSortValue(item: SharedWithMeItem, field: SortField): unknown {
    switch (field) {
        case SortField.name:
            return item.name;
        case SortField.nodeType:
            return item.type;
        case SortField.sharedOn:
            if (item.itemType === ItemType.BOOKMARK) {
                return item.bookmark.creationTime;
            }
            if (item.itemType === ItemType.DIRECT_SHARE) {
                return item.directShare.sharedOn;
            }
            return undefined;
        case SortField.sharedBy:
            return item.itemType === ItemType.DIRECT_SHARE ? item.directShare.sharedBy : '';
        default:
            return undefined;
    }
}
