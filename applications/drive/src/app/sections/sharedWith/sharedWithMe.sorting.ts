import { SortField } from '../../modules/sorting/types';
import { ItemType, type SharedWithMeItem } from './types';

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
