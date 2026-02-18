import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { SortField } from '../../../modules/sorting/types';
import { defaultNameCellConfig } from '../../commonDriveExplorerCells/NameCell';
import type { SearchResultItemUI } from './store';

export const defaultSort = {
    sortField: SortField.location,
    direction: SORT_DIRECTION.ASC,
    sortConfig: defaultNameCellConfig.sortConfig,
};

export function getSearchResultItemSortValue(item: SearchResultItemUI, field: SortField): unknown {
    switch (field) {
        case SortField.name:
            return item.name;
        case SortField.nodeType:
            return item.type;
        case SortField.modificationTime:
            return item.modificationTime;
        case SortField.size:
            return item.size;
        case SortField.location:
            return item.location;
        default:
            return undefined;
    }
}
