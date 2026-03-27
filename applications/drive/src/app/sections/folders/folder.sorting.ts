import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import {
    type SortConfig,
    SortField,
    dateComparator,
    numberComparator,
    sortItems,
    stringComparator,
} from '../../modules/sorting';
import { nodeTypeComparator } from '../../modules/sorting/comparators';
import type { FolderViewItem } from './useFolder.store';

export function getFolderSortValue(item: FolderViewItem, field: SortField) {
    switch (field) {
        case SortField.name:
            return item.name;
        case SortField.nodeType:
            return item.type;
        case SortField.size:
            return item.size;
        case SortField.modificationTime:
            return item.fileModifyTime;
        default:
            return undefined;
    }
}

export function getFolderSortConfig(field: SortField): SortConfig {
    switch (field) {
        case SortField.name:
            return [
                { field: SortField.nodeType, comparator: nodeTypeComparator, direction: SORT_DIRECTION.ASC },
                { field: SortField.name, comparator: stringComparator },
            ];
        case SortField.modificationTime:
            return [
                { field: SortField.modificationTime, comparator: dateComparator },
                { field: SortField.name, comparator: stringComparator, direction: SORT_DIRECTION.ASC },
            ];
        case SortField.size:
            return [
                { field: SortField.size, comparator: numberComparator },
                { field: SortField.nodeType, comparator: nodeTypeComparator },
                { field: SortField.name, comparator: stringComparator, direction: SORT_DIRECTION.ASC },
            ];
        default:
            return [{ field: SortField.name, comparator: stringComparator }];
    }
}

export function sortFolderItems(items: FolderViewItem[], sortField: SortField, direction: SORT_DIRECTION): string[] {
    const sortConfig = getFolderSortConfig(sortField);
    return sortItems(items, sortConfig, direction, getFolderSortValue, (item) => item.uid);
}
