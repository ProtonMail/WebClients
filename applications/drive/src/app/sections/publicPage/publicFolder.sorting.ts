import { SortField } from '../../modules/sorting/types';
import type { PublicFolderItem } from './usePublicFolder.store';

export function getPublicFolderSortValue(item: PublicFolderItem, field: SortField): unknown {
    switch (field) {
        case SortField.name:
            return item.name;
        case SortField.nodeType:
            return item.type;
        case SortField.size:
            return item.size;
        case SortField.uploadedBy:
            return item.uploadedBy;
        default:
            return undefined;
    }
}
