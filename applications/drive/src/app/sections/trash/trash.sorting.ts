import { SortField } from '../../modules/sorting/types';
import type { TrashItem } from './useTrash.store';

export function getTrashSortValue(item: TrashItem, field: SortField) {
    switch (field) {
        case SortField.name:
            return item.name;
        case SortField.nodeType:
            return item.type;
        case SortField.size:
            return item.size;
        case SortField.trashedTime:
            return item.trashTime;
        case SortField.modificationTime:
            return item.modificationTime;
        case SortField.location:
            return item.location ?? '';
        default:
            return undefined;
    }
}
